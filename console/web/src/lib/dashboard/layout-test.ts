import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { addBay, BAY_KINDS, isOnBoard, moveBay, resizeBay, stepSpan, systemDefault } from "./layout";

describe("dashboard layout", () => {
  test("kinds and widths match the Worker's validator", () => {
    const worker = readFileSync(resolve(process.cwd(), "../worker/dashboards.js"), "utf8");
    for (const [kind, info] of Object.entries(BAY_KINDS)) {
      expect(worker).toContain(`${kind}: { spans: [${info.spans.join(", ")}], buoy: ${info.buoy}, variable: ${info.variable} }`);
    }
  });

  test("the default board leads with fleet status and every metric, and follows the first buoy", () => {
    expect(systemDefault([2, 1]).find((b) => b.kind === "latest")?.buoy).toBe(2);
    expect(systemDefault([]).map((b) => b.kind)).toEqual(["health", "metrics", "trace", "heat"]);
  });

  test("adding gives a unique id at the top, and a bay already on the board is known", () => {
    const start = addBay(systemDefault([1]), "readout", { buoy: 1, variable: "temp_c" });
    const next = addBay(start, "readout", { buoy: 1, variable: "temp_c" });
    expect(next[0].id).toBe("readout-1-temp_c-2");
    expect(isOnBoard(start, { kind: "readout", buoy: 1, variable: "temp_c" })).toBe(true);
    expect(isOnBoard(start, { kind: "readout", buoy: 2, variable: "temp_c" })).toBe(false);
  });

  test("move, snap-resize and step stay inside the allowed widths", () => {
    const bays = systemDefault([1]);
    expect(moveBay(bays, 0, 99).at(-1)?.id).toBe(bays[0].id);
    expect(resizeBay(bays, "metrics", 10).find((b) => b.id === "metrics")?.span).toBe(12);
    expect(resizeBay(bays, "health", 3).find((b) => b.id === "health")?.span).toBe(12);
    expect(stepSpan("trace", 12, 1)).toBe(12);
    expect(stepSpan("trace", 12, -1)).toBe(6);
  });
});
