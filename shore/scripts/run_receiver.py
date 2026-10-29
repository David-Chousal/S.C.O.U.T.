#!/usr/bin/env python3
"""Run the shore station: receive packets continuously and append them to daily CSVs.

This is what the systemd unit starts on boot (``shore/deploy/scout-shore.service``). It runs
until stopped, and is designed to be restarted freely — the CSV store is idempotent on
``(buoy_id, record_seq)``, so a restart mid-day re-reads what it already has without
duplicating rows.

    # The shore station: the ESP32-S3 receiver plugged in over USB (SCO-257):
    python scripts/run_receiver.py --link serial --serial /dev/ttyACM0 --out data-live

    # Replay a saved S3 log once, then exit (its readings keep their own timestamps):
    python scripts/run_receiver.py --link serial --serial s3.log --out data-live

    # A radio wired straight to a Raspberry Pi (fallback, never run on hardware):
    python scripts/run_receiver.py --link rfm9x --out data-live

    # No hardware — exercises the whole path with the simulator's mock link:
    python scripts/run_receiver.py --link mock --out data

``--out data-live`` is the tracked directory the published dashboard reads from; see
``shore/data-live/README.md``. Point it anywhere else and the site will not pick the data up.
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow running as a script without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore import CsvStore, MockLoRaLink, Receiver  # noqa: E402
from scout_shore.serial_link import SerialFrameLink  # noqa: E402
from scout_shore.service import ReceiverService, ServiceConfig  # noqa: E402


def _build_link(kind: str, serial: Path | None):
    """Construct the link.

    ``serial`` reads the ESP32-S3 shore receiver's output; ``rfm9x`` is imported lazily and only when asked for: the module pulls in Blinka and
    ``adafruit_rfm9x``, which are not installed on a development machine and are not needed to
    run the mock path or the tests.
    """
    if kind == "mock":
        return MockLoRaLink()
    if kind == "serial":
        return SerialFrameLink(serial)
    from scout_shore.radio import Rfm9xLink  # noqa: PLC0415 — deliberate: see docstring

    return Rfm9xLink()


def _tx_count(text: str) -> tuple[int, int]:
    """``BUOY:COUNT`` → (buoy_id, count), count 1-3 (SCO-198)."""
    try:
        buoy, count = (int(part) for part in text.split(":"))
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"expected BUOY:COUNT, got {text!r}") from exc
    if count not in (1, 2, 3) or buoy < 1:
        raise argparse.ArgumentTypeError(f"count must be 1-3 and buoy >= 1, got {text!r}")
    return buoy, count


def _replay(path: Path, out: Path, log: logging.Logger) -> int:
    """Store a saved S3 log once and exit. No slot-window check: arrival time is not now."""
    link = SerialFrameLink(path)
    receiver = Receiver(link, CsvStore(out))
    receiver.drain()
    s = receiver.stats
    log.info(
        "replayed %s: received=%d stored=%d duplicates=%d decode_errors=%d schema_errors=%d "
        "malformed_lines=%d", path, s.received, s.stored, s.duplicates, s.decode_errors,
        s.schema_errors, link.malformed_lines,
    )
    return 0 if s.decode_errors == s.schema_errors == link.malformed_lines == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="SCOUT shore station receiver service")
    parser.add_argument(
        "--link", choices=("serial", "rfm9x", "mock"), default="serial",
        help="serial: the ESP32-S3 shore receiver over USB (default); rfm9x: a radio wired to a "
             "Raspberry Pi (never run on hardware); mock: no hardware",
    )
    parser.add_argument(
        "--serial", type=Path,
        help="the S3's serial port (e.g. /dev/ttyACM0, /dev/cu.usbmodem1101) or a saved log to replay",
    )
    parser.add_argument(
        "--out", type=Path, default=Path("data-live"),
        help="directory for received daily CSVs (default: data-live, what the site publishes)",
    )
    parser.add_argument("--poll-interval", type=float, default=1.0, help="seconds between polls when idle")
    parser.add_argument("--stats-interval", type=float, default=3600.0, help="seconds between stats log lines")
    parser.add_argument(
        "--tx-count", type=_tx_count, action="append", default=[], metavar="BUOY:COUNT",
        help="daily transmit count requested for a buoy, for the slot-window check when its "
             "packets do not report one (repeatable; default 3)",
    )
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()
    if args.link == "serial" and args.serial is None:
        parser.error("--link serial needs --serial PORT_OR_LOG")

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        # No timestamp: journald adds its own, and two is noise in `journalctl`.
        format="%(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("scout_shore")

    if args.link == "serial" and args.serial.is_file():
        return _replay(args.serial, args.out, log)

    try:
        link = _build_link(args.link, args.serial)
    except RuntimeError as exc:  # radio packages missing — the message says what to install
        log.error("%s", exc)
        return 1

    service = ReceiverService(
        Receiver(link, CsvStore(args.out), clock=lambda: datetime.now(timezone.utc),
                 requested=dict(args.tx_count)),
        config=ServiceConfig(
            poll_interval_s=args.poll_interval,
            stats_interval_s=args.stats_interval,
        ),
    )
    service.install_signal_handlers()

    log.info("shore station up: link=%s out=%s", args.link, args.out)
    stats = service.run()
    log.info(
        "shore station down: received=%d stored=%d duplicates=%d "
        "decode_errors=%d schema_errors=%d link_errors=%d out_of_window=%d",
        stats.received, stats.stored, stats.duplicates,
        stats.decode_errors, stats.schema_errors, service.link_errors, stats.out_of_window,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
