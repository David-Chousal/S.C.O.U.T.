#!/usr/bin/env python3
"""End-to-end demo of the shore data path, with no hardware:

    sensor simulator → packet encode → mock LoRa (with loss/corruption)
        → receiver decode + validate → daily CSV store

Run:
    python scripts/run_loopback.py --count 48 --loss 0.05 --corrupt 0.02 --out ./data
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path

# Allow running as a script without installing the package.
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore import CsvStore, MockLoRaLink, Receiver, encode, generate_series  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="SCOUT shore data-path loopback demo")
    parser.add_argument("--count", type=int, default=48, help="number of readings (default 48 = 1 day)")
    parser.add_argument("--loss", type=float, default=0.0, help="packet loss rate 0..1")
    parser.add_argument("--corrupt", type=float, default=0.0, help="bit-corruption rate 0..1")
    parser.add_argument("--out", type=Path, default=Path("data"), help="output dir for CSV")
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    start = datetime(2026, 8, 14, 0, 0, 0, tzinfo=timezone.utc)
    link = MockLoRaLink(loss_rate=args.loss, corrupt_rate=args.corrupt, seed=args.seed)
    receiver = Receiver(link, CsvStore(args.out))

    # Buoy side: simulate and transmit.
    for reading in generate_series(start, args.count, buoy_id=1, seed=args.seed):
        link.transmit(encode(reading))

    # Shore side: receive, decode, validate, store.
    receiver.drain()

    s = receiver.stats
    print(f"transmitted : {args.count}")
    print(f"dropped (RF): {link.dropped}")
    print(f"received    : {s.received}")
    print(f"stored      : {s.stored}")
    print(f"decode errs : {s.decode_errors}")
    print(f"schema errs : {s.schema_errors}")
    print(f"CSV written under: {args.out.resolve()}")


if __name__ == "__main__":
    main()
