import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./select";

const OPTIONS = [{ value: "guest", label: "Guest" }, { value: "member", label: "Member" }, { value: "admin", label: "Admin" }];

function setup(value = "member") {
  const onChange = vi.fn();
  render(<><label htmlFor="role">Role</label><Select id="role" value={value} options={OPTIONS} onChange={onChange} /></>);
  return { onChange, trigger: screen.getByLabelText("Role") };
}

describe("Select", () => {
  test("shows the current choice and opens a list with it checked, rendered outside any clipping box", async () => {
    const { trigger } = setup();
    expect(trigger.textContent).toBe("Member");
    await userEvent.click(trigger);
    const list = screen.getByRole("listbox");
    expect(list.parentElement).toBe(document.body);
    expect(screen.getByRole("option", { name: "Member" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Member");
  });

  test("clicking an option picks it and closes the list", async () => {
    const { onChange, trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Admin" }));
    expect(onChange).toHaveBeenCalledWith("admin");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("works from the keyboard: arrows, Enter, Escape and a typed letter", async () => {
    const { onChange, trigger } = setup();
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("admin");
    await userEvent.keyboard("{ArrowDown}g{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("guest");
    await userEvent.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test("picking the current value changes nothing; a click outside closes it", async () => {
    const { onChange, trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Member" }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  test("a disabled select does not open", async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Role" value="guest" options={OPTIONS} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole("button", { name: "Role" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
