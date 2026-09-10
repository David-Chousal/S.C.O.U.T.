#!/usr/bin/env python3
"""Merge a retrieved buoy SD card into the shore station's record.

Run this after physically recovering a card. Readings shore never received are added; readings
it did receive are enriched with the columns a 30-byte packet could not carry (`turbidity_v`,
`turbidity_ntu`, the audio filename). Nothing is ever deleted, and running it twice is a no-op.

    # See what a card holds before touching anything:
    python scripts/import_sd_card.py --card /Volumes/SCOUT --into data-live --dry-run

    # Merge it in:
    python scripts/import_sd_card.py --card /Volumes/SCOUT --into data-live

``--into data-live`` is the tracked directory the published dashboard reads from
(``shore/data-live/README.md``); recovered readings appear on the site on the next build.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scout_shore.sd_import import import_card  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--card", required=True, type=Path,
                        help="mounted card (its root, or the DATA/ directory)")
    parser.add_argument("--into", type=Path, default=Path("data-live"),
                        help="shore CSV directory to merge into (default: data-live)")
    parser.add_argument("--dry-run", action="store_true",
                        help="report what would change without writing")
    args = parser.parse_args()

    try:
        result = import_card(args.card, args.into, dry_run=args.dry_run)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.dry_run:
        print(f"DRY RUN — nothing written to {args.into}")
        print(f"  CSV files on card : {result.cards_read}")
        print(f"  would recover     : {result.would_add} reading(s) shore never received")
        print(f"  would enrich      : {result.enriched} reading(s) with dropped columns")
        print(f"  already identical : {result.unchanged}")
    else:
        print(f"Imported {args.card} → {args.into}")
        print(f"  CSV files on card : {result.cards_read}")
        print(f"  recovered         : {result.added} reading(s) that LoRa never delivered")
        print(f"  enriched          : {result.enriched} reading(s) with columns the packet dropped")
        print(f"  already identical : {result.unchanged}")

    if result.skipped:
        # Loud, and on stderr: a row the card holds that we could not key is data we are not
        # importing, which is exactly the thing this tool exists to prevent.
        print(f"\n⚠️  {len(result.skipped)} row(s) could not be read and were NOT imported:",
              file=sys.stderr)
        for line in result.skipped[:20]:
            print(f"     {line}", file=sys.stderr)
        if len(result.skipped) > 20:
            print(f"     … and {len(result.skipped) - 20} more", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
