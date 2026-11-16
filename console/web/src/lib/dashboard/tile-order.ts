// The order people put the Every metric tiles in, per section. Like tile sizes, a per-browser
// convenience kept in localStorage (tolerant of blocked storage). A tile only moves inside its own
// section, so each section keeps its own list.

const STORAGE_KEY = "scout-console-tile-order";

/** Section name → tile keys in the chosen order. */
export type TileOrder = Record<string, string[]>;

/** The section's tiles in the saved order; tiles the saved order does not name keep their default
 * order after it, and saved keys no longer on the board are skipped. */
export function arrange(keys: readonly string[], saved: readonly string[] | undefined): string[] {
  const known = (saved ?? []).filter((key) => keys.includes(key));
  return [...known, ...keys.filter((key) => !known.includes(key))];
}

/** A new order of the tiles on show, merged into the saved order: each shown tile takes the next of
 * the slots shown tiles held, and tiles hidden for now (no data in this range) keep their places. */
export function mergeOrder(saved: readonly string[] | undefined, shown: readonly string[]): string[] {
  const full = arrange([...(saved ?? []), ...shown.filter((key) => !(saved ?? []).includes(key))], saved);
  const next = [...shown];
  return full.map((key) => (shown.includes(key) ? (next.shift() ?? key) : key));
}

/** Move one tile to `to` (an index in the section, clamped), keeping the rest in order. */
export function moveTile(keys: readonly string[], key: string, to: number): string[] {
  const rest = keys.filter((k) => k !== key);
  if (rest.length === keys.length) return [...keys];
  const at = Math.max(0, Math.min(rest.length, to));
  return [...rest.slice(0, at), key, ...rest.slice(at)];
}

export function loadTileOrder(): TileOrder {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((key) => typeof key === "string")));
  } catch {
    return {};
  }
}

export function saveTileOrder(order: TileOrder): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Storage blocked (private window): the order lasts until the page reloads.
  }
}
