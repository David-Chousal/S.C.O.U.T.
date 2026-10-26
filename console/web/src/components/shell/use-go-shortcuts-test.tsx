import { describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGoShortcuts } from "./use-go-shortcuts";

function Harness({ navigate }: { navigate: (href: string) => void }) {
  useGoShortcuts(navigate);
  return <input aria-label="Search" />;
}

describe("useGoShortcuts", () => {
  test("navigates on G then a destination letter", async () => {
    const navigate = vi.fn();
    render(<Harness navigate={navigate} />);
    await userEvent.keyboard("gs");
    expect(navigate).toHaveBeenCalledWith("/stations/");
  });

  test("ignores keys typed into a field", async () => {
    const navigate = vi.fn();
    const { getByLabelText } = render(<Harness navigate={navigate} />);
    await userEvent.type(getByLabelText("Search"), "gs");
    expect(navigate).not.toHaveBeenCalled();
  });

  test("ignores a letter without the G prefix", async () => {
    const navigate = vi.fn();
    render(<Harness navigate={navigate} />);
    await userEvent.keyboard("c");
    expect(navigate).not.toHaveBeenCalled();
  });
});
