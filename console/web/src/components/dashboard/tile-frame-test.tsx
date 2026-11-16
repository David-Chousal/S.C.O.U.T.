import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TileFrame } from "./tile-frame";

describe("TileFrame", () => {
  test("the corner widens a tile by whole columns and adds height from the keyboard and Delete lets it fit its content again", async () => {
    const onSize = vi.fn();
    render(<TileFrame tileKey="battery_v" name="Battery" size={{ h: 300 }} columns={3} onSize={onSize} moving={false} onMoveStart={vi.fn()} onMoveKey={vi.fn()}><p>tile</p></TileFrame>);
    screen.getByRole("button", { name: /^Resize the Battery tile/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onSize).toHaveBeenLastCalledWith({ span: 2, h: 300 });
    await userEvent.keyboard("{ArrowDown}");
    expect(onSize).toHaveBeenLastCalledWith({ span: 1, h: 320 });
    await userEvent.keyboard("{Delete}");
    expect(onSize).toHaveBeenLastCalledWith(null);
  });
});
