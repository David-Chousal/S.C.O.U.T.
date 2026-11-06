import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { DeleteBuoyDialog, DisconnectDialog } from "./buoy-dialogs";

const BUOY = { buoy_id: 3, label: "Lagoon test" } as Buoy;

afterEach(() => vi.restoreAllMocks());

describe("DisconnectDialog", () => {
  test("asks first, then says how to reconnect, with a link to Help", async () => {
    const disconnect = vi.spyOn(api, "disconnectBuoy").mockResolvedValue({ ok: true });
    const onDone = vi.fn();
    render(<DisconnectDialog buoy={BUOY} onClose={vi.fn()} onDone={onDone} />);
    expect(screen.getByRole("dialog", { name: "Disconnect Lagoon test?" })).toBeDefined();
    expect(disconnect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(disconnect).toHaveBeenCalledWith(3);
    expect(onDone).toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Lagoon test is disconnected" }).textContent).toContain("enter ID 3");
    expect(screen.getByRole("link", { name: "How to add a buoy" }).getAttribute("href")).toMatch(/^\/help\/?#buoy$/);
  });

  test("Cancel changes nothing", async () => {
    const disconnect = vi.spyOn(api, "disconnectBuoy").mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    render(<DisconnectDialog buoy={BUOY} onClose={onClose} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(disconnect).not.toHaveBeenCalled();
  });
});

describe("DeleteBuoyDialog", () => {
  test("says what goes with it, and deletes on confirm", async () => {
    const remove = vi.spyOn(api, "deleteBuoy").mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    render(<DeleteBuoyDialog buoy={BUOY} onClose={onClose} onDone={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Delete Lagoon test?" }).textContent).toContain("all its readings");
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalled();
  });
});
