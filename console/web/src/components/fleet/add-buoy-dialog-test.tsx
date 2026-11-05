import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { AddBuoyDialog } from "./add-buoy-dialog";

function renderDialog(onAdded = vi.fn()) {
  render(<AddBuoyDialog open onClose={vi.fn()} onAdded={onAdded} />);
  return onAdded;
}

afterEach(() => vi.restoreAllMocks());

describe("AddBuoyDialog", () => {
  test("adding a buoy shows a success card and reloads the fleet", async () => {
    const add = vi.spyOn(api, "addBuoy").mockResolvedValue({ ok: true });
    const onAdded = renderDialog();
    await userEvent.type(screen.getByLabelText("Buoy ID"), "4");
    await userEvent.click(screen.getByRole("button", { name: "Add buoy" }));
    expect(add).toHaveBeenCalledWith(4, "");
    expect(await screen.findByText("SCOUT-04 added.")).toBeDefined();
    expect(onAdded).toHaveBeenCalled();
  });

  test("a refusal shows an error card and keeps the form to correct it", async () => {
    vi.spyOn(api, "addBuoy").mockRejectedValue(new Error("Buoy 1 is already listed."));
    const onAdded = renderDialog();
    await userEvent.type(screen.getByLabelText("Buoy ID"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Add buoy" }));
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/already listed/)).toBeDefined();
    expect(screen.getByLabelText("Buoy ID")).toBeDefined();
    expect(onAdded).not.toHaveBeenCalled();
  });
});
