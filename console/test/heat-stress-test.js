/* The Worker's port of bleaching.py (worker/heat-stress.js) gives the Python's numbers, on the
 * fixture the Python itself generates (analytics/telemetry/tests/fixtures/heat-stress-cases.json;
 * analytics' test_heat_stress_fixture.py keeps that file equal to bleaching.py). */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  aggregateDaily, ALERT_LEVELS, alertLevel, assessThermalStress, bleachingThreshold, heatStressFromRows, hotspot, summarize,
} from "../worker/heat-stress.js";

const FIXTURE = JSON.parse(readFileSync(new URL("../../analytics/telemetry/tests/fixtures/heat-stress-cases.json", import.meta.url), "utf8"));
// Python rounds DHW and means to 3 places with its own summation; anything within this is the same number.
const TOLERANCE = 1e-9;

function assertClose(actual, expected, label) {
  if (expected === null) return assert.equal(actual, null, label);
  assert.ok(Math.abs(actual - expected) <= TOLERANCE, `${label}: ${actual} vs ${expected}`);
}

function assertSeries(actual, expected, name) {
  assert.equal(actual.length, expected.length, `${name}: day count`);
  expected.forEach((want, i) => {
    const got = actual[i];
    assert.equal(got.day, want.day, `${name}[${i}].day`);
    assert.equal(got.alert, want.alert, `${name} ${want.day} alert`);
    for (const key of ["sst", "hotspot", "dhw", "window_coverage"]) assertClose(got[key], want[key], `${name} ${want.day} ${key}`);
  });
}

test("the alert scale and its order match the Python", () => {
  assert.deepEqual(ALERT_LEVELS, FIXTURE.alert_levels);
  for (const [hs, dhw, expected] of FIXTURE.alert_cases) assert.equal(alertLevel(hs, dhw), expected, `hs ${hs}, dhw ${dhw}`);
});

test("HotSpot clips at zero and the threshold is MMM + 1 °C", () => {
  assert.equal(hotspot(30.0, 28.0), 2.0);
  assert.equal(hotspot(27.0, 28.0), 0.0);
  assert.equal(bleachingThreshold(28.0), 29.0);
});

for (const testCase of FIXTURE.series_cases) {
  test(`series case ${testCase.name} matches the Python: ${testCase.note}`, () => {
    const series = assessThermalStress(testCase.daily, testCase.mmm);
    assertSeries(series, testCase.expected, testCase.name);
    const summary = summarize(series, testCase.mmm);
    const want = testCase.expected_summary;
    assert.equal(summary.peak_alert, want.peak_alert);
    assert.equal(summary.peak_dhw_day, want.peak_dhw_day);
    assertClose(summary.peak_dhw, want.peak_dhw, "peak_dhw");
    assertClose(summary.threshold, want.threshold, "threshold");
    assert.equal(summary.days_at_or_above_threshold, want.days_at_or_above_threshold);
    assert.equal(summary.n_days, want.n_days);
  });
}

test("readings become daily means the way aggregate.py makes them", () => {
  const testCase = FIXTURE.pipeline_case;
  const daily = aggregateDaily(testCase.rows, testCase.samples_per_day);
  assert.equal(daily.length, testCase.expected_daily.length);
  testCase.expected_daily.forEach((want, i) => {
    assert.equal(daily[i].day, want.day);
    assert.equal(daily[i].temp_n, want.temp_n, `${want.day} temp_n`);
    assertClose(daily[i].temp_mean, want.temp_mean, `${want.day} temp_mean`);
    assertClose(daily[i].coverage, want.coverage, `${want.day} coverage`);
  });
});

test("readings run through to the same DHW as the Python pipeline", () => {
  const testCase = FIXTURE.pipeline_case;
  const { series } = heatStressFromRows(testCase.rows, testCase.mmm, testCase.samples_per_day);
  assertSeries(series, testCase.expected_thermal, "readings_to_dhw");
});

test("an RTC_LOST row and an unset clock never make a day", () => {
  const daily = aggregateDaily([
    { timestamp_utc: "2027-03-01T00:10:00Z", temp_c: "30", flags: "RTC_LOST" },
    { timestamp_utc: "1970-01-01T00:00:00Z", temp_c: "30", flags: "" },
  ], 3);
  assert.deepEqual(daily, []);
});

test("no readings give an empty series and a zero summary", () => {
  const { series, summary } = heatStressFromRows([], 28, 3);
  assert.deepEqual(series, []);
  assert.equal(summary.peak_dhw, 0);
  assert.equal(summary.peak_alert, "No Stress");
});
