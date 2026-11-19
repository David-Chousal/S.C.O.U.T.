import { expect, test } from "vitest";
import { fillFields, type MergeValues } from "./merge-fields";

const VALUES: MergeValues = { title: "Weekly", buoys: "Reef north, Reef south", from: "2026-11-11", to: "2026-11-18",
  period: "2026-11-11 to 2026-11-18", zone: "UTC", made: "2026-11-18 12:00 UTC" };

test("known fields are filled and unknown braces are left alone", () => {
  expect(fillFields("{title}: {buoys}, {period} ({zone}) {nope}", VALUES)).toBe("Weekly: Reef north, Reef south, 2026-11-11 to 2026-11-18 (UTC) {nope}");
});
