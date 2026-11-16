import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadTileSizes, saveTileSizes, snapTile, withTileSize } from "./tile-sizes";

/** In memory: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, String(value)); } };
}

describe("tile sizes", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  test("sizes snap to 20 px and never go below a readable minimum", () => {
    expect(snapTile({ w: 331, h: 50 })).toEqual({ w: 340, h: 120 });
    expect(snapTile({ w: 100 })).toEqual({ w: 260 });
  });

  test("null lets a tile fit its content again, leaving the others alone", () => {
    const sizes = withTileSize(withTileSize({}, "temp_c", { w: 400 }), "battery_v", { h: 300 });
    expect(withTileSize(sizes, "temp_c", null)).toEqual({ battery_v: { h: 300 } });
  });

  test("sizes survive a reload, and junk in storage is ignored", () => {
    saveTileSizes({ temp_c: { w: 400, h: 300 } });
    expect(loadTileSizes()).toEqual({ temp_c: { w: 400, h: 300 } });
    window.localStorage.setItem("scout-console-tile-sizes", "{\"x\": \"wide\"}");
    expect(loadTileSizes()).toEqual({});
  });
});
