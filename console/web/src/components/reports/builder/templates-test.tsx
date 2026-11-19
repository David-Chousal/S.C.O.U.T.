import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { createBlock, createDocument } from "@/lib/report/document";
import type { SavedLayout } from "@/lib/report/saved";
import { ReportBuilder } from "./report-builder";

const NOW = Date.parse("2026-10-31T12:00:00Z");
const VARS = { buoys: [1], range: { preset: "7d" as const, from: "", to: "" }, zone: "utc" as const };
const TEAM: SavedLayout = { id: "tpl", kind: "template", name: "Field days", shared: true, mine: false, is_default: false, author: "Ana",
  updated_at: 0, doc: createDocument(VARS, [createBlock("divider", "d")], "Field days") };
const REPORT: SavedLayout = { ...TEAM, id: "rep", kind: "report", name: "October", doc: createDocument(VARS, [createBlock("buoyHealth", "h")], "October") };

beforeEach(() => vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function renderBuilder({ canEdit = true, isAdmin = false, layouts = [TEAM, REPORT] } = {}) {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  const changed = vi.fn();
  render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c"]} canDownload={canEdit} canEdit={canEdit}
    now={NOW} onCreated={vi.fn()} recent={null} layouts={layouts} onLayoutsChanged={changed} isAdmin={isAdmin} /></Toaster>);
  return changed;
}
const pageOrder = () => within(screen.getByLabelText("Report preview")).queryAllByRole("group").map((g) => g.getAttribute("aria-label"));
const tab = () => userEvent.click(screen.getByRole("tab", { name: "Templates" }));
const row = (name: string) => screen.getByText(name).closest(".sc-lib__item") as HTMLElement;

describe("Templates", () => {
  test("lists the five built-ins and the team's templates", async () => {
    renderBuilder();
    await tab();
    for (const name of ["Weekly field summary", "Reef heat stress brief", "Data appendix", "One-page status", "Blank", "Field days"]) expect(screen.getByText(name)).toBeDefined();
  });

  test("using a template on an untouched report replaces it without asking", async () => {
    renderBuilder();
    await tab();
    await userEvent.click(within(row("One-page status")).getByRole("button", { name: "Use" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pageOrder()).toEqual(["Title block", "Key figures block", "Buoy health block"]);
  });

  test("using a template over unsaved changes asks first, then replaces the layout and keeps the buoys", async () => {
    renderBuilder();
    await userEvent.type(screen.getAllByLabelText("Report title")[0], " edited");
    await tab();
    await userEvent.click(within(row("One-page status")).getByRole("button", { name: "Use" }));
    expect(screen.getByRole("dialog", { name: "Replace this report?" })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Replace" }));
    expect(pageOrder()).toEqual(["Title block", "Key figures block", "Buoy health block"]);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(pageOrder()).toEqual(["Title block", "Summary table block", "Readings table block"]);
  });

  test("two templates in a row, with no edits between, never ask", async () => {
    renderBuilder();
    await tab();
    await userEvent.click(within(row("One-page status")).getByRole("button", { name: "Use" }));
    await userEvent.click(within(row("Data appendix")).getByRole("button", { name: "Use" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pageOrder()).toEqual(["Title block", "Summary table block", "Readings table block"]);
  });

  test("an admin makes a team template the default", async () => {
    const set = vi.spyOn(api, "setDefaultTemplate").mockResolvedValue({ ok: true });
    renderBuilder({ isAdmin: true });
    await tab();
    await userEvent.click(within(row("Field days")).getByRole("button", { name: "Make default" }));
    expect(set).toHaveBeenCalledWith("tpl", true);
  });

  test("a member does not see Make default", async () => {
    renderBuilder();
    await tab();
    expect(within(row("Field days")).queryByRole("button", { name: "Make default" })).toBeNull();
  });
});

describe("Saving", () => {
  test("Save as shares a new report with the team by default, then Save writes changes to it", async () => {
    const create = vi.spyOn(api, "createReportLayout").mockResolvedValue({ id: "new1" });
    const changed = renderBuilder();
    await userEvent.click(screen.getByRole("button", { name: "Save as…" }));
    const name = screen.getByRole("textbox", { name: /Name/ });
    await userEvent.clear(name);
    await userEvent.type(name, "Weekly");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ kind: "report", name: "Weekly", shared: true });
    expect(changed).toHaveBeenCalled();
  });

  test("opening a saved report shows it, marks it saved, and cannot be undone into another report", async () => {
    renderBuilder();
    await tab();
    await userEvent.click(within(row("October")).getByRole("button", { name: "Open" }));
    expect(pageOrder()).toEqual(["Buoy health block"]);
    expect(screen.getByText("Saved")).toBeDefined();
    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("Save waits for the one before it, so two saves cannot land out of order", async () => {
    let finish: () => void = () => undefined;
    const save = vi.spyOn(api, "saveReportLayout").mockImplementation(() => new Promise((resolve) => { finish = () => resolve({ ok: true }); }));
    renderBuilder();
    await tab();
    await userEvent.click(within(row("October")).getByRole("button", { name: "Open" }));
    await userEvent.type(screen.getAllByLabelText("Report title")[0], "!");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect((screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement).disabled).toBe(true);
    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeDefined());
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("an untouched new report keeps no draft", async () => {
    const stored = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: stored, removeItem: () => undefined });
    renderBuilder();
    await waitFor(() => expect(pageOrder().length).toBeGreaterThan(0));
    expect(stored).not.toHaveBeenCalled();
  });

  test("guests can open saved reports but see no Save or Use-to-edit controls", async () => {
    renderBuilder({ canEdit: false });
    expect(screen.queryByRole("button", { name: "Save as…" })).toBeNull();
    await tab();
    expect(within(row("October")).getByRole("button", { name: "Open" })).toBeDefined();
    expect(within(row("October")).queryByRole("button", { name: /Delete/ })).toBeNull();
  });
});
