#!/usr/bin/env python3
"""Sync the shore station with the S.C.O.U.T. Console (SCO-198): push received readings, pull
the transmit count requested for each buoy, and hand it to the ESP32 receiver.

    SCOUT_CONSOLE_URL=https://... SCOUT_CONSOLE_TOKEN=... \\
        python scripts/sync_console.py --data data-live --serial /dev/cu.usbmodem1101

Without ``--serial`` it prints the ``N<buoy>:<count>`` lines to type into the ESP32's USB
console. The ESP32 then sends SET_TX_COUNT after each buoy's packet, but only in a
SCOUT_DOWNLINK build (off by default, pending ECE sign-off and the FCC check).

Readings already pushed are skipped: the console stores on (buoy_id, record_seq) and ignores
repeats, so pushing a whole day again is safe. Standard library only.
"""

from __future__ import annotations

import argparse
import csv
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore.console import ConsoleClient, ConsoleConfig, ConsoleError, set_commands  # noqa: E402

log = logging.getLogger("scout_shore.sync")


def _rows(data_dir: Path, newest_files: int) -> list[dict[str, str]]:
    files = sorted(data_dir.glob("SCOUT-*_*.csv"))[-newest_files:]
    rows: list[dict[str, str]] = []
    for path in files:
        with path.open(newline="") as handle:
            rows.extend(csv.DictReader(handle))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data", type=Path, default=Path("data-live"), help="received CSVs")
    parser.add_argument("--files", type=int, default=2, help="newest daily files to push")
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
        requested = client.requested_counts()
    except ConsoleError as exc:
        log.error("%s", exc)
        return 1
    log.info("pushed: %d new rows; requested counts: %s", stored, requested or "none")

    lines = set_commands(requested)
    if args.serial is None:
        for line in lines:
            print(line)  # noqa: T201 — this script's output is the commands to type
        return 0
    try:
        with args.serial.open("w") as port:  # USB CDC: the baud rate does not apply
            for line in lines:
                port.write(line + "\n")
    except OSError as exc:
        log.error("could not write to %s: %s", args.serial, exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
