// Sizes people give the Every metric tiles. A per-browser convenience, like the time range:
// kept in localStorage (tolerant of blocked storage), keyed by tile.

const STORAGE_KEY = "scout-console-tile-sizes";
export const TILE_STEP_PX = 20;
export const TILE_MIN_WIDTH_PX = 260;
export const TILE_MIN_HEIGHT_PX = 120;
export const TILE_MAX_PX = 2400;

/** A tile's width and height in pixels; a missing one means the tile sizes itself to fit. */
export interface TileSize { w?: number; h?: number }
export type TileSizes = Record<string, TileSize>;

const clamp = (raw: number, min: number) => Math.max(min, Math.min(TILE_MAX_PX, Math.round(raw / TILE_STEP_PX) * TILE_STEP_PX));

/** A dragged or stepped size snapped to 20 px and kept inside the bounds. */
export function snapTile(size: TileSize): TileSize {
  return {
    ...(size.w === undefined ? {} : { w: clamp(size.w, TILE_MIN_WIDTH_PX) }),
    ...(size.h === undefined ? {} : { h: clamp(size.h, TILE_MIN_HEIGHT_PX) }),
  };
}

/** Set one tile's size, or pass null to let it fit its content again. */
export function withTileSize(sizes: TileSizes, key: string, size: TileSize | null): TileSizes {
  const rest = Object.fromEntries(Object.entries(sizes).filter(([k]) => k !== key));
  return size === null ? rest : { ...rest, [key]: snapTile(size) };
}

function isSize(value: unknown): value is TileSize {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every((n) => typeof n === "number" && Number.isFinite(n));
}

export function loadTileSizes(): TileSizes {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => isSize(v)).map(([k, v]) => [k, snapTile(v as TileSize)]));
  } catch {
    return {};
  }
}

export function saveTileSizes(sizes: TileSizes): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch {
    // Storage blocked (private window): sizes last until the page reloads.
  }
}
