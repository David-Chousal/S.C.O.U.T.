"""QARTOD channel tests (flat-line, rate-of-change) and biofouling drift screening."""

import random
import unittest
from datetime import datetime, timedelta, timezone

from telemetry.drift import (
    DRIFT_INSUFFICIENT,
    DRIFT_LIKELY,
    DRIFT_NONE,
    DRIFT_SUSPECT,
    MIN_DRIFT_DAYS,
    assess_drift,
    daily_clean_water_reading,
)
from telemetry.model import TelemetryRecord
from telemetry.qc import ChannelQCConfig, evaluate_channel, run_qc

_T0 = datetime(2026, 8, 14, 0, 0, tzinfo=timezone.utc)
_STEP_MIN = 30  # the expected 30-minute cadence


def _rec(minutes, temp=26.0, turb=500):
    return TelemetryRecord(
        timestamp=_T0 + timedelta(minutes=minutes),
        buoy_id="SCOUT-01",
        record_seq=minutes // _STEP_MIN,
        temp_c=temp,
        turbidity_adc=turb,
        turbidity_v=None,
        turbidity_ntu=None,
        battery_v=3.3,
        uptime_s=None,
        audio_file="",
    )


def _series(temps=None, turbs=None, n=None, start_min=0, step_min=_STEP_MIN):
    """Build a cadence-regular record run from per-sample temp / turbidity values."""
    n = n if n is not None else len(temps if temps is not None else turbs)
    return [
        _rec(
            start_min + i * step_min,
            temp=26.0 if temps is None else temps[i],
            turb=500 if turbs is None else turbs[i],
        )
        for i in range(n)
    ]


def _wobble(rng, base, spread, n):
    """A realistic, non-degenerate channel — never perfectly flat, never a step."""
    return [base + rng.uniform(-spread, spread) for _ in range(n)]


class FlatLineTest(unittest.TestCase):
    def test_stuck_channel_reaching_the_suspect_count_is_flagged(self):
        rng = random.Random(1)
        # 6 identical temperatures = 3 h stuck at the 30-min cadence.
        temps = _wobble(rng, 26.0, 0.4, 10) + [26.0] * 6 + _wobble(rng, 26.0, 0.4, 10)
        report = run_qc(_series(temps=temps))
        temp = report.channels["temp_c"]
        self.assertEqual(temp.flat_line_suspect_runs, 1)
        self.assertEqual(temp.flat_line_fail_runs, 0)
        self.assertGreaterEqual(temp.longest_flat_run, 6)

    def test_long_stuck_run_escalates_to_fail(self):
        rng = random.Random(2)
        # 12 identical readings = 6 h — a stuck sensor, not stable water.
        temps = _wobble(rng, 26.0, 0.4, 10) + [26.0] * 12 + _wobble(rng, 26.0, 0.4, 10)
        report = run_qc(_series(temps=temps))
        temp = report.channels["temp_c"]
        self.assertEqual(temp.flat_line_fail_runs, 1)
        self.assertEqual(temp.flat_line_suspect_runs, 0)  # escalated, not double-counted

    def test_a_normally_varying_channel_is_not_flagged(self):
        rng = random.Random(3)
        report = run_qc(_series(temps=_wobble(rng, 26.0, 0.5, 40)))
        self.assertEqual(report.channels["temp_c"].flat_line_suspect_runs, 0)
        self.assertEqual(report.channels["temp_c"].flat_line_fail_runs, 0)

    def test_turbidity_channel_is_screened_independently(self):
        rng = random.Random(4)
        turbs = [int(v) for v in _wobble(rng, 500, 30, 10)] + [500] * 12
        report = run_qc(_series(turbs=turbs, temps=_wobble(rng, 26.0, 0.5, 22)))
        self.assertEqual(report.channels["turbidity_adc"].flat_line_fail_runs, 1)
        self.assertEqual(report.channels["temp_c"].flat_line_fail_runs, 0)


class RateOfChangeTest(unittest.TestCase):
    def test_step_change_against_a_quiet_window_is_flagged(self):
        rng = random.Random(5)
        temps = _wobble(rng, 26.0, 0.1, 30) + [31.0] + _wobble(rng, 31.0, 0.1, 5)
        report = run_qc(_series(temps=temps))
        self.assertEqual(report.channels["temp_c"].rate_of_change_suspect, 1)

    def test_a_jump_across_a_data_gap_is_not_flagged(self):
        rng = random.Random(6)
        quiet = _series(temps=_wobble(rng, 26.0, 0.1, 30))
        # Same 5 °C jump, but after a 6 h gap — a real change is legitimate over that span.
        after = _series(temps=[31.0], start_min=30 * _STEP_MIN + 360)
        report = run_qc(quiet + after)
        self.assertEqual(report.channels["temp_c"].rate_of_change_suspect, 0)

    def test_too_few_prior_samples_is_not_evaluated_rather_than_flagged(self):
        report = run_qc(_series(temps=[26.0, 26.1, 40.0]))
        temp = report.channels["temp_c"]
        self.assertEqual(temp.rate_of_change_suspect, 0)
        self.assertGreater(temp.not_evaluated, 0)

    def test_turbidity_is_not_rate_of_change_screened_by_default(self):
        # Runoff and resuspension are genuinely abrupt, so an n-sigma step rule would flag
        # weather, not faults. telemetry.turbidity owns turbidity excursions.
        rng = random.Random(14)
        turbs = [int(v) for v in _wobble(rng, 500, 5, 30)] + [1500] + [500] * 5
        report = run_qc(_series(turbs=turbs, temps=_wobble(rng, 26.0, 0.5, 36)))
        turbidity = report.channels["turbidity_adc"]
        self.assertEqual(turbidity.rate_of_change_suspect, 0)
        self.assertEqual(turbidity.not_evaluated, turbidity.n_samples)

    def test_the_screen_can_still_be_enabled_per_channel(self):
        rng = random.Random(15)
        samples = _series(turbs=[int(v) for v in _wobble(rng, 500, 5, 30)] + [1500])
        report = run_qc(samples)
        self.assertEqual(report.channels["turbidity_adc"].rate_of_change_suspect, 0)
        enabled = evaluate_channel(
            [(r.timestamp, float(r.turbidity_adc)) for r in samples],
            channel="turbidity_adc",
            config=ChannelQCConfig(roc_enabled=True),
        )
        self.assertEqual(enabled.rate_of_change_suspect, 1)

    def test_a_perfectly_constant_window_cannot_judge_a_change(self):
        # Zero spread would make any change infinitely many deviations — the flat-line
        # test owns this case, so rate-of-change must abstain instead of crying wolf.
        temps = [26.0] * 20 + [28.0]
        report = run_qc(_series(temps=temps))
        self.assertEqual(report.channels["temp_c"].rate_of_change_suspect, 0)


class CleanWaterReadingTest(unittest.TestCase):
    def test_it_tracks_the_clearest_reading_not_the_events(self):
        rng = random.Random(7)
        # One day of quiet clear water (high ADC) plus a few sediment plumes, which on the
        # SEN0189 read as DIPS. The clean-water reading must ignore the dips.
        turbs = [int(v) for v in _wobble(rng, 3000, 5, 44)] + [2100, 2050, 2000, 1900]
        clean = daily_clean_water_reading(_series(turbs=turbs, n=48))
        self.assertEqual(len(clean), 1)
        _, value = clean[0]
        self.assertGreater(value, 2950)  # plumes must not drag the clean-water reading down

    def test_days_with_too_few_samples_are_dropped(self):
        clean = daily_clean_water_reading(_series(turbs=[500, 501, 502], n=3))
        self.assertEqual(clean, [])


def _deployment(days, clean_at, temp_at, rng, events_per_day=0):
    """Build a multi-day deployment from per-day clean-water and temperature functions.

    Turbidity is in raw SEN0189 ADC counts, so a *higher* value is clearer water and an
    event pulls the reading DOWN.
    """
    records = []
    for day in range(days):
        for i in range(48):
            minutes = day * 24 * 60 + i * _STEP_MIN
            turb = clean_at(day) - rng.uniform(0, 8)
            if events_per_day and i % (48 // events_per_day) == 0 and i:
                turb -= 400  # an episodic runoff/resuspension excursion
            records.append(
                _rec(minutes, temp=temp_at(day) + rng.uniform(-0.3, 0.3), turb=int(turb))
            )
    return records


class DriftTest(unittest.TestCase):
    def test_a_declining_clean_water_reading_with_no_correlate_reads_as_drift(self):
        # Fouling attenuates light, so the clearest-water reading sinks over weeks.
        rng = random.Random(8)
        records = _deployment(30, lambda d: 3000 - 3.0 * d, lambda d: 26.0, rng)
        result = assess_drift(records)
        self.assertEqual(result.verdict, DRIFT_LIKELY)
        self.assertLess(result.clean_water_slope_per_year, 0)
        self.assertIn("consistent with fouling", result.rationale)

    def test_episodic_events_on_a_stable_baseline_are_not_drift(self):
        rng = random.Random(9)
        records = _deployment(30, lambda d: 3000, lambda d: 26.0, rng, events_per_day=3)
        result = assess_drift(records)
        self.assertEqual(result.verdict, DRIFT_NONE)

    def test_a_concurrent_reference_trend_downgrades_the_verdict(self):
        # Temperature is the independent, non-optical channel. If it is also moving, a real
        # environmental regime change may explain the turbidity baseline — we cannot separate.
        rng = random.Random(10)
        records = _deployment(30, lambda d: 3000 - 3.0 * d, lambda d: 26.0 + 0.1 * d, rng)
        result = assess_drift(records)
        self.assertEqual(result.verdict, DRIFT_SUSPECT)

    def test_a_rising_reading_is_caught_but_called_inconsistent_with_fouling(self):
        # Detection stays direction-agnostic (the analog front end is undesigned, ADR-0002),
        # but a rise is not fouling and the rationale must say so rather than mislabel it.
        rng = random.Random(11)
        records = _deployment(30, lambda d: 2000 + 3.0 * d, lambda d: 26.0, rng)
        result = assess_drift(records)
        self.assertEqual(result.verdict, DRIFT_LIKELY)
        self.assertGreater(result.clean_water_slope_per_year, 0)
        self.assertIn("inconsistent with fouling", result.rationale)

    def test_a_short_deployment_cannot_support_a_verdict(self):
        rng = random.Random(12)
        records = _deployment(MIN_DRIFT_DAYS - 2, lambda d: 3000 - 3.0 * d, lambda d: 26.0, rng)
        result = assess_drift(records)
        self.assertEqual(result.verdict, DRIFT_INSUFFICIENT)

    def test_assessment_states_its_own_limitation(self):
        rng = random.Random(13)
        result = assess_drift(_deployment(20, lambda d: 3000, lambda d: 26.0, rng))
        self.assertIn("reference", result.note.lower())


if __name__ == "__main__":
    unittest.main()
