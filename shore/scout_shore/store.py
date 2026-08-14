"""Append decoded readings to daily CSV files, one per buoy per UTC day, matching the
``/DATA/<buoy_id>_<YYYYMMDD>.csv`` layout in ``docs/engineering/data-schema.md``.
"""

from __future__ import annotations

import csv
from pathlib import Path

from .packet import Reading
from .schema import COLUMNS, buoy_label, reading_to_row


class CsvStore:
    """Writes schema-conformant rows to per-day CSV files under ``base_dir``."""

    def __init__(self, base_dir: str | Path) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def path_for(self, reading: Reading) -> Path:
        day = reading.timestamp.strftime("%Y%m%d")
        return self.base_dir / f"{buoy_label(reading.buoy_id)}_{day}.csv"

    def append(self, reading: Reading) -> Path:
        """Append one reading; writes the header first if the daily file is new."""
        path = self.path_for(reading)
        new_file = not path.exists()
        with path.open("a", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            if new_file:
                writer.writeheader()
            writer.writerow(reading_to_row(reading))
        return path
