import { describe, expect, test } from "vitest";
import { paginate, type MeasuredBlock } from "./paginate";

const block = (id: string, ...heights: number[]): MeasuredBlock => ({ id, pageBreak: false, units: heights.map((height) => ({ height })) });
const table = (id: string, head: number, rows: number[]): MeasuredBlock => ({ id, pageBreak: false, units: [{ height: head + rows.reduce((a, b) => a + b, 0), split: { head, rows } }] });
const GAPS = { block: 20, unit: 10 };

describe("paginate", () => {
  test("blocks that fit share a page, in order", () => {
    expect(paginate([block("a", 100), block("b", 100)], 1000, GAPS)).toEqual([[{ blockId: "a", unit: 0 }, { blockId: "b", unit: 0 }]]);
  });

  test("a block taller than the space left moves whole to the next page", () => {
    const pages = paginate([block("a", 700), block("b", 400)], 1000, GAPS);
    expect(pages.map((p) => p.map((f) => f.blockId))).toEqual([["a"], ["b"]]);
  });

  test("a page break block starts a new page and takes no room itself", () => {
    const pages = paginate([block("a", 100), { id: "br", pageBreak: true, units: [] }, block("b", 100)], 1000, GAPS);
    expect(pages.map((p) => p.map((f) => f.blockId))).toEqual([["a"], ["b"]]);
  });

  test("a table splits by rows and repeats its header on the next page", () => {
    const pages = paginate([block("a", 500), table("t", 50, Array(30).fill(20))], 1000, GAPS);
    expect(pages).toEqual([
      [{ blockId: "a", unit: 0 }, { blockId: "t", unit: 0, rows: [0, 21] }],
      [{ blockId: "t", unit: 0, rows: [21, 30] }],
    ]);
  });

  test("a table with no room for its header and one row moves to the next page instead", () => {
    const pages = paginate([block("a", 950), table("t", 50, [20, 20])], 1000, GAPS);
    expect(pages[1]).toEqual([{ blockId: "t", unit: 0 }]);
  });

  test("a block taller than a whole page gets a page to itself rather than looping", () => {
    expect(paginate([block("a", 100), block("huge", 3000), block("b", 100)], 1000, GAPS).map((p) => p.map((f) => f.blockId)))
      .toEqual([["a"], ["huge"], ["b"]]);
  });

  test("a block's units flow separately, so a two-buoy block can break between buoys", () => {
    const pages = paginate([block("two", 600, 600)], 1000, GAPS);
    expect(pages).toEqual([[{ blockId: "two", unit: 0 }], [{ blockId: "two", unit: 1 }]]);
  });

  test("an empty report is one empty page", () => {
    expect(paginate([], 1000, GAPS)).toEqual([[]]);
  });
});
