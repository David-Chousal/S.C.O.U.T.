import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sparkline } from "./sparkline";

const T0 = Date.UTC(2026, 10, 10);
const HOUR = 3600 * 1000;
const POINTS = [{ t: T0, v: 26.1 }, { t: T0 + 8 * HOUR, v: 26.4 }, { t: T0 + 16 * HOUR, v: 26.9 }];

describe("Sparkline", () => {
  test("its readings can be read from the keyboard", () => {
    render(<Sparkline points={POINTS} from={T0} to={T0 + 24 * HOUR} color="red" unit="°C" digits={1} label="Water temperature"
      domain={[26, 27]} form="line" phrase="last 7 days" />);
    const chart = screen.getByRole("img", { name: /Water temperature, last 7 days/ });
    fireEvent.focus(chart);
    expect(screen.getByRole("status").textContent).toContain("26.9 °C");
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toContain("26.4 °C · 11-10 08:00 UTC");
    fireEvent.keyDown(chart, { key: "Home" });
    expect(screen.getByRole("status").textContent).toContain("26.1 °C");
    fireEvent.blur(chart);
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("a selection past the end of a shorter new series is dropped instead of crashing", () => {
    const long = Array.from({ length: 20 }, (_, i) => ({ t: T0 + i * HOUR, v: 26 + i / 10 }));
    const props = { from: T0, to: T0 + 24 * HOUR, color: "red", unit: "°C", digits: 1, label: "Water temperature", domain: [26, 28] as [number, number], form: "line" as const, phrase: "last 7 days" };
    const { rerender } = render(<Sparkline points={long} {...props} />);
    fireEvent.focus(screen.getByRole("img"));
    rerender(<Sparkline points={POINTS} {...props} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
