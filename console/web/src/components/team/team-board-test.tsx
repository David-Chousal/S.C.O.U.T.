import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Member, Role, Session, Team } from "@/lib/api/types";
import { SessionContext } from "@/lib/session";
import { TeamBoard } from "./team-board";

const member = (id: string, name: string, extra: Partial<Member> = {}): Member => ({
  id, email: `${id}@scout.test`, name, role: "member", disabled: 0, created_at: 0, has_password: 1, has_github: 0, has_google: 0, self_signup: 0, ...extra,
});

const TEAM: Team = {
  members: [
    member("me", "Ada", { role: "admin" }),
    member("john", "John"),
    member("visitor", "Vic", { role: "guest", self_signup: 1 }),
  ],
  invites: [],
};

function renderBoard(role: Role = "admin") {
  vi.spyOn(api, "team").mockResolvedValue(TEAM);
  const session: Session = { csrf: "t", user: { id: "me", email: "me@scout.test", name: "Ada", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  render(<SessionContext value={session}><Toaster><TeamBoard /></Toaster></SessionContext>);
}

const menuFor = (name: string) => screen.findByRole("button", { name: `Actions for ${name}` });
const itemsIn = () => screen.getAllByRole("menuitem").map((item) => item.textContent);

afterEach(() => vi.restoreAllMocks());

describe("TeamBoard actions menu", () => {
  test("each row has one ⋯ menu instead of buttons: Reset link and Remove", async () => {
    renderBoard();
    await userEvent.click(await menuFor("John"));
    expect(itemsIn()).toEqual(["Reset link", "Remove"]);
    expect(screen.queryByRole("button", { name: /Hold to disable/ })).toBeNull();
  });

  test("Remove asks first, then removes the person's access", async () => {
    const setDisabled = vi.spyOn(api, "setDisabled").mockResolvedValue({ ok: true });
    renderBoard();
    await userEvent.click(await menuFor("John"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(screen.getByRole("dialog", { name: "Remove John?" })).toBeDefined();
    expect(setDisabled).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(setDisabled).toHaveBeenCalledWith("john", true);
  });

  test("Cancel leaves them on the team", async () => {
    const setDisabled = vi.spyOn(api, "setDisabled").mockResolvedValue({ ok: true });
    renderBoard();
    await userEvent.click(await menuFor("John"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(setDisabled).not.toHaveBeenCalled();
  });

  test("Reset link shows the link to send", async () => {
    vi.spyOn(api, "resetLink").mockResolvedValue({ link: "https://console.test/reset/?token=abc", email: "john@scout.test", delivery: "sent" });
    renderBoard();
    await userEvent.click(await menuFor("John"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Reset link" }));
    expect(await screen.findByText("https://console.test/reset/?token=abc")).toBeDefined();
    expect(screen.getByText(/Email sent to john@scout.test/)).toBeDefined();
  });

  test("a reset link that couldn't be emailed says to copy it instead", async () => {
    vi.spyOn(api, "resetLink").mockResolvedValue({ link: "https://console.test/reset/?token=abc", email: "john@scout.test", delivery: "failed" });
    renderBoard();
    await userEvent.click(await menuFor("John"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Reset link" }));
    expect(await screen.findByText(/Couldn't email john@scout.test .*copy the link instead/)).toBeDefined();
  });

  test("you cannot remove yourself; a self-signed-up guest gets no reset link", async () => {
    renderBoard();
    await userEvent.click(await menuFor("Ada"));
    expect(itemsIn()).toEqual(["Reset link"]);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(await menuFor("Vic"));
    expect(itemsIn()).toEqual(["Remove"]);
  });

  test("a member sees the menus switched off", async () => {
    renderBoard("member");
    expect(((await menuFor("John")) as HTMLButtonElement).disabled).toBe(true);
  });
});
