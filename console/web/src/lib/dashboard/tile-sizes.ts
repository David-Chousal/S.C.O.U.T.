// Sizes people give the Every metric tiles. A per-browser convenience, like the time range:
// kept in localStorage (tolerant of blocked storage), keyed by tile.

const STORAGE_KEY = "scout-console-tile-sizes";
export const TILE_STEP_PX = 20;
export const TILE_MAX_SPAN = 6;
export const TILE_MAX_HEIGHT_PX = 2400;

/** How many tile columns a tile spans, and a minimum height in pixels. A missing one means the
 * default (one column, the row's height). The height only adds room: content is never hidden. */
export interface TileSize { span?: number; h?: number }
export type TileSizes = Record<string, TileSize>;

/** A dragged or stepped size: whole columns, 20 px steps, inside the bounds. A single column and
 * no height are the default, so they are dropped. */
export function snapTile(size: TileSize): TileSize {
  const span = size.span === undefined ? 1 : Math.max(1, Math.min(TILE_MAX_SPAN, Math.round(size.span)));
  const h = size.h === undefined ? undefined : Math.min(TILE_MAX_HEIGHT_PX, Math.round(size.h / TILE_STEP_PX) * TILE_STEP_PX);
  return { ...(span > 1 ? { span } : {}), ...(h ? { h } : {}) };
}

/** Set one tile's size, or pass null (or the default size) to let it fit its content again. */
export function withTileSize(sizes: TileSizes, key: string, size: TileSize | null): TileSizes {
  const rest = Object.fromEntries(Object.entries(sizes).filter(([k]) => k !== key));
  const snapped = size === null ? {} : snapTile(size);
  return Object.keys(snapped).length === 0 ? rest : { ...rest, [key]: snapped };
}

function isSize(value: unknown): value is TileSize {
  if (typeof value !== "object" || value === null) return false;
  const { span, h } = value as Record<string, unknown>;
  return (span === undefined || Number.isInteger(span)) && (h === undefined || (typeof h === "number" && Number.isFinite(h))) && (span !== undefined || h !== undefined);
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
