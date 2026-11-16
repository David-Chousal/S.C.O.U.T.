import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { addBay, BAY_KINDS, isOnBoard, moveBay, normalizeBays, placeBay, setHeight, setSpan, snapHeight, snapSpan, systemDefault } from "./layout";

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

  test("move and place keep every bay; widths stay inside what the kind allows", () => {
    const bays = systemDefault([1]);
    expect(moveBay(bays, 0, 99).at(-1)?.id).toBe(bays[0].id);
    expect(placeBay(bays, "health", 2).map((b) => b.id)).toEqual(["metrics", "trace-temp_c", "health", "heat", "latest-1"]);
    expect(placeBay(bays, "latest-1", 0)[0].id).toBe("latest-1");
    expect(setSpan(bays, "metrics", 6).find((b) => b.id === "metrics")?.span).toBe(6);
    expect(setSpan(bays, "health", 6).find((b) => b.id === "health")?.span).toBe(12);
  });

  test("a resize drag snaps to the nearest width the kind allows", () => {
    expect(snapSpan("fleet", 7.2)).toBe(6);
    expect(snapSpan("metrics", 8.9)).toBe(6);
    expect(snapSpan("metrics", 9)).toBe(12);
    expect(snapSpan("health", 2)).toBe(12);
  });

  test("a bay's height snaps to 20 px inside its bounds, and null lets it fit its content again", () => {
    expect(snapHeight(431)).toBe(440);
    expect(snapHeight(10)).toBe(120);
    expect(snapHeight(9000)).toBe(2400);
    const tall = setHeight(systemDefault([1]), "health", 503);
    expect(tall.find((b) => b.id === "health")?.height).toBe(500);
    expect(setHeight(tall, "health", null).find((b) => b.id === "health")).not.toHaveProperty("height");
  });

  test("a stored width a kind no longer allows snaps to one it does", () => {
    const old = [{ id: "heat", kind: "heat", span: 6 }, { id: "fleet", kind: "fleet", span: 4 }] as const;
    expect(normalizeBays([...old]).map((b) => b.span)).toEqual([12, 6]);
  });

  test("a bay dropped from the library lands where it was dropped", () => {
    expect(addBay(systemDefault([1]), "fleet", {}, 2)[2]).toMatchObject({ id: "fleet", kind: "fleet" });
  });
});
