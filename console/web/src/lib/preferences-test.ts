import { describe, expect, test } from "vitest";
import { applyTheme, DEFAULT_PREFERENCES, parsePreferences, THEME_BOOT_SCRIPT } from "./preferences";

describe("preferences", () => {
  test("the console defaults to the light theme, UTC times and shortcuts on", () => {
    expect(DEFAULT_PREFERENCES).toEqual({ theme: "light", time: "utc", shortcuts: true });
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  test("a saved choice is read back, and anything unrecognised falls back to the default", () => {
    expect(parsePreferences('{"theme":"dark","time":"local","shortcuts":false}'))
      .toEqual({ theme: "dark", time: "local", shortcuts: false });
    expect(parsePreferences('{"theme":"neon","time":"mars"}')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("not json")).toEqual(DEFAULT_PREFERENCES);
  });

  test("system removes the pinned theme so the device setting decides", () => {
    const root = document.createElement("html");
    applyTheme("dark", root);
    expect(root.getAttribute("data-theme")).toBe("dark");
    applyTheme("system", root);
    expect(root.hasAttribute("data-theme")).toBe(false);
  });

  test("the boot script leaves light alone and only switches for a saved dark or system choice", () => {
    expect(THEME_BOOT_SCRIPT).toContain('p.theme==="dark"');
    expect(THEME_BOOT_SCRIPT).not.toContain('"light"');
  });
});
