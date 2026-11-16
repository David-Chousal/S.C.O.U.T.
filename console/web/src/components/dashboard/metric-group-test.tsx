import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricGroup } from "./metric-group";

const tiles = ["temp_c", "turbidity_v", "turbidity_adc"].map((key) => ({ key, name: key, node: <p>{key}</p> }));

describe("MetricGroup", () => {
  test("tiles follow the saved order, and a grip's arrow keys move a tile only within the section", async () => {
    const onOrder = vi.fn();
    render(<MetricGroup name="Water" tiles={tiles} saved={["turbidity_v"]} sizes={{}} columns={3} onOrder={onOrder} onSize={() => vi.fn()} />);
    expect(screen.getAllByRole("paragraph").map((p) => p.textContent)).toEqual(["turbidity_v", "temp_c", "turbidity_adc"]);
    screen.getByRole("button", { name: "Move the temp_c tile" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onOrder).toHaveBeenLastCalledWith(["turbidity_v", "turbidity_adc", "temp_c"]);
    screen.getByRole("button", { name: "Move the turbidity_adc tile" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onOrder).toHaveBeenLastCalledWith(["turbidity_v", "temp_c", "turbidity_adc"]);
  });
});
