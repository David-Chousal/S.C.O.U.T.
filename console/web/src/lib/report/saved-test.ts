import { afterEach, describe, expect, test, vi } from "vitest";
import { createBlock, createDocument } from "./document";
import { chooseStart, readDraft, readLink, writeDraft, writeLink, type SavedLayout } from "./saved";

const NOW = Date.parse("2026-11-18T12:00:00Z");
const VARS = { buoys: [1, 2], range: { preset: "30d" as const, from: "", to: "" }, zone: "local" as const };
const layout = (over: Partial<SavedLayout>): SavedLayout => ({ id: "x", kind: "report", name: "R", shared: true, mine: true, is_default: false, author: null,
  updated_at: 0, doc: createDocument(VARS, [createBlock("divider", "d")], "Saved"), ...over });

describe("links", () => {
  test("a link round-trips the report id and variables", () => {
    const link = writeLink("abc", { buoys: [1, 2], range: { preset: "custom", from: "2026-11-01", to: "2026-11-07" }, zone: "utc" });
    expect(link).toBe("?report=abc&buoys=1,2&range=custom:2026-11-01:2026-11-07&zone=utc");
    expect(readLink(link, [1, 2, 3])).toEqual({ reportId: "abc", variables: { buoys: [1, 2], range: { preset: "custom", from: "2026-11-01", to: "2026-11-07" }, zone: "utc" } });
  });

  test("unknown buoys and junk values in a link are ignored", () => {
    expect(readLink("?buoys=9,x&range=forever&zone=mars", [1, 2]).variables).toEqual({});
  });
});

describe("chooseStart", () => {
  test("a saved report named in the link opens, with the link's variables on top", () => {
    const start = chooseStart({ search: "?report=x&range=24h", draft: null, layouts: [layout({})], buoys: [1, 2], now: NOW });
    expect(start.source).toBe("saved");
    expect(start.doc.title).toBe("Saved");
    expect(start.doc.variables.range.preset).toBe("24h");
  });

  test("without a link, a draft in this browser comes back", () => {
    const draft = { reportId: null, doc: createDocument(VARS, [], "Draft") };
    expect(chooseStart({ search: "", draft, layouts: [], buoys: [1], now: NOW }).doc.title).toBe("Draft");
  });

  test("with no draft, the team's default template starts the report, keeping the fleet's buoys", () => {
    const team = layout({ id: "t", kind: "template", is_default: true });
    const start = chooseStart({ search: "", draft: null, layouts: [team], buoys: [1, 2, 3], now: NOW });
    expect(start.source).toBe("template");
    expect(start.doc.blocks.map((b) => b.kind)).toEqual(["divider"]);
    expect(start.doc.blocks[0].id).not.toBe("d");
    expect(start.doc.variables.buoys).toEqual([1, 2, 3]);
  });

  test("otherwise it is the plain report: title, summary and readings for every buoy", () => {
    const start = chooseStart({ search: "", draft: null, layouts: [], buoys: [1, 2], now: NOW });
    expect(start.source).toBe("new");
    expect(start.doc.blocks.map((b) => b.kind)).toEqual(["title", "summaryTable", "readingsTable"]);
  });
});

afterEach(() => vi.unstubAllGlobals());

/** In memory: this jsdom's own localStorage is not usable under Node's test runner. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

test("with storage blocked there is simply no draft", () => {
  vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
  expect(() => writeDraft("u1", { reportId: null, doc: createDocument(VARS, [], "x") })).not.toThrow();
  expect(readDraft("u1")).toBeNull();
});

test("a draft is kept per account: another account on this browser never sees it", () => {
  vi.stubGlobal("localStorage", memoryStorage());
  writeDraft("u1", { reportId: "r", doc: createDocument(VARS, [], "Kept") });
  expect(readDraft("u1")?.doc.title).toBe("Kept");
  expect(readDraft("u2")).toBeNull();
  writeDraft("u1", null);
  expect(readDraft("u1")).toBeNull();
});
