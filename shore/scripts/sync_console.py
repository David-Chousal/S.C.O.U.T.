#!/usr/bin/env python3
"""Sync the shore station with the S.C.O.U.T. Console (SCO-198): push received readings, pull
what each buoy should run (transmit count and remote-settings snapshot), and hand it to the ESP32.

    SCOUT_CONSOLE_URL=https://... SCOUT_CONSOLE_TOKEN=... \\
        python scripts/sync_console.py --data data-live --serial /dev/cu.usbmodem1101

Without ``--serial`` it prints the ``N<buoy>:<count>`` and ``S<buoy>:<settings>`` lines to type
into the ESP32's USB console. The ESP32 then sends the settings (v5 buoys) or the count (v4 buoys)
right after each buoy's packet, whenever what the buoy reports differs.

Readings already pushed are skipped: the console stores on (buoy_id, record_seq) and ignores
repeats, so pushing a whole day again is safe. Standard library only.
"""

from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
import termios
import time
import tty
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore.console import (  # noqa: E402
    ConsoleClient,
    ConsoleConfig,
    ConsoleError,
    set_commands,
    settings_commands,
)
from scout_shore.serial_link import write_all  # noqa: E402

log = logging.getLogger("scout_shore.sync")

# Match push_firmware.py: the S3 reads USB between radio polls; a short gap keeps its buffer
# from filling, and raw mode stops the host from echoing command lines back into the S3.
LINE_GAP_S = 0.01


def _write_serial_lines(serial_path: Path, lines: list[str]) -> None:
    fd = os.open(str(serial_path), os.O_RDWR | os.O_NONBLOCK | os.O_NOCTTY)
    try:
        if os.isatty(fd):
            # TCSANOW keeps any RX bytes the companion receiver already queued (TCSAFLUSH would drop them).
            tty.setraw(fd, when=termios.TCSANOW)
        for line in lines:
            write_all(fd, (line + "\n").encode("ascii"))
            time.sleep(LINE_GAP_S)
    finally:
        os.close(fd)


def _newest_per_buoy(data_dir: Path, newest_files: int) -> list[Path]:
    # Files are SCOUT-NN_YYYYMMDD.csv: a global sort would let the highest buoy id fill the whole
    # window, so the newest N days are picked per buoy.
    by_buoy: dict[str, list[Path]] = {}
    for path in sorted(data_dir.glob("SCOUT-*_*.csv")):
        by_buoy.setdefault(path.name.split("_", 1)[0], []).append(path)
    return [path for paths in by_buoy.values() for path in paths[-newest_files:]]


def _rows(data_dir: Path, newest_files: int) -> list[dict[str, str]]:
    files = _newest_per_buoy(data_dir, newest_files)
    rows: list[dict[str, str]] = []
    for path in files:
        with path.open(newline="") as handle:
            rows.extend(csv.DictReader(handle))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data", type=Path, default=Path("data-live"), help="received CSVs")
    parser.add_argument("--files", type=int, default=2, help="newest daily files to push, per buoy")
    parser.add_argument("--serial", type=Path, help="ESP32 USB serial device to write commands to")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    try:
        config = ConsoleConfig.from_env()
    except ConsoleError as exc:
        log.error("%s", exc)
        return 1
    if config is None:
        log.error("set SCOUT_CONSOLE_URL and SCOUT_CONSOLE_TOKEN (the shore's device token)")
        return 1
    client = ConsoleClient(config)
    try:
        stored = client.push_rows(_rows(args.data, args.files))
        requested, snapshots = client.wanted()
    except ConsoleError as exc:
        log.error("%s", exc)
        return 1
    log.info("pushed: %d new rows; requested counts: %s; settings for buoys: %s",
             stored, requested or "none", sorted(snapshots) or "none")

    # S after N: a snapshot carries the count too, so it is the last word for a v5 buoy.
    lines = set_commands(requested) + settings_commands(snapshots)
    if args.serial is None:
        for line in lines:
            print(line)  # noqa: T201 — this script's output is the commands to type
        return 0
    try:
        _write_serial_lines(args.serial, lines)
    except OSError as exc:
        log.error("could not write to %s: %s", args.serial, exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
