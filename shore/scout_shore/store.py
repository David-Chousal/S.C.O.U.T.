"""Append decoded readings to daily CSV files, one per buoy per UTC day, matching the
``/DATA/<buoy_id>_<YYYYMMDD>.csv`` layout in ``docs/engineering/data-schema.md``.

Writes are **idempotent** on ``(buoy_id, record_seq, timestamp_utc)``. The same reading can legitimately
arrive more than once (a re-received frame, extra copies per slot if
``firmware/lib/scout_link`` is set to send them, an SD-card import) and must collapse to a
single row —
otherwise the duplicates would inflate the QC completeness figure in
``analytics/telemetry/qc.py`` and mask real gaps. ``record_seq`` survives a watchdog
reset (retained no-init RAM) but restarts at 0 when the buoy loses power, so the sequence alone
would name two readings after a battery swap. A repeat carries its original's timestamp, so the
timestamp in the key keeps repeats collapsing while a reused sequence number still gets in.
"""

from __future__ import annotations

import csv
from pathlib import Path

from .packet import Reading
from .schema import COLUMNS, buoy_label, reading_to_row


class CsvStore:
    """Writes schema-conformant rows to per-day CSV files under ``base_dir``.

    Duplicate readings are skipped rather than appended; :meth:`append` reports which
    happened so callers can count them.
    """

    def __init__(self, base_dir: str | Path) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        # (buoy_id, record_seq, timestamp_utc) already on disk, seeded per file on first touch so a
        # restarted shore station does not re-admit copies it already stored.
        self._seen: dict[Path, set[tuple[int, int, str]]] = {}

    def path_for(self, reading: Reading) -> Path:
        day = reading.timestamp.strftime("%Y%m%d")
        return self.base_dir / f"{buoy_label(reading.buoy_id)}_{day}.csv"

    def append(self, reading: Reading) -> Path | None:
        """Append one reading, or return ``None`` if it is a duplicate already stored.

        Writes the header first if the daily file is new.
        """
        path = self.path_for(reading)
        seen = self._seen_for(path)
        row = reading_to_row(reading)
        key = (reading.buoy_id, reading.record_seq, row["timestamp_utc"])
        if key in seen:
            return None

        new_file = not path.exists()
        if not new_file:
            _upgrade_header(path)
        with path.open("a", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            if new_file:
                writer.writeheader()
            writer.writerow(row)
        seen.add(key)
        return path

    def _seen_for(self, path: Path) -> set[tuple[int, int, str]]:
        """Keys already in this daily file, read from disk once then kept in memory.

        A repeated packet carries the same timestamp as its original, so it always lands in
        the same daily file — reading just this file is sufficient, and avoids scanning the
        whole deployment on every append.
        """
        cached = self._seen.get(path)
        if cached is not None:
            return cached

        keys: set[tuple[int, int, str]] = set()
        if path.exists():
            with path.open(newline="") as handle:
                for row in csv.DictReader(handle):
                    try:
                        label = row["buoy_id"]
                        keys.add((int(label.rsplit("-", 1)[-1]), int(row["record_seq"]), row["timestamp_utc"]))
                    except (KeyError, ValueError):
                        # A hand-edited or malformed row cannot be keyed; letting it raise
                        # would take the receiver down over one bad line.
                        continue
        self._seen[path] = keys
        return keys


def _upgrade_header(path: Path) -> None:
    """Rewrite a daily file written under an older schema with the current header.

    A shore station upgraded mid-day would otherwise append 23-column v3 rows under a 16-column
    v2 header, and every reader would misalign them. Old rows keep their values and their own
    ``schema_version``; the columns they never had are left blank.
    """
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) == COLUMNS:
            return
        rows = list(reader)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column) or "" for column in COLUMNS})
