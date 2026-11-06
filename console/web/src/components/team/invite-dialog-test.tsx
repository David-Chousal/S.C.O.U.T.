import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { InviteDialog } from "./invite-dialog";

function renderDialog(onInvited = vi.fn()) {
  render(<Toaster><InviteDialog open onClose={vi.fn()} onInvited={onInvited} /></Toaster>);
  return onInvited;
}

describe("InviteDialog", () => {
  test("creates the invite with the chosen role and shows the link once", async () => {
    const create = vi.spyOn(api, "createInvite").mockResolvedValue({ link: "https://console.test/invite/?token=abc", email: "new@scout.test", delivery: "sent" });
    const onInvited = renderDialog();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@scout.test");
    await userEvent.click(screen.getByRole("radio", { name: /Guest/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create invite link" }));
    expect(create).toHaveBeenCalledWith("new@scout.test", "guest");
    expect(screen.getByText("https://console.test/invite/?token=abc")).toBeDefined();
    expect(onInvited).toHaveBeenCalled();
    create.mockRestore();
  });

  test("says the email went out when it did", async () => {
    const create = vi.spyOn(api, "createInvite").mockResolvedValue({ link: "https://console.test/invite/?token=abc", email: "new@scout.test", delivery: "sent" });
    renderDialog();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@scout.test");
    await userEvent.click(screen.getByRole("button", { name: "Create invite link" }));
    expect(screen.getByText(/^Email sent to new@scout.test/)).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Invite sent" })).toBeDefined();
    create.mockRestore();
  });

  test.each([
    ["failed", "the email service refused it"],
    ["not_configured", "email isn't set up"],
    ["rate_limited", "today's email limit is reached"],
  ] as const)("falls back to the link when delivery is %s", async (delivery, why) => {
    const create = vi.spyOn(api, "createInvite").mockResolvedValue({ link: "https://console.test/invite/?token=abc", email: "new@scout.test", delivery });
    renderDialog();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@scout.test");
    await userEvent.click(screen.getByRole("button", { name: "Create invite link" }));
    const note = screen.getByText(/^Couldn't email/).textContent ?? "";
    expect(note).toContain("Couldn't email new@scout.test");
    expect(note).toContain(why);
    expect(note).toContain("copy the link instead");
    expect(screen.getByText("https://console.test/invite/?token=abc")).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Send this link" })).toBeDefined();
    create.mockRestore();
  });

  test("each role shows just its name; its description is a hover tip linked to the choice", () => {
    renderDialog();
    for (const [role, words] of [["Guest", "changes nothing"], ["Member", "buoy settings"], ["Admin", "invites people"]]) {
      const radio = screen.getByRole("radio", { name: new RegExp(role) });
      const tip = document.getElementById(radio.getAttribute("aria-describedby") ?? "");
      expect(tip?.classList.contains("sc-tip--hover")).toBe(true);
      expect(tip?.textContent).toContain(words);
      expect(radio.closest("label")?.querySelector("strong")?.textContent).toBe(role);
    }
  });

  test("says why the console refused it", async () => {
    const create = vi.spyOn(api, "createInvite").mockRejectedValue(new ApiError(400, "new@scout.test already has an account."));
    renderDialog();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@scout.test");
    await userEvent.click(screen.getByRole("button", { name: "Create invite link" }));
    expect(screen.getByRole("alert").textContent).toContain("already has an account");
    create.mockRestore();
  });
});
