// The shell's adjustable widths: the menu on the left (from full width down to an icon rail) and
// Fred's panel on the right. Per browser, like the page preferences, and every storage read and
// write tolerates storage being blocked.

export const SIDE = Object.freeze({ max: 248, min: 160, rail: 64 });
export const FRED = Object.freeze({ min: 320, max: 720, start: 400 });
/** Narrowest the page itself may get between the two panels. */
export const PAGE_MIN = 420;
/** Below this viewport width Fred's panel floats over the page instead of squeezing it. */
export const DOCK_FROM = 1024;

export interface ShellLayout {
  /** The menu's width when expanded. */
  sideWidth: number;
  sideCollapsed: boolean;
  fredWidth: number;
}

export const STORAGE_KEY = "scout-console-layout";
export const DEFAULT_LAYOUT: ShellLayout = { sideWidth: SIDE.max, sideCollapsed: false, fredWidth: FRED.start };

const within = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A dragged menu width: below halfway between the rail and the narrowest menu it collapses,
 * keeping the last width so Expand brings it back. */
export function dragSide(px: number): Partial<Pick<ShellLayout, "sideWidth" | "sideCollapsed">> {
  if (px < (SIDE.rail + SIDE.min) / 2) return { sideCollapsed: true };
  return { sideWidth: within(Math.round(px), SIDE.min, SIDE.max), sideCollapsed: false };
}

/** Fred's width, kept so the page between the panels never gets narrower than PAGE_MIN. */
export function clampFred(px: number, viewport: number, side: number): number {
  const room = viewport - side - PAGE_MIN;
  return Math.round(within(px, FRED.min, Math.max(FRED.min, Math.min(FRED.max, room))));
}

export function sideOf(layout: ShellLayout): number {
  return layout.sideCollapsed ? SIDE.rail : layout.sideWidth;
}

export function parseLayout(raw: string | null): ShellLayout {
  if (!raw) return DEFAULT_LAYOUT;
  try {
    const value = JSON.parse(raw) as Partial<ShellLayout>;
    const number = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
    return {
      sideWidth: within(number(value.sideWidth, SIDE.max), SIDE.min, SIDE.max),
      sideCollapsed: value.sideCollapsed === true,
      fredWidth: within(number(value.fredWidth, FRED.start), FRED.min, FRED.max),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function loadLayout(): ShellLayout {
  try {
    return parseLayout(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(layout: ShellLayout): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Blocked storage only means the widths reset next visit; the page works the same.
  }
}
