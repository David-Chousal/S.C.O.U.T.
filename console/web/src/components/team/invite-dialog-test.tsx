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
    const create = vi.spyOn(api, "createInvite").mockResolvedValue({ link: "https://console.test/invite/?token=abc" });
    const onInvited = renderDialog();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@scout.test");
    await userEvent.click(screen.getByRole("radio", { name: /Guest/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create invite link" }));
    expect(create).toHaveBeenCalledWith("new@scout.test", "guest");
    expect(screen.getByText("https://console.test/invite/?token=abc")).toBeDefined();
    expect(onInvited).toHaveBeenCalled();
    create.mockRestore();
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
