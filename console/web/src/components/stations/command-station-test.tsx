import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Device } from "@/lib/api/types";
import { CommandStation } from "./command-station";

const device = (id: string, name: string): Device => ({ id, name, created_at: 0, revoked_at: null, last_seen_at: null });
const buoy = { buoy_id: 1, label: "Reef north", command_device_id: null as string | null, tx_count_requested: 2 };

function renderPicker(props: Partial<Parameters<typeof CommandStation>[0]> = {}) {
  const onChanged = vi.fn();
  render(<Toaster><CommandStation buoy={buoy} stations={[device("d1", "Kaneohe shore"), device("d2", "Campus bench")]}
    canPick onChanged={onChanged} {...props} /></Toaster>);
  return onChanged;
}

afterEach(() => vi.restoreAllMocks());

describe("CommandStation", () => {
  test("a lone station needs no choice and says it sends", () => {
    renderPicker({ stations: [device("d1", "Kaneohe shore")] });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText(/Commands go through Kaneohe shore/)).toBeDefined();
  });

  test("with two stations and none picked it warns that nobody sends the request", () => {
    renderPicker();
    expect(screen.getByRole("combobox", { name: /Command station for Reef north/ })).toBeDefined();
    expect(screen.getByText(/No station sends/)).toBeDefined();
  });

  test("an admin picks a station", async () => {
    const pick = vi.spyOn(api, "setCommandStation").mockResolvedValue({ ok: true });
    const onChanged = renderPicker();
    await userEvent.selectOptions(screen.getByRole("combobox"), "d2");
    expect(pick).toHaveBeenCalledWith(1, "d2");
    expect(onChanged).toHaveBeenCalled();
  });

  test("anyone else sees the choice but cannot change it", () => {
    renderPicker({ canPick: false, buoy: { ...buoy, command_device_id: "d1" } });
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
  });
});
