import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { api } from "@/lib/api/client";
import type { StorageReport } from "@/lib/api/types";
import { StoragePanel } from "./storage-panel";

const REPORT: StorageReport = {
  usage: { month: "2026-10", writes: 3, reads: 1, storedBytes: 1200, objects: 3 },
  budget: { writesPerMonth: 100000, readsPerMonth: 1000000, storedBytes: 2000000000, maxObjectBytes: 25000000 },
  lastBackup: { key: "backups/2026-10-31.sql.gz", bytes: 413 },
  bound: true,
};

afterEach(() => vi.restoreAllMocks());

describe("StoragePanel", () => {
  test("shows each use against the console's ceiling and the free tier", async () => {
    vi.spyOn(api, "storage").mockResolvedValue(REPORT);
    render(<StoragePanel />);
    const writes = await screen.findByRole("row", { name: /Writes this month/ });
    expect(writes.textContent).toContain("100,000");
    expect(writes.textContent).toContain("1,000,000");
    expect(screen.getByText(/backups\/2026-10-31.sql.gz/)).toBeDefined();
  });

  test("warns when no bucket is bound", async () => {
    vi.spyOn(api, "storage").mockResolvedValue({ ...REPORT, bound: false, lastBackup: null });
    render(<StoragePanel />);
    expect(await screen.findByText(/No R2 bucket is bound/)).toBeDefined();
  });
});
