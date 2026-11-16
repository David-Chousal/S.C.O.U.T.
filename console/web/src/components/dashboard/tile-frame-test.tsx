import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TileFrame } from "./tile-frame";

describe("TileFrame", () => {
  test("the corner grows a tile from the keyboard and Delete lets it fit its content again", async () => {
    const onSize = vi.fn();
    render(<TileFrame name="Battery" size={{ w: 400, h: 300 }} onSize={onSize}><p>tile</p></TileFrame>);
    screen.getByRole("button", { name: "Resize the Battery tile" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onSize).toHaveBeenLastCalledWith({ w: 420, h: 300 });
    await userEvent.keyboard("{ArrowDown}");
    expect(onSize).toHaveBeenLastCalledWith({ w: 400, h: 320 });
    await userEvent.keyboard("{Delete}");
    expect(onSize).toHaveBeenLastCalledWith(null);
  });
});
