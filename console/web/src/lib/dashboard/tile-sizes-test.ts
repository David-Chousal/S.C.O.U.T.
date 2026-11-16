import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadTileSizes, saveTileSizes, snapTile, withTileSize } from "./tile-sizes";

/** In memory: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, String(value)); } };
}

describe("tile sizes", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  test("widths are whole tile columns and heights round up to 4 px; the default size is dropped", () => {
    expect(snapTile({ span: 2.4, h: 331 })).toEqual({ span: 2, h: 332 });
    expect(snapTile({ span: 9 })).toEqual({ span: 6 });
    expect(snapTile({ span: 1 })).toEqual({});
  });

  test("null lets a tile fit its content again, leaving the others alone", () => {
    const sizes = withTileSize(withTileSize({}, "temp_c", { span: 2 }), "battery_v", { h: 300 });
    expect(withTileSize(sizes, "temp_c", null)).toEqual({ battery_v: { h: 300 } });
  });

  test("sizes survive a reload, and junk or older pixel widths in storage are ignored", () => {
    saveTileSizes({ temp_c: { span: 2, h: 300 } });
    expect(loadTileSizes()).toEqual({ temp_c: { span: 2, h: 300 } });
    window.localStorage.setItem("scout-console-tile-sizes", "{\"x\": \"wide\", \"y\": {\"w\": 520}}");
    expect(loadTileSizes()).toEqual({});
  });
});
