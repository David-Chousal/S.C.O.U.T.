"""Writes heat-stress-cases.json, the fixture shared by bleaching.py and the console's port of it.

The expected values are computed by analytics/telemetry/bleaching.py and aggregate.py themselves, so the
fixture cannot drift from the reference. Run from analytics/:

    python3 telemetry/tests/fixtures/make_heat_stress_cases.py
"""

import json
import math
import sys
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2]))
from telemetry import bleaching
from telemetry.aggregate import aggregate_daily, daily_temperature_series
from telemetry.model import TelemetryRecord, has_valid_clock

START = date(2027, 3, 1)

def series_case(name, note, mmm, temps):
    daily = [(START + timedelta(days=i), t) for i, t in enumerate(temps) if t is not None]
    return {"name": name, "note": note, "mmm": mmm,
            "daily": [[d.isoformat(), t] for d, t in daily]}

ramp = [round(27.5 + 4.0 * math.sin(math.pi * i / 150), 3) for i in range(150)]
gappy = [30.2 if i % 9 not in (3, 4, 5) else None for i in range(60)]
cases = [
    series_case("hot_fortnight", "14 days at +2 °C HotSpot: DHW 4.0, Alert Level 1", 28.0, [30.0] * 14),
    series_case("subthreshold", "+0.5 °C never reaches the 1 °C HotSpot floor: Watch, DHW 0", 28.0, [28.5] * 30),
    series_case("age_out", "a hot fortnight ages out of the 84-day window", 28.0, [30.0] * 14 + [27.0] * 90),
    series_case("ramp_to_level_5", "a warm season that climbs through every level, then cools", 27.0, ramp),
    series_case("gaps", "three missing days in every nine; coverage below 1", 28.0, gappy),
]

def rec(ts, temp, flags):
    return TelemetryRecord(timestamp=datetime.fromisoformat(ts.replace("Z", "+00:00")), buoy_id="SCOUT-01",
        record_seq=0, temp_c=temp, turbidity_adc=None, turbidity_v=None, turbidity_fau=None, battery_v=None,
        uptime_s=None, audio_file="", flags=frozenset(f for f in flags.split("|") if f))

rows = []
for day in range(20):
    d = START + timedelta(days=day)
    for hour, extra in ((0, 0.0), (8, 0.4), (16, 0.9)):
        temp = round(29.6 + 0.05 * day + extra, 2)
        flags = ""
        if day == 4 and hour == 8: flags = "RTC_LOST"           # untrusted clock: dropped
        if day == 6 and hour in (0, 8): temp = None              # one sample left: below 50 %
        if day == 9 and hour == 16: temp = 99.0                  # implausible: dropped
        if day == 12: continue                                   # buoy silent all day
        rows.append({"timestamp_utc": f"{d.isoformat()}T{hour:02d}:10:00Z", "temp_c": temp, "flags": flags})
rows.append({"timestamp_utc": "1970-01-01T00:00:00Z", "temp_c": 35.0, "flags": ""})  # unset clock, no flag

records = [rec(r["timestamp_utc"], r["temp_c"], r["flags"]) for r in rows]
timed = [r for r in records if has_valid_clock(r)]
agg = aggregate_daily(timed, samples_per_day=3)
pipeline = {"name": "readings_to_dhw", "mmm": 28.4, "samples_per_day": 3,
            "note": "three transmits a day; RTC_LOST, unset clock, implausible and low-coverage days excluded",
            "rows": rows,
            "expected_daily": [{"day": a.day.isoformat(), "temp_mean": a.temp_mean, "temp_n": a.temp_n, "coverage": a.coverage} for a in agg]}
series = daily_temperature_series(agg)
pipeline["expected_thermal"] = [
    {"day": t.day.isoformat(), "sst": t.sst, "hotspot": t.hotspot, "dhw": t.dhw, "alert": t.alert,
     "window_coverage": t.window_coverage} for t in bleaching.assess_thermal_stress(series, 28.4)]

for c in cases:
    daily = [(date.fromisoformat(d), t) for d, t in c["daily"]]
    out = bleaching.assess_thermal_stress(daily, c["mmm"])
    c["expected"] = [{"day": t.day.isoformat(), "sst": t.sst, "hotspot": t.hotspot, "dhw": t.dhw, "alert": t.alert,
                      "window_coverage": t.window_coverage} for t in out]
    s = bleaching.summarize(out, c["mmm"])
    c["expected_summary"] = {"threshold": s.threshold, "peak_dhw": s.peak_dhw,
        "peak_dhw_day": s.peak_dhw_day.isoformat() if s.peak_dhw_day else None, "peak_alert": s.peak_alert,
        "days_at_or_above_threshold": s.days_at_or_above_threshold, "n_days": s.n_days}

alert_cases = [[hs, dhw, bleaching.alert_level(hs, dhw)] for hs, dhw in
    [(0.0, 0.0), (-1.0, 5.0), (0.5, 0.0), (0.99, 30.0), (1.0, 0.0), (1.5, 2.0), (1.5, 3.999), (1.5, 4.0), (2.0, 8.0),
     (1.5, 11.9), (1.5, 12.0), (1.5, 15.9), (1.5, 16.0), (1.5, 19.9), (1.5, 20.0), (1.5, 40.0)]]

out = {"_about": "Shared fixture for the CRW heat-stress port: analytics/telemetry/bleaching.py is the reference and "
       "tests/test_heat_stress_fixture.py checks this file against it; console/test/heat-stress-test.js checks the "
       "console Worker's port (console/worker/heat-stress.js) against the same numbers. Regenerate with "
       "python3 telemetry/tests/fixtures/make_heat_stress_cases.py from analytics/.",
       "alert_levels": list(bleaching.ALERT_LEVELS), "alert_cases": alert_cases, "series_cases": cases,
       "pipeline_case": pipeline}
(HERE / "heat-stress-cases.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
