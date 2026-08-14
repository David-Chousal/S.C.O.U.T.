"""Schema tests — reading→row conformance and the validator."""

import unittest
from datetime import datetime, timezone

from scout_shore import Reading, SchemaError, reading_to_row, validate_row
from scout_shore.schema import COLUMNS


def _reading(**overrides) -> Reading:
    base = dict(
        buoy_id=1,
        timestamp=datetime(2026, 8, 14, 0, 30, 0, tzinfo=timezone.utc),
        record_seq=2,
        temp_c=26.42,
        turbidity_adc=514,
        battery_v=3.30,
        uptime_s=1860,
    )
    base.update(overrides)
    return Reading(**base)


class SchemaTest(unittest.TestCase):
    def test_row_has_exact_columns_in_order(self):
        row = reading_to_row(_reading())
        self.assertEqual(tuple(row.keys()), COLUMNS)

    def test_row_values_match_schema_conventions(self):
        row = reading_to_row(_reading(audio_present=False))
        self.assertEqual(row["buoy_id"], "SCOUT-01")
        self.assertEqual(row["timestamp_utc"], "2026-08-14T00:30:00Z")
        self.assertEqual(row["temp_c"], "26.42")
        self.assertEqual(row["turbidity_ntu"], "")  # uncalibrated → blank
        self.assertEqual(row["audio_file"], "")  # no audio this cycle

    def test_audio_filename_populated_when_present(self):
        row = reading_to_row(_reading(audio_present=True))
        self.assertEqual(row["audio_file"], "SCOUT-01_20260814T003000Z.wav")

    def test_flags_are_pipe_joined_and_sorted(self):
        row = reading_to_row(_reading(flags=frozenset({"TEMP_TIMEOUT", "SD_RETRY"})))
        self.assertEqual(row["flags"], "SD_RETRY|TEMP_TIMEOUT")

    def test_valid_row_passes(self):
        validate_row(reading_to_row(_reading()))  # should not raise

    def test_empty_required_field_fails(self):
        row = reading_to_row(_reading())
        row["temp_c"] = ""
        with self.assertRaises(SchemaError):
            validate_row(row)

    def test_non_utc_timestamp_fails(self):
        row = reading_to_row(_reading())
        row["timestamp_utc"] = "2026-08-14T00:30:00"  # missing Z
        with self.assertRaises(SchemaError):
            validate_row(row)

    def test_missing_column_fails(self):
        row = reading_to_row(_reading())
        del row["fw_version"]
        with self.assertRaises(SchemaError):
            validate_row(row)


if __name__ == "__main__":
    unittest.main()
