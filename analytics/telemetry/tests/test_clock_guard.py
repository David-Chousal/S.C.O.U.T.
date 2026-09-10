"""Records whose clock is untrustworthy must not poison time-based analysis.

The firmware degrades gracefully when the PCF8523 is unset or unreadable: it sets the
``RTC_LOST`` flag, stamps the row ``1970-01-01T00:00:00Z``, and keeps logging (main.cpp).
That is the right behaviour on the buoy — the sensor readings are still real. But the
timestamp is not, and every time-based figure downstream is computed from timestamps.

Before this guard, a single such row moved the deployment span from one day to fifty-six
years: completeness fell 100% -> 0.0%, expected records went 48 -> 993,504, and a phantom
1970 day appeared in the daily series.
"""

import unittest
from datetime import datetime, timedelta, timezone

from telemetry import analyze
from telemetry.model import TelemetryRecord
from telemetry.qc import run_qc

_T0 = datetime(2026, 9, 1, tzinfo=timezone.utc)
_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


def _rec(ts, seq, *, flags=frozenset(), temp=26.0):
    return TelemetryRecord(
        timestamp=ts, buoy_id="SCOUT-01", record_seq=seq, temp_c=temp,
        turbidity_adc=3300, turbidity_v=None, turbidity_ntu=None, battery_v=3.3,
        uptime_s=seq * 1800, audio_file="", flags=flags,
    )


def _good_day(n=48):
    return [_rec(_T0 + timedelta(minutes=30 * i), i) for i in range(n)]


class ClockGuardTest(unittest.TestCase):
    def test_a_healthy_day_is_unaffected(self):
        r = run_qc(_good_day())
        self.assertEqual(r.completeness_pct, 100.0)
        self.assertEqual(r.expected_records, 48)
        self.assertEqual(r.clock_invalid, 0)

    def test_one_epoch_row_does_not_destroy_completeness(self):
        # The exact row the firmware writes when the RTC is unreadable.
        r = run_qc(_good_day() + [_rec(_EPOCH, 48, flags=frozenset({"RTC_LOST"}))])
        self.assertEqual(r.completeness_pct, 100.0)   # was 0.0
        self.assertEqual(r.expected_records, 48)      # was 993,504
        self.assertEqual(r.gaps, [])

    def test_the_bad_row_is_reported_not_hidden(self):
        # QC measures and reports; it must never silently drop data.
        r = run_qc(_good_day() + [_rec(_EPOCH, 48, flags=frozenset({"RTC_LOST"}))])
        self.assertEqual(r.clock_invalid, 1)
        self.assertEqual(r.n_records, 49)             # still counted in the total

    def test_the_flag_alone_is_enough_even_with_a_plausible_timestamp(self):
        # A drifted-but-not-epoch clock: the firmware flagged it, so trust the flag.
        bad = _rec(_T0 + timedelta(minutes=30 * 48), 48, flags=frozenset({"RTC_LOST"}))
        r = run_qc(_good_day() + [bad])
        self.assertEqual(r.clock_invalid, 1)

    def test_an_epoch_timestamp_alone_is_enough_even_without_the_flag(self):
        # Defence in depth: a pre-2020 stamp is an unset clock whatever the flags say.
        r = run_qc(_good_day() + [_rec(_EPOCH, 48)])
        self.assertEqual(r.clock_invalid, 1)
        self.assertEqual(r.completeness_pct, 100.0)

    def test_no_phantom_day_reaches_the_daily_series(self):
        rep = analyze(_good_day() + [_rec(_EPOCH, 48, flags=frozenset({"RTC_LOST"}))], mmm=27.6)
        self.assertEqual(len(rep.daily), 1)           # was 2
        self.assertEqual(rep.daily[0].day, _T0.date())

    def test_drift_screen_sees_no_phantom_day_either(self):
        # One real day of samples -> one usable day. Before the guard this was 2: the real
        # day plus a phantom 1970 one, which is what a monotonic "trend" gets fitted through.
        rep = analyze(_good_day() + [_rec(_EPOCH, 48, flags=frozenset({"RTC_LOST"}))], mmm=27.6)
        self.assertEqual(rep.turbidity_drift.n_days, 1)
        self.assertEqual(rep.turbidity_drift.verdict, "insufficient data")

    def test_all_rows_invalid_degrades_without_crashing(self):
        # A buoy that boots with a dead RTC logs nothing trustworthy. Report it, do not crash.
        r = run_qc([_rec(_EPOCH, i, flags=frozenset({"RTC_LOST"})) for i in range(10)])
        self.assertEqual(r.clock_invalid, 10)
        self.assertEqual(r.n_records, 10)
        self.assertEqual(r.completeness_pct, 0.0)


if __name__ == "__main__":
    unittest.main()
