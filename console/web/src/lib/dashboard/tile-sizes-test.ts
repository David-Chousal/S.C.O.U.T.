import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadTileSizes, saveTileSizes, snapTile, withTileSize } from "./tile-sizes";

/** In memory: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, String(value)); } };
}

describe("tile sizes", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  test("widths are whole columns; growth over snug is 0–240 px; the default size is dropped", () => {
    expect(snapTile({ span: 2.4, grow: 33 })).toEqual({ span: 2, grow: 32 });
    expect(snapTile({ grow: 900 })).toEqual({ grow: 240 });
    expect(snapTile({ span: 9, grow: -40 })).toEqual({ span: 6 });
    expect(snapTile({ span: 1 })).toEqual({});
  });

  test("null lets a tile go back to one column and snug, leaving the others alone", () => {
    const sizes = withTileSize(withTileSize({}, "temp_c", { span: 2 }), "battery_v", { grow: 60 });
    expect(withTileSize(sizes, "temp_c", null)).toEqual({ battery_v: { grow: 60 } });
  });

  test("sizes survive a reload, and junk or older fixed heights in storage are ignored", () => {
    saveTileSizes({ temp_c: { span: 2, grow: 40 } });
    expect(loadTileSizes()).toEqual({ temp_c: { span: 2, grow: 40 } });
    window.localStorage.setItem("scout-console-tile-sizes", "{\"x\": \"wide\", \"y\": {\"h\": 520}}");
    expect(loadTileSizes()).toEqual({});
  });
});
