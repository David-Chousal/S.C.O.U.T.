import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { GuestSignIn } from "./guest-sign-in";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

afterEach(() => {
  vi.restoreAllMocks();
  replace.mockReset();
});

describe("GuestSignIn", () => {
  test("starts as one button and asks only for a name and an email", async () => {
    render(<GuestSignIn />);
    expect(screen.queryByLabelText("Name")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Sign in as guest" }));
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  test("signs in as a guest and opens the Fleet page", async () => {
    const guest = vi.spyOn(api, "guestSignIn").mockResolvedValue({ ok: true });
    render(<GuestSignIn />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in as guest" }));
    await userEvent.type(screen.getByLabelText("Name"), "Shoba");
    await userEvent.type(screen.getByLabelText("Email"), "shoba@scu.test");
    await userEvent.click(screen.getByRole("button", { name: /Continue as guest/ }));
    expect(guest).toHaveBeenCalledWith("Shoba", "shoba@scu.test");
    expect(replace).toHaveBeenCalledWith("/fleet/");
  });

  test("shows the server's reason when it refuses", async () => {
    vi.spyOn(api, "guestSignIn").mockRejectedValue(new Error("This email already has an account. Sign in with it instead."));
    render(<GuestSignIn />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in as guest" }));
    await userEvent.type(screen.getByLabelText("Name"), "X");
    await userEvent.type(screen.getByLabelText("Email"), "member@scout.test");
    await userEvent.click(screen.getByRole("button", { name: /Continue as guest/ }));
    expect(await screen.findByText(/already has an account/)).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });
});
