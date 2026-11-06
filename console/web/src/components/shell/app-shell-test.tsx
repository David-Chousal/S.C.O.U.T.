import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { FRED, PAGE_MIN, SIDE, STORAGE_KEY } from "@/lib/shell-layout";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/fleet/", useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const user = { id: "u1", name: "Ada", email: "ada@scout.test", role: "member" as const, hasPassword: true, github: false, google: false, selfSignup: false };

async function renderShell() {
  render(<AppShell title="Fleet"><p>Page body</p></AppShell>);
  return screen.findByText("Page body");
}

const shell = () => document.querySelector<HTMLElement>(".sc-shell")!;

/** An in-memory Storage: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key); },
    setItem: (key, value) => { items.set(key, String(value)); },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("sessionStorage", memoryStorage());
  vi.stubGlobal("innerWidth", 1600);
  vi.spyOn(api, "session").mockResolvedValue({ user, csrf: "c" });
  vi.spyOn(api, "fredStatus").mockResolvedValue({ enabled: true, used: 0, cap: 40 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AppShell", () => {
  test("Fred docks in the shell's third column, so the page squeezes rather than being covered", async () => {
    await renderShell();
    expect(shell().style.getPropertyValue("--fred-col")).toBe("0px");
    expect(screen.queryByRole("dialog", { name: "Ask Fred" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Ask Fred/ }));
    expect(screen.getByRole("dialog", { name: "Ask Fred" })).toBeDefined();
    expect(shell().classList.contains("sc-shell--fred")).toBe(true);
    expect(shell().style.getPropertyValue("--fred-col")).toBe(`${FRED.start}px`);
    await userEvent.click(screen.getByRole("button", { name: "Close Fred" }));
    expect(screen.queryByRole("dialog", { name: "Ask Fred" })).toBeNull();
    expect(shell().style.getPropertyValue("--fred-col")).toBe("0px");
    expect(document.activeElement?.className).toContain("sc-ask");
  });

  test("Fred's panel resizes from its edge with the keyboard, and the width is remembered", async () => {
    await renderShell();
    await userEvent.click(screen.getByRole("button", { name: /Ask Fred/ }));
    const handle = screen.getByRole("separator", { name: "Fred's panel width" });
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(handle.getAttribute("aria-valuenow")).toBe(String(FRED.start + 32));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").fredWidth).toBe(FRED.start + 32);
  });

  test("the menu collapses to icons and back, and narrows from its edge", async () => {
    await renderShell();
    expect(shell().style.getPropertyValue("--side-w")).toBe(`${SIDE.max}px`);
    await userEvent.click(screen.getByRole("button", { name: "Collapse menu" }));
    expect(shell().style.getPropertyValue("--side-w")).toBe(`${SIDE.rail}px`);
    expect(within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Fleet" }).getAttribute("title")).toBe("Fleet");
    await userEvent.click(screen.getByRole("button", { name: "Expand menu" }));
    const handle = screen.getByRole("separator", { name: "Menu width" });
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(shell().style.getPropertyValue("--side-w")).toBe(`${SIDE.max - 32}px`);
    await userEvent.keyboard("{Home}");
    expect(shell().style.getPropertyValue("--side-w")).toBe(`${SIDE.rail}px`);
  });

  test("keeps the page at least its minimum width on a smaller screen", async () => {
    vi.stubGlobal("innerWidth", 1060);
    await renderShell();
    await userEvent.click(screen.getByRole("button", { name: /Ask Fred/ }));
    expect(shell().style.getPropertyValue("--fred-col")).toBe(`${1060 - SIDE.max - PAGE_MIN}px`);
  });

  test("never widens the menu past its full width", async () => {
    await renderShell();
    screen.getByRole("separator", { name: "Menu width" }).focus();
    await userEvent.keyboard("{ArrowRight}{End}");
    expect(shell().style.getPropertyValue("--side-w")).toBe(`${SIDE.max}px`);
  });
});
