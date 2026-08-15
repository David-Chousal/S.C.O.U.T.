"""Append decoded readings to daily CSV files, one per buoy per UTC day, matching the
``/DATA/<buoy_id>_<YYYYMMDD>.csv`` layout in ``docs/engineering/data-schema.md``.

Writes are **idempotent** on ``(buoy_id, record_seq)``. The buoy sends each daily packet
several times without waiting for an acknowledgement (see ``firmware/lib/scout_link``), so
the same reading legitimately arrives more than once and must collapse to a single row —
otherwise the duplicates would inflate the QC completeness figure in
``analytics/telemetry/qc.py`` and mask real gaps. ``record_seq`` survives buoy resets
(retained no-init RAM), so the pair identifies a reading for the life of the deployment.
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
        # (buoy_id, record_seq) already on disk, seeded per file on first touch so a
        # restarted shore station does not re-admit copies it already stored.
        self._seen: dict[Path, set[tuple[int, int]]] = {}

    def path_for(self, reading: Reading) -> Path:
        day = reading.timestamp.strftime("%Y%m%d")
        return self.base_dir / f"{buoy_label(reading.buoy_id)}_{day}.csv"

    def append(self, reading: Reading) -> Path | None:
        """Append one reading, or return ``None`` if it is a duplicate already stored.

        Writes the header first if the daily file is new.
        """
        path = self.path_for(reading)
        seen = self._seen_for(path)
        key = (reading.buoy_id, reading.record_seq)
        if key in seen:
            return None

        new_file = not path.exists()
        with path.open("a", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            if new_file:
                writer.writeheader()
            writer.writerow(reading_to_row(reading))
        seen.add(key)
        return path

    def _seen_for(self, path: Path) -> set[tuple[int, int]]:
        """Keys already in this daily file, read from disk once then kept in memory.

        A repeated packet carries the same timestamp as its original, so it always lands in
        the same daily file — reading just this file is sufficient, and avoids scanning the
        whole deployment on every append.
        """
        cached = self._seen.get(path)
        if cached is not None:
            return cached

        keys: set[tuple[int, int]] = set()
        if path.exists():
            with path.open(newline="") as handle:
                for row in csv.DictReader(handle):
                    try:
                        label = row["buoy_id"]
                        keys.add((int(label.rsplit("-", 1)[-1]), int(row["record_seq"])))
                    except (KeyError, ValueError):
                        # A hand-edited or malformed row cannot be keyed; letting it raise
                        # would take the receiver down over one bad line.
                        continue
        self._seen[path] = keys
        return keys
