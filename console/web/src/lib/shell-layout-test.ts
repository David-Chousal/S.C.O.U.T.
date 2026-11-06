import { describe, expect, test } from "vitest";
import { clampFred, DEFAULT_LAYOUT, dragSide, FRED, PAGE_MIN, parseLayout, SIDE, sideOf } from "./shell-layout";

describe("dragSide", () => {
  test("never wider than today's menu, and stops at the narrowest labelled width", () => {
    expect(dragSide(400)).toEqual({ sideWidth: SIDE.max, sideCollapsed: false });
    expect(dragSide(200)).toEqual({ sideWidth: 200, sideCollapsed: false });
    expect(dragSide(120)).toEqual({ sideWidth: SIDE.min, sideCollapsed: false });
  });

  test("dragging close to the rail collapses to icons", () => {
    expect(dragSide(100)).toEqual({ sideCollapsed: true });
    expect(sideOf({ ...DEFAULT_LAYOUT, sideCollapsed: true })).toBe(SIDE.rail);
  });
});

describe("clampFred", () => {
  test("keeps Fred between its limits", () => {
    expect(clampFred(100, 2000, 248)).toBe(FRED.min);
    expect(clampFred(5000, 3000, 248)).toBe(FRED.max);
  });

  test("never squeezes the page below its minimum", () => {
    expect(clampFred(700, 1280, 248)).toBe(1280 - 248 - PAGE_MIN);
    expect(clampFred(700, 900, 248)).toBe(FRED.min);
  });
});

describe("parseLayout", () => {
  test("falls back on anything missing or malformed", () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout("{bad")).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout(JSON.stringify({ sideWidth: 9999, fredWidth: "x", sideCollapsed: true })))
      .toEqual({ sideWidth: SIDE.max, sideCollapsed: true, fredWidth: FRED.start });
  });
});
