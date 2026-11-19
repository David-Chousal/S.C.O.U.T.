import { describe, expect, test } from "vitest";
import { createBlock, createDocument, type Block } from "./document";
import { historyReducer, initialHistory, reportReducer } from "./reducer";

const VARS = { buoys: [1, 2], range: { preset: "7d" as const, from: "", to: "" }, zone: "utc" as const };
const doc = (...blocks: Block[]) => createDocument(VARS, blocks);
const ids = (d: { blocks: Block[] }) => d.blocks.map((b) => b.id);

describe("reportReducer", () => {
  test("add puts a block at the end, or after the one named", () => {
    const start = doc(createBlock("summaryTable", "a"), createBlock("readingsTable", "b"));
    expect(ids(reportReducer(start, { type: "add", block: createBlock("divider", "c") }))).toEqual(["a", "b", "c"]);
    expect(ids(reportReducer(start, { type: "add", block: createBlock("divider", "c"), after: "a" }))).toEqual(["a", "c", "b"]);
  });

  test("add at an index puts the block there", () => {
    const start = doc(createBlock("divider", "a"), createBlock("divider", "b"));
    expect(ids(reportReducer(start, { type: "add", block: createBlock("text", "c"), at: 1 }))).toEqual(["a", "c", "b"]);
  });

  test("move and moveBy reorder without losing a block, and stop at the ends", () => {
    const start = doc(createBlock("divider", "a"), createBlock("divider", "b"), createBlock("divider", "c"));
    expect(ids(reportReducer(start, { type: "move", id: "a", to: 2 }))).toEqual(["b", "c", "a"]);
    expect(ids(reportReducer(start, { type: "moveBy", id: "c", delta: -1 }))).toEqual(["a", "c", "b"]);
    expect(reportReducer(start, { type: "moveBy", id: "a", delta: -1 })).toBe(start);
  });

  test("duplicate copies a block's options under a new id, just after it", () => {
    const start = doc(createBlock("summaryTable", "a"));
    const next = reportReducer(start, { type: "duplicate", id: "a", newId: "a2" });
    expect(ids(next)).toEqual(["a", "a2"]);
    expect(next.blocks[1].options).toEqual(start.blocks[0].options);
    expect(next.blocks[1].options).not.toBe(start.blocks[0].options);
  });

  test("update merges options and never mutates the previous document", () => {
    const start = doc(createBlock("readingsTable", "a"));
    const next = reportReducer(start, { type: "update", id: "a", options: { sampling: "daily" } });
    expect(next.blocks[0].options).toMatchObject({ sampling: "daily", rowCap: 200 });
    expect(start.blocks[0].options).toMatchObject({ sampling: "all" });
  });

  test("toggleHidden, setOverride and remove act on one block", () => {
    const start = doc(createBlock("summaryTable", "a"), createBlock("divider", "b"));
    expect(reportReducer(start, { type: "toggleHidden", id: "a" }).blocks[0].hidden).toBe(true);
    expect(reportReducer(start, { type: "setOverride", id: "a", override: { buoys: [2] } }).blocks[0].override).toEqual({ buoys: [2] });
    expect(ids(reportReducer(start, { type: "remove", id: "a" }))).toEqual(["b"]);
  });

  test("the report's title, variables and page are set as a whole", () => {
    const start = doc();
    expect(reportReducer(start, { type: "setTitle", title: "Weekly" }).title).toBe("Weekly");
    expect(reportReducer(start, { type: "setVariables", variables: { ...VARS, zone: "local" } }).variables.zone).toBe("local");
    expect(reportReducer(start, { type: "setPage", page: { size: "a4", orientation: "landscape" } }).page.size).toBe("a4");
  });
});

describe("historyReducer", () => {
  const start = () => initialHistory(doc(createBlock("summaryTable", "a")));

  test("undo goes back one change and redo brings it back", () => {
    let h = historyReducer(start(), { type: "setTitle", title: "One" });
    h = historyReducer(h, { type: "remove", id: "a" });
    h = historyReducer(h, { type: "undo" });
    expect(h.present.blocks).toHaveLength(1);
    expect(h.present.title).toBe("One");
    h = historyReducer(h, { type: "redo" });
    expect(h.present.blocks).toHaveLength(0);
  });

  test("a new change after an undo drops the redo branch", () => {
    let h = historyReducer(start(), { type: "setTitle", title: "One" });
    h = historyReducer(h, { type: "undo" });
    h = historyReducer(h, { type: "setTitle", title: "Two" });
    expect(h.future).toHaveLength(0);
    expect(historyReducer(h, { type: "redo" })).toBe(h);
  });

  test("typing into one field is one undo step, not one per key", () => {
    let h = start();
    for (const title of ["W", "We", "Wee", "Week"]) h = historyReducer(h, { type: "setTitle", title });
    expect(h.past).toHaveLength(1);
    expect(historyReducer(h, { type: "undo" }).present.title).toBe("Buoy report");
  });

  test("undo with nothing to undo changes nothing", () => {
    const h = start();
    expect(historyReducer(h, { type: "undo" })).toBe(h);
  });

  test("an action that changes nothing adds no undo step", () => {
    const h = start();
    expect(historyReducer(h, { type: "moveBy", id: "a", delta: -1 })).toBe(h);
  });

  test("setting a value to what it already is keeps the undo and redo history", () => {
    let h = historyReducer(start(), { type: "setTitle", title: "Weekly" });
    h = historyReducer(h, { type: "undo" });
    const same = historyReducer(h, { type: "setTitle", title: "Buoy report" });
    expect(same).toBe(h);
    expect(historyReducer(same, { type: "redo" }).present.title).toBe("Weekly");
    expect(historyReducer(h, { type: "remove", id: "gone" })).toBe(h);
  });
});
