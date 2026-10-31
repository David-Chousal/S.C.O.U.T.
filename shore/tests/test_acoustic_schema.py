"""Schema v3: the acoustic summary columns (ADR-0010, SCO-233), and v1/v2 files still reading.

The packet carries the seven summary fields as zeros when there was no recording; the CSV
leaves them blank instead, the way it blanks turbidity when the sensor was paused. Files written
under v1 (14 columns) and v2 (16 columns) must still validate, import and be appended to.
"""

from __future__ import annotations

import csv
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scout_shore import CsvStore, Reading, SchemaError, reading_to_row, validate_row
from scout_shore.packet import ACOUSTIC_FIELDS, PACKET_VERSION
from scout_shore.schema import COLUMNS, COLUMNS_V1, COLUMNS_V2, validate_csv
from scout_shore.sd_import import import_card
from scout_shore.simulator import generate_series, synthetic_acoustic

_SUMMARY = dict(lvl_anthro_cdb=-3972, lvl_mixed_cdb=-3006, lvl_bio_cdb=-1068,
                lvl_broad_cdb=-995, ndsi_e4=9975, snap_count=10, clip_count=24)


def _reading(**overrides) -> Reading:
    base = dict(buoy_id=1, timestamp=datetime(2026, 8, 14, 0, 0, 0, tzinfo=timezone.utc),
                record_seq=1, temp_c=26.4, turbidity_adc=3300, battery_v=3.3, uptime_s=1800)
    base.update(overrides)
    return Reading(**base)


def _legacy_row(columns: tuple[str, ...], seq: int, version: str) -> dict[str, str]:
    row = {c: "" for c in columns}
    row.update({"schema_version": version, "buoy_id": "SCOUT-01",
                "timestamp_utc": f"2026-08-14T{seq:02d}:00:00Z", "record_seq": str(seq),
                "temp_c": "26.40", "turbidity_adc": "3300", "turbidity_v": "2.659",
                "battery_v": "3.30", "uptime_s": str(seq * 1800), "fw_version": "v0.1.0"})
    return row


def _write(path: Path, columns: tuple[str, ...], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def _read(path: Path) -> tuple[tuple[str, ...], list[dict[str, str]]]:
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        return tuple(reader.fieldnames), list(reader)


class AcousticRowTests(unittest.TestCase):
    def test_v3_appends_the_seven_packet_fields_as_columns(self):
        # Updated for v4 (SCO-198): tx_count now follows the acoustic block, so the seven
        # fields are columns 16-22 rather than the tail.
        self.assertEqual(COLUMNS[16:23], ACOUSTIC_FIELDS)
        self.assertEqual(len(COLUMNS), 24)

    def test_recording_fills_the_acoustic_cells(self):
        row = reading_to_row(_reading(audio_present=True, **_SUMMARY))
        self.assertEqual(row["lvl_bio_cdb"], "-1068")
        self.assertEqual(row["ndsi_e4"], "9975")
        self.assertEqual(row["snap_count"], "10")
        validate_row(row)

    def test_no_recording_leaves_the_acoustic_cells_blank(self):
        row = reading_to_row(_reading(audio_present=False))
        self.assertEqual({row[name] for name in ACOUSTIC_FIELDS}, {""})
        validate_row(row)

    def test_non_integer_acoustic_cell_fails(self):
        row = reading_to_row(_reading(audio_present=True, **_SUMMARY))
        row["snap_count"] = "many"
        with self.assertRaises(SchemaError):
            validate_row(row)

    def test_out_of_range_acoustic_cell_fails(self):
        row = reading_to_row(_reading(audio_present=True, **_SUMMARY))
        row["clip_count"] = "70000"
        with self.assertRaises(SchemaError):
            validate_row(row)


class LegacyFileTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_v1_and_v2_rows_still_validate(self):
        validate_row(_legacy_row(COLUMNS_V1, 1, "1"))
        validate_row(_legacy_row(COLUMNS_V2, 2, "2"))

    def test_a_v2_file_still_validates(self):
        path = self.root / "SCOUT-01_20260814.csv"
        _write(path, COLUMNS_V2, [_legacy_row(COLUMNS_V2, 1, "2")])
        self.assertEqual(validate_csv(path), 1)

    def test_store_upgrades_a_v2_daily_file_before_appending_v3_rows(self):
        store = CsvStore(self.root)
        path = self.root / "SCOUT-01_20260814.csv"
        _write(path, COLUMNS_V2, [_legacy_row(COLUMNS_V2, 1, "2")])
        store.append(_reading(record_seq=2, audio_present=True, **_SUMMARY))
        header, rows = _read(path)
        self.assertEqual(header, COLUMNS)
        # Appended rows carry the current version (4 since SCO-198), not a hard-coded 3.
        self.assertEqual([r["schema_version"] for r in rows], ["2", str(PACKET_VERSION)])
        self.assertEqual(rows[0]["lvl_bio_cdb"], "")
        self.assertEqual(rows[0]["turbidity_v"], "2.659")  # old values kept
        self.assertEqual(rows[1]["lvl_bio_cdb"], "-1068")
        self.assertEqual(validate_csv(path), 2)

    def test_store_still_dedupes_against_an_upgraded_file(self):
        store = CsvStore(self.root)
        _write(self.root / "SCOUT-01_20260814.csv", COLUMNS_V2, [_legacy_row(COLUMNS_V2, 1, "2")])
        # The same reading: the legacy row for seq 1 is stamped 01:00 (see _legacy_row).
        same = _reading(record_seq=1, timestamp=datetime(2026, 8, 14, 1, 0, 0, tzinfo=timezone.utc))
        self.assertIsNone(store.append(same))

    def test_a_v2_card_imports_into_a_v3_shore_file(self):
        card, shore = self.root / "card" / "DATA", self.root / "shore"
        _write(card / "20260814.CSV", COLUMNS_V2, [_legacy_row(COLUMNS_V2, 1, "2")])
        CsvStore(shore).append(_reading(record_seq=2, audio_present=True, **_SUMMARY))
        result = import_card(self.root / "card", shore)
        self.assertEqual(result.added, 1)
        header, rows = _read(shore / "SCOUT-01_20260814.csv")
        self.assertEqual(header, COLUMNS)
        self.assertEqual(len(rows), 2)

    def test_a_v3_card_fills_acoustic_cells_shore_lacks(self):
        card, shore = self.root / "card" / "DATA", self.root / "shore"
        CsvStore(shore).append(_reading(record_seq=1))  # arrived without a summary
        card_row = reading_to_row(_reading(record_seq=1, audio_present=True, **_SUMMARY))
        _write(card / "20260814.CSV", COLUMNS, [card_row])
        self.assertEqual(import_card(self.root / "card", shore).enriched, 1)
        _, rows = _read(shore / "SCOUT-01_20260814.csv")
        self.assertEqual(rows[0]["snap_count"], "10")


class SimulatorAcousticTests(unittest.TestCase):
    def test_recordings_carry_a_plausible_summary(self):
        start = datetime(2026, 8, 14, tzinfo=timezone.utc)
        recorded = [r for r in generate_series(start, 480) if r.audio_present]
        self.assertGreater(len(recorded), 20)
        for r in recorded:
            self.assertLess(r.lvl_anthro_cdb, r.lvl_broad_cdb)
            self.assertLess(r.lvl_bio_cdb, 0)
            self.assertTrue(-10000 <= r.ndsi_e4 <= 10000)
            self.assertGreater(r.snap_count, 0)

    def test_cycles_without_a_recording_carry_zeros(self):
        start = datetime(2026, 8, 14, tzinfo=timezone.utc)
        silent = [r for r in generate_series(start, 48) if not r.audio_present]
        self.assertTrue(all(r.acoustic() == (0,) * 7 for r in silent))

    def test_summary_is_deterministic(self):
        self.assertEqual(synthetic_acoustic(32, 0.0), synthetic_acoustic(32, 0.0))


if __name__ == "__main__":
    unittest.main()
