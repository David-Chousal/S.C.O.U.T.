import { describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { announceDataChanged } from "./data-changed";
import { useApi } from "./use-api";

function Shows({ read }: { read: () => Promise<string> }) {
  const { data } = useApi(read);
  return <p>{data ?? "loading"}</p>;
}

describe("useApi", () => {
  test("reloads when a change is announced elsewhere on the page", async () => {
    const read = vi.fn().mockResolvedValueOnce("2 a day").mockResolvedValueOnce("1 a day");
    render(<Shows read={read} />);
    expect(await screen.findByText("2 a day")).toBeDefined();
    await act(async () => announceDataChanged());
    expect(await screen.findByText("1 a day")).toBeDefined();
    expect(read).toHaveBeenCalledTimes(2);
  });
});
