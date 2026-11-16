import { beforeEach, describe, expect, test, vi } from "vitest";
import { arrange, loadTileOrder, mergeOrder, moveTile, saveTileOrder } from "./tile-order";

/** In memory: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, String(value)); } };
}

describe("tile order", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  test("the saved order leads; new tiles follow in their default order; gone ones are skipped", () => {
    expect(arrange(["temp_c", "turbidity_v", "turbidity_adc"], ["turbidity_v", "gone", "temp_c"])).toEqual(["turbidity_v", "temp_c", "turbidity_adc"]);
    expect(arrange(["a", "b"], undefined)).toEqual(["a", "b"]);
  });

  test("moving a tile puts it at the index among the others", () => {
    expect(moveTile(["temp_c", "turbidity_v", "turbidity_adc"], "temp_c", 1)).toEqual(["turbidity_v", "temp_c", "turbidity_adc"]);
    expect(moveTile(["a", "b", "c"], "c", -5)).toEqual(["c", "a", "b"]);
    expect(moveTile(["a", "b"], "zzz", 0)).toEqual(["a", "b"]);
  });

  test("reordering the tiles on show keeps the place of a tile hidden in this range", () => {
    // Saved: adc, temp, turb. The range has no adc; turb moves before temp.
    expect(mergeOrder(["turbidity_adc", "temp_c", "turbidity_v"], ["turbidity_v", "temp_c"])).toEqual(["turbidity_adc", "turbidity_v", "temp_c"]);
    expect(mergeOrder(undefined, ["b", "a"])).toEqual(["b", "a"]);
  });

  test("the order survives a reload, and junk in storage is ignored", () => {
    saveTileOrder({ Water: ["turbidity_v", "temp_c"] });
    expect(loadTileOrder()).toEqual({ Water: ["turbidity_v", "temp_c"] });
    window.localStorage.setItem("scout-console-tile-order", "{\"Water\": 3}");
    expect(loadTileOrder()).toEqual({});
  });
});
