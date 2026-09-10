"""Merge a physically retrieved SD card into the shore station's record.

The buoy transmits each daily packet a few times and never waits for an acknowledgement. When
shore misses every copy — a power cut, a storm, the station down for maintenance — that reading
exists only on the buoy's SD card. The analytics pipeline could already *read* a card
(:func:`telemetry.io.load_dir` takes any directory of CSVs), but nothing merged the two record
sets, so a deployment ended with a gappy shore CSV and a complete card that never met.

**The card is the better record, not merely an equal one.** A LoRa packet is a lossy 30-byte
compression of a CSV row: `turbidity_v`, `turbidity_ntu` and the audio filename do not fit and
are dropped on the way out (see :mod:`scout_shore.packet` against ``COLUMNS``). So where both
sides hold the same reading, the card's row wins and fills in what the packet could not carry.

Merging happens at the CSV-row level rather than by decoding into
:class:`~scout_shore.packet.Reading`, precisely because that type is the lossy one — round-tripping
through it would discard the columns this import exists to recover.

Identity is ``(buoy_id, record_seq)``, the same idempotency key
:class:`~scout_shore.store.CsvStore` uses for blind-repeat packets, so importing the same card
twice is a no-op.

Standard library only.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path

from .schema import COLUMNS

# The buoy writes /DATA/<buoy_id>_<YYYYMMDD>.csv (data-schema.md). Cards are usually handed over
# as the whole card root, so accept either the card root or the DATA directory itself.
_CARD_SUBDIR = "DATA"


@dataclass
class ImportResult:
    cards_read: int = 0          # CSV files found on the card
    added: int = 0               # readings shore had never seen
    enriched: int = 0            # readings shore had, but with columns the packet dropped
    unchanged: int = 0           # already identical
    would_add: int = 0           # dry-run: what `added` would have been
    skipped: list[str] = field(default_factory=list)  # rows that could not be keyed, with reasons

    @property
    def recovered(self) -> int:
        """Readings that would otherwise have been lost with the card."""
        return self.added


def _key(row: dict[str, str]) -> tuple[str, int]:
    """Identity of a reading. Raises ValueError with a usable message if the row cannot be keyed."""
    buoy = (row.get("buoy_id") or "").strip()
    seq = (row.get("record_seq") or "").strip()
    if not buoy:
        raise ValueError("empty buoy_id")
    try:
        return buoy, int(seq)
    except ValueError:
        raise ValueError(f"record_seq is not an integer: {seq!r}") from None


def _day(row: dict[str, str]) -> str:
    """The ``YYYYMMDD`` the row's daily file is named for."""
    stamp = (row.get("timestamp_utc") or "").strip()
    if len(stamp) < 10 or stamp[4] != "-" or stamp[7] != "-":
        raise ValueError(f"timestamp_utc is not ISO 8601: {stamp!r}")
    return stamp[:4] + stamp[5:7] + stamp[8:10]


def _sort_key(row: dict[str, str]) -> tuple[str, int]:
    """Time order, falling back to sequence — both are monotonic within a day."""
    try:
        return (row.get("timestamp_utc") or "", int(row.get("record_seq") or 0))
    except ValueError:
        return (row.get("timestamp_utc") or "", 0)


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def _write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in COLUMNS})


def _merge_row(existing: dict[str, str], incoming: dict[str, str]) -> tuple[dict[str, str], bool]:
    """Card row over shore row, cell by cell. Returns the merged row and whether it changed.

    A blank cell on the card never overwrites a value shore holds — a partially written row at
    the moment of power loss should not erase a reading that arrived intact over the radio.
    """
    merged = dict(existing)
    changed = False
    for column in COLUMNS:
        candidate = (incoming.get(column) or "").strip()
        if candidate and candidate != (existing.get(column) or "").strip():
            merged[column] = incoming[column]
            changed = True
    return merged, changed


def find_card_csvs(card_dir: Path) -> list[Path]:
    """CSV files on the card, whether handed the card root or its ``DATA`` directory."""
    if not card_dir.is_dir():
        raise FileNotFoundError(f"card directory does not exist: {card_dir}")
    data_dir = card_dir / _CARD_SUBDIR
    search = data_dir if data_dir.is_dir() else card_dir
    return sorted(search.glob("*.csv"))


def import_card(
    card_dir: str | Path,
    shore_dir: str | Path,
    *,
    dry_run: bool = False,
) -> ImportResult:
    """Merge every reading on the card into the shore station's daily CSVs.

    Existing shore rows are never deleted — a card pulled mid-deployment is a partial record,
    and treating it as authoritative for *absence* would erase history.
    """
    card_dir, shore_dir = Path(card_dir), Path(shore_dir)
    result = ImportResult()

    card_files = find_card_csvs(card_dir)
    result.cards_read = len(card_files)

    # Gather the card's rows keyed by the daily file they belong in, so each shore file is
    # read and rewritten once regardless of how the card happens to be split.
    by_day: dict[str, dict[tuple[str, int], dict[str, str]]] = {}
    for path in card_files:
        for line_no, row in enumerate(_read_csv(path), start=2):  # 1 is the header
            try:
                key = _key(row)
                day = _day(row)
            except ValueError as exc:
                result.skipped.append(f"{path.name}:{line_no}: {exc}")
                continue
            by_day.setdefault(f"{key[0]}_{day}", {})[key] = row

    for stem, card_rows in sorted(by_day.items()):
        target = shore_dir / f"{stem}.csv"
        existing = _read_csv(target) if target.exists() else []

        merged: dict[tuple[str, int], dict[str, str]] = {}
        unkeyed: list[dict[str, str]] = []
        for row in existing:
            try:
                merged[_key(row)] = row
            except ValueError:
                # Keep it. A row we cannot key is still data shore recorded, and dropping it
                # to tidy the file would be the one thing this tool must never do.
                unkeyed.append(row)

        dirty = False
        for key, row in card_rows.items():
            if key not in merged:
                if dry_run:
                    result.would_add += 1
                else:
                    merged[key] = row
                    result.added += 1
                    dirty = True
                continue
            combined, changed = _merge_row(merged[key], row)
            if changed:
                if not dry_run:
                    merged[key] = combined
                    dirty = True
                result.enriched += 1
            else:
                result.unchanged += 1

        if dirty and not dry_run:
            _write_csv(target, sorted(list(merged.values()) + unkeyed, key=_sort_key))

    return result
