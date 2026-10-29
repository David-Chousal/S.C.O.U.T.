// Page preferences: per browser, not per account. They change only how this browser shows the
// console (theme, how times read, keyboard shortcuts), so they live in localStorage, and every
// read and write tolerates storage being blocked (private windows, strict settings).

export type ThemeChoice = "light" | "dark" | "system";
export type TimeChoice = "utc" | "local";

export interface Preferences {
  theme: ThemeChoice;
  time: TimeChoice;
  shortcuts: boolean;
}

export const STORAGE_KEY = "scout-console-preferences";
export const DEFAULT_PREFERENCES: Preferences = { theme: "light", time: "utc", shortcuts: true };

export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const value = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: value.theme === "dark" || value.theme === "system" ? value.theme : "light",
      time: value.time === "local" ? "local" : "utc",
      shortcuts: value.shortcuts !== false,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function loadPreferences(): Preferences {
  try {
    return parsePreferences(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Save, and report whether this browser kept it (false when storage is blocked). */
export function savePreferences(preferences: Preferences): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

/** Light and dark pin the theme; system removes the pin so the OS setting decides. */
export function applyTheme(theme: ThemeChoice, root: HTMLElement = document.documentElement): void {
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Runs in <head> before the first paint (inline, given the page's nonce by the Worker), so a
 * saved dark or system choice never flashes light first. Kept tiny and dependency-free. */
export const THEME_BOOT_SCRIPT =
  `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");` +
  `if(p.theme==="dark")document.documentElement.setAttribute("data-theme","dark");` +
  `else if(p.theme==="system")document.documentElement.removeAttribute("data-theme")}catch(e){}`;
