"""The acoustic summary on the dashboard (ADR-0010, SCO-233): parsing, analysis, the card."""

import csv
import json
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze, load_csv
from telemetry.acoustic import CLIP_WARN_COUNT, COUNTER_MAX, summarize_acoustic, to_json
from telemetry.model import TelemetryRecord
from telemetry.pipeline import write_summary_json

_T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)
_FIXED = datetime(2027, 3, 4, 12, 0, tzinfo=timezone.utc)
_SUMMARY = dict(lvl_anthro_cdb=-3972, lvl_mixed_cdb=-3006, lvl_bio_cdb=-1068,
                lvl_broad_cdb=-995, ndsi_e4=9975, snap_count=2400, clip_count=3)


def _records(days=3, **acoustic_overrides):
    """30-min rows; the 00:00, 08:00 and 16:00 rows carry a recording."""
    out, seq = [], 0
    for d in range(days):
        for s in range(48):
            seq += 1
            at = _T0 + timedelta(days=d, minutes=30 * s)
            recorded = at.minute == 0 and at.hour in (0, 8, 16)
            fields = dict(_SUMMARY, **acoustic_overrides) if recorded else {}
            out.append(TelemetryRecord(
                timestamp=at, buoy_id="SCOUT-01", record_seq=seq, temp_c=27.0,
                turbidity_adc=3300, turbidity_v=None, turbidity_fau=None, battery_v=3.3,
                uptime_s=seq * 1800, audio_file=f"{at:%Y%m%d/%H%M%S}Z.WAV" if recorded else "",
                schema_version=3, **fields))
    return out


class AnalysisTests(unittest.TestCase):
    def test_only_rows_with_a_summary_are_recordings(self):
        report = summarize_acoustic(_records(days=2))
        self.assertEqual(len(report.recordings), 6)
        self.assertAlmostEqual(report.latest.bio_db, -10.68)
        self.assertAlmostEqual(report.latest.ndsi, 0.9975)

    def test_no_summaries_gives_no_report(self):
        rows = [replace(r, **{k: None for k in _SUMMARY}) for r in _records(days=1)]
        self.assertIsNone(summarize_acoustic(rows))

    def test_daily_ndsi_is_the_mean_of_the_days_recordings(self):
        report = summarize_acoustic(_records(days=2))
        self.assertEqual([v for _, v in report.ndsi_daily], [0.9975, 0.9975])

    def test_digital_silence_reads_as_silent_not_a_level(self):
        report = summarize_acoustic(_records(days=1, lvl_bio_cdb=-32768))
        self.assertIsNone(report.latest.bio_db)

    def test_clipping_threshold(self):
        self.assertFalse(summarize_acoustic(_records(days=1)).latest.clipping)
        clipped = summarize_acoustic(_records(days=1, clip_count=CLIP_WARN_COUNT))
        self.assertTrue(clipped.latest.clipping)
        self.assertEqual(clipped.recent_clipping, 3)

    def test_rows_with_an_untrusted_clock_are_left_out(self):
        rows = [replace(r, flags=frozenset({"RTC_LOST"})) for r in _records(days=1)]
        self.assertIsNone(summarize_acoustic(rows))


class LoadTests(unittest.TestCase):
    def test_v3_columns_load_and_blank_cells_are_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "SCOUT-01_20270301.csv"
            cols = ["schema_version", "buoy_id", "timestamp_utc", "record_seq", "temp_c",
                    "battery_v", "audio_file", *_SUMMARY]
            with path.open("w", newline="") as fh:
                w = csv.writer(fh)
                w.writerow(cols)
                w.writerow(["3", "SCOUT-01", "2027-03-01T00:00:00Z", "1", "27.0", "3.30",
                            "20270301/000000Z.WAV", *[str(v) for v in _SUMMARY.values()]])
                w.writerow(["3", "SCOUT-01", "2027-03-01T00:30:00Z", "2", "27.0", "3.30", "",
                            *[""] * 7])
            first, second = load_csv(path)
        self.assertEqual(first.snap_count, 2400)
        self.assertEqual(first.lvl_bio_cdb, -1068)
        self.assertIsNone(second.lvl_bio_cdb)

    def test_v2_files_without_the_columns_still_load(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "old.csv"
            path.write_text("schema_version,buoy_id,timestamp_utc,record_seq,temp_c,battery_v\n"
                            "2,SCOUT-01,2027-03-01T00:00:00Z,1,27.0,3.30\n")
            (row,) = load_csv(path)
        self.assertIsNone(row.ndsi_e4)


class SummaryJsonTests(unittest.TestCase):
    def test_summary_json_carries_the_acoustic_section(self):
        report = analyze(_records(), mmm=27.6)
        with tempfile.TemporaryDirectory() as tmp:
            path = write_summary_json(report, Path(tmp) / "s.json")
            data = json.loads(path.read_text())
        self.assertEqual(data["acoustic"]["n_recordings"], 9)
        self.assertEqual(data["acoustic"]["latest"]["snap_count"], 2400)
        self.assertIsNone(to_json(None))


if __name__ == "__main__":
    unittest.main()
