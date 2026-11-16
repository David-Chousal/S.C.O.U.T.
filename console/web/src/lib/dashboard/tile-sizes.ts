// Sizes people give the Every metric tiles. A per-browser convenience, like the time range:
// kept in localStorage (tolerant of blocked storage), keyed by tile.

const STORAGE_KEY = "scout-console-tile-sizes";
export const TILE_STEP_PX = 20;
const GROW_GRAIN_PX = 4;
export const TILE_MAX_SPAN = 6;
/** The most height a tile can gain over its snug height. Snug (0) is the least. */
export const TILE_MAX_GROW_PX = 240;

/** How many tile columns a tile spans, and how many pixels taller than snug it is. The extra goes
 * into its charts (or the spacing of its rows), so the tile re-snugs whenever its content changes,
 * such as a new time range. Missing means the default: one column, snug. */
export interface TileSize { span?: number; grow?: number }
export type TileSizes = Record<string, TileSize>;

/** A dragged or stepped size: whole columns, growth to 4 px between snug and the cap. One column
 * and no growth are the default, so they are dropped. */
export function snapTile(size: TileSize): TileSize {
  const span = size.span === undefined ? 1 : Math.max(1, Math.min(TILE_MAX_SPAN, Math.round(size.span)));
  const grow = Math.max(0, Math.min(TILE_MAX_GROW_PX, Math.round((size.grow ?? 0) / GROW_GRAIN_PX) * GROW_GRAIN_PX));
  return { ...(span > 1 ? { span } : {}), ...(grow > 0 ? { grow } : {}) };
}

/** Set one tile's size, or pass null (or the default size) to let it fit its content again. */
export function withTileSize(sizes: TileSizes, key: string, size: TileSize | null): TileSizes {
  const rest = Object.fromEntries(Object.entries(sizes).filter(([k]) => k !== key));
  const snapped = size === null ? {} : snapTile(size);
  return Object.keys(snapped).length === 0 ? rest : { ...rest, [key]: snapped };
}

function isSize(value: unknown): value is TileSize {
  if (typeof value !== "object" || value === null) return false;
  const { span, grow } = value as Record<string, unknown>;
  return (span === undefined || Number.isInteger(span)) && (grow === undefined || (typeof grow === "number" && Number.isFinite(grow))) && (span !== undefined || grow !== undefined);
}

export function loadTileSizes(): TileSizes {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.entries(parsed).reduce<TileSizes>((sizes, [key, value]) => (isSize(value) ? withTileSize(sizes, key, value) : sizes), {});
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
