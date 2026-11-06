import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { ApiError, type FredEvent } from "@/lib/api/types";
import { contextFrom, FredPanel, historyFor, reportText, type FredTurn } from "./fred-panel";
import { FredMarkdown } from "./fred-markdown";

vi.mock("next/navigation", () => ({ usePathname: () => "/fleet/" }));

const member = { id: "u1", name: "Ada", email: "ada@scout.test", role: "member" as const, hasPassword: true, github: false, google: false, selfSignup: false };

function scripted(events: FredEvent[]) {
  return vi.spyOn(api, "askFred").mockImplementation(async (_messages, _context, onEvent) => {
    for (const event of events) onEvent(event);
  });
}

afterEach(() => vi.restoreAllMocks());

function open(onClose = vi.fn(), user = member) {
  vi.spyOn(api, "fredStatus").mockResolvedValue({ enabled: true, used: 2, cap: 40 });
  render(<FredPanel user={user} onClose={onClose} />);
  return onClose;
}

describe("FredPanel", () => {
  test("shows suggestions and today's usage, and no standing notice", async () => {
    open();
    expect(screen.queryByText(/Google may review/)).toBeNull();
    expect(screen.getByRole("button", { name: /missed a transmission/ })).toBeDefined();
    expect(await screen.findByText("2 of 40 questions today")).toBeDefined();
  });

  test("streams an answer with the tools Fred used, and sends the page as context", async () => {
    const ask = scripted([
      { event: "tool", data: { name: "list_buoys", label: "Looked at Fleet" } },
      { event: "text", data: { delta: "Reef south is **silent**." } },
      { event: "done", data: { provider: "gemini", used: 3, cap: 40 } },
    ]);
    open();
    await userEvent.type(screen.getByLabelText("Your question"), "Which are late?{Enter}");
    expect(await screen.findByText("silent")).toBeDefined();
    expect(screen.getByText("Looked at Fleet")).toBeDefined();
    expect(ask.mock.calls[0][0]).toEqual([{ role: "user", text: "Which are late?" }]);
    expect(ask.mock.calls[0][1]).toMatchObject({ page: "fleet" });
    expect(screen.getByText("3 of 40 questions today")).toBeDefined();
  });

  test("shows a refusal (over the cap) as an error, and a fallback notice", async () => {
    vi.spyOn(api, "askFred").mockRejectedValueOnce(new ApiError(429, "That's your 10 questions for today (UTC)."));
    open();
    await userEvent.type(screen.getByLabelText("Your question"), "hi{Enter}");
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("10 questions");
  });

  test("Report this answer copies the exchange; New conversation clears it", async () => {
    scripted([{ event: "notice", data: { message: "Gemini is busy, so a smaller model answered." } },
      { event: "text", data: { delta: "Two buoys." } }, { event: "done", data: { provider: "workers-ai", used: 1, cap: 40 } }]);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    open();
    await userEvent.type(screen.getByLabelText("Your question"), "How many?{Enter}");
    expect(await screen.findByText(/smaller model/)).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Report this answer" }));
    expect(writeText.mock.calls[0][0]).toContain("Question: How many?");
    expect(screen.getByRole("button", { name: "Copied" })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(screen.queryByText("Two buoys.")).toBeNull();
  });

  test("Escape closes the panel", async () => {
    const onClose = open();
    await userEvent.type(screen.getByLabelText("Your question"), "{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("helpers", () => {
  const turn: FredTurn = { id: 1, question: "q1", answer: "a1", tools: ["Looked at Fleet"], notices: [], cards: [], done: true, provider: "gemini" };

  test("historyFor sends finished exchanges then the new question", () => {
    expect(historyFor([turn, { ...turn, id: 2, error: "x" }], "q2")).toEqual([
      { role: "user", text: "q1" }, { role: "assistant", text: "a1" }, { role: "user", text: "q2" }]);
  });

  test("contextFrom reads the page, tab and buoy", () => {
    expect(contextFrom("/settings/", "?tab=buoys&buoy=2")).toEqual({ page: "settings", tab: "buoys", buoy: 2 });
  });

  test("reportText names the model and tools", () => {
    expect(reportText(turn, new Date("2026-11-05T00:00:00Z"))).toMatch(/2026-11-05T00:00Z, gemini[\s\S]*Tools: Looked at Fleet/);
  });
});

describe("FredMarkdown", () => {
  test("renders lists, tables, console links and repo citations; refuses unsafe links", () => {
    const { container } = render(<FredMarkdown text={"- one\n- two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nSee [Fleet](/fleet/) and docs/hub/facts.md, not [x](javascript:alert(1))."} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("td")?.textContent).toBe("1");
    expect(screen.getByRole("link", { name: "Fleet" }).getAttribute("href")).toMatch(/^\/fleet\/?$/);
    expect(screen.getByRole("link", { name: "docs/hub/facts.md" }).getAttribute("href")).toContain("github.com/David-Chousal/S.C.O.U.T./blob/main/docs/hub/facts.md");
    expect(container.innerHTML).not.toContain("javascript:");
  });

  test("a stray pipe line does not hang", () => {
    const { container } = render(<FredMarkdown text={"| not a table"} />);
    expect(container.textContent).toBe("| not a table");
  });
});
