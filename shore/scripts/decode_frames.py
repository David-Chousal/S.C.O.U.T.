#!/usr/bin/env python3
"""Decode the bench LoRa receiver's output into readings (SCO-155, runbook Stage 4a).

Pipe the receiver's serial monitor in, or pass a saved log:

    pio device monitor -e feather_m0_rx | python3 scripts/decode_frames.py
    python3 scripts/decode_frames.py rx-log.txt --out bench-data

Each frame is CRC-checked and decoded with the same codec the shore station uses. With
``--out`` the readings also go through the shore CSV store, so the 3 blind copies of each
transmission collapse to one row: the Stage 4c dedupe check. Use a scratch directory, never
``data-live``; bench readings are not deployment data.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore import CsvStore, PacketError, decode  # noqa: E402
from scout_shore.bench_frames import parse_rx_line  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("log", nargs="?", help="receiver log file (default: stdin)")
    parser.add_argument("--out", type=Path, help="scratch directory for deduplicated CSV rows")
    args = parser.parse_args()

    if args.out is not None and args.out.name == "data-live":
        parser.error("--out data-live would publish bench readings; use a scratch directory")

    store = CsvStore(args.out) if args.out else None
    frames = decoded = bad = rows = 0
    rssis: list[int] = []
    source = open(args.log) if args.log else sys.stdin
    with source:
        for line_no, line in enumerate(source, start=1):
            try:
                rx = parse_rx_line(line)
            except ValueError as exc:
                bad += 1
                print(f"line {line_no}: malformed frame line: {exc}", file=sys.stderr)
                continue
            if rx is None:
                continue
            frames += 1
            rssis.append(rx.rssi)
            try:
                reading = decode(rx.payload)
            except PacketError as exc:
                bad += 1
                print(f"line {line_no}: rssi={rx.rssi} snr={rx.snr}: {exc}", file=sys.stderr)
                continue
            decoded += 1
            print(f"seq={reading.record_seq} {reading.timestamp:%Y-%m-%dT%H:%M:%SZ} "
                  f"temp={reading.temp_c:.2f}C turb_adc={reading.turbidity_adc} "
                  f"batt={reading.battery_v:.2f}V rssi={rx.rssi} snr={rx.snr}", flush=True)
            if store is not None and store.append(reading) is not None:
                rows += 1

    summary = f"frames={frames} decoded={decoded} bad={bad}"
    if rssis:
        summary += f" rssi_min={min(rssis)} rssi_max={max(rssis)}"
    if store is not None:
        summary += f" new_rows={rows} (copies collapsed: {decoded - rows})"
    print(summary, file=sys.stderr)
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
