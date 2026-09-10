#!/usr/bin/env python3
"""Run the shore station: receive packets continuously and append them to daily CSVs.

This is what the systemd unit starts on boot (``shore/deploy/scout-shore.service``). It runs
until stopped, and is designed to be restarted freely — the CSV store is idempotent on
``(buoy_id, record_seq)``, so a restart mid-day re-reads what it already has without
duplicating rows.

    # Against the real radio on the Pi:
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
from pathlib import Path

# Allow running as a script without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore import CsvStore, MockLoRaLink, Receiver  # noqa: E402
from scout_shore.service import ReceiverService, ServiceConfig  # noqa: E402


def _build_link(kind: str):
    """Construct the radio backend.

    ``rfm9x`` is imported lazily and only when asked for: the module pulls in Blinka and
    ``adafruit_rfm9x``, which are not installed on a development machine and are not needed to
    run the mock path or the tests.
    """
    if kind == "mock":
        return MockLoRaLink()
    from scout_shore.radio import Rfm9xLink  # noqa: PLC0415 — deliberate: see docstring

    return Rfm9xLink()


def main() -> int:
    parser = argparse.ArgumentParser(description="SCOUT shore station receiver service")
    parser.add_argument(
        "--link", choices=("rfm9x", "mock"), default="rfm9x",
        help="radio backend (default: the real SX1276)",
    )
    parser.add_argument(
        "--out", type=Path, default=Path("data-live"),
        help="directory for received daily CSVs (default: data-live, what the site publishes)",
    )
    parser.add_argument("--poll-interval", type=float, default=1.0, help="seconds between polls when idle")
    parser.add_argument("--stats-interval", type=float, default=3600.0, help="seconds between stats log lines")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        # No timestamp: journald adds its own, and two is noise in `journalctl`.
        format="%(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("scout_shore")

    try:
        link = _build_link(args.link)
    except RuntimeError as exc:  # radio packages missing — the message says what to install
        log.error("%s", exc)
        return 1

    service = ReceiverService(
        Receiver(link, CsvStore(args.out)),
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
        "decode_errors=%d schema_errors=%d link_errors=%d",
        stats.received, stats.stored, stats.duplicates,
        stats.decode_errors, stats.schema_errors, service.link_errors,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
