import { describe, expect, test } from "vitest";
import { METRIC_PROFILES } from "./metric-profiles";
import { qcLabel, qualityControl } from "./qc";

const HOUR = 3600 * 1000;
const pts = (values: number[]) => values.map((v, i) => ({ t: i * 8 * HOUR, v }));

describe("QARTOD-style quality control", () => {
  test("outside the sensor's range fails; outside the site's range is suspect", () => {
    const qc = qualityControl(pts([26, 130, 40, 26.1]), METRIC_PROFILES.temp_c);
    expect(qc.flags.map((f) => f.code)).toEqual([1, 4, 3, 1].map((c, i) => (i === 2 ? 3 : c)));
    expect(qc.flags[1].tests).toContain("Sensor range");
    expect(qc.flags[2].tests).toContain("Site range");
  });

  test("a spike against its neighbours is suspect", () => {
    const qc = qualityControl(pts([26, 26.1, 29, 26.2, 26.1]), METRIC_PROFILES.temp_c);
    expect(qc.flags[2].tests).toContain("Spike");
    expect(qc.flags[1].tests).not.toContain("Spike");
  });

  test("a point with a long silence on either side is not judged a spike", () => {
    const points = [{ t: 0, v: 26 }, { t: HOUR, v: 29 }, { t: 51 * HOUR, v: 26 }];
    expect(qualityControl(points, METRIC_PROFILES.temp_c).flags[1].tests).not.toContain("Spike");
  });

  test("a long stuck run is still found (and found in linear time)", () => {
    const qc = qualityControl(pts(Array.from({ length: 20000 }, () => 26.3)), METRIC_PROFILES.temp_c);
    expect(qc.byTest["Flat line"]).toBe(20000);
  });

  test("a step across a silent gap is not a fast change", () => {
    const values = [3.9, 3.89, 3.88, 3.87, 3.86, 3.85, 3.84, 3.83, 3.7, 3.69];
    const points = values.map((v, i) => ({ t: (i < 8 ? i * 8 : i * 8 + 40) * HOUR, v }));
    expect(qualityControl(points, METRIC_PROFILES.battery_v).byTest["Rate of change"]).toBeUndefined();
  });

  test("a stuck sensor (flat line) is suspect", () => {
    const qc = qualityControl(pts([26, 26.3, 26.3, 26.3, 26.3, 26.3, 26.3, 26.5]), METRIC_PROFILES.temp_c);
    expect(qc.byTest["Flat line"]).toBe(6);
  });

  test("acoustic values from a clipped recording are suspect", () => {
    const qc = qualityControl(pts([-2000, -2100]), METRIC_PROFILES.lvl_bio_cdb, new Set([8 * HOUR]));
    expect(qc.flags[1].tests).toEqual(["Clipped recording"]);
  });

  test("the label reads plainly", () => {
    expect(qcLabel({ fail: 0, suspect: 0 })).toBe("QC pass");
    expect(qcLabel({ fail: 1, suspect: 2 })).toBe("1 fail · 2 suspect");
  });
});
