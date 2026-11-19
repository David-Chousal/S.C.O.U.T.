import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function addImageBlock() {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c"]} canDownload canEdit
    now={Date.parse("2026-10-31T12:00:00Z")} onCreated={vi.fn()} recent={null} /></Toaster>);
  await userEvent.click(screen.getByRole("tab", { name: "Blocks" }));
  await userEvent.click(screen.getByRole("button", { name: "Add Image" }));
}
const paper = () => within(screen.getByLabelText("Report preview"));

describe("Image block", () => {
  test("before an upload it says how to add one, on the page", async () => {
    await addImageBlock();
    expect(paper().getByText(/No image yet/)).toBeDefined();
  });

  test("uploading a PNG shows it on the page at the picture's shape, described by the file name", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 400, height: 200, close: () => undefined })));
    const upload = vi.spyOn(api, "uploadReportImage").mockResolvedValue({ id: "img1" });
    await addImageBlock();
    await userEvent.upload(screen.getByLabelText(/Image \(PNG or JPEG/), new File([new Uint8Array([137, 80, 78, 71])], "reef-logo.png", { type: "image/png" }));
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    const img = await paper().findByRole("img", { name: "reef-logo" });
    expect(img.getAttribute("src")).toBe("/api/report-images/img1");
    expect(Number(img.getAttribute("height"))).toBe(Math.round(Number(img.getAttribute("width")) / 2));
  });

  test("a file over 1 MB is refused before it is sent", async () => {
    const upload = vi.spyOn(api, "uploadReportImage");
    await addImageBlock();
    await userEvent.upload(screen.getByLabelText(/Image \(PNG or JPEG/), new File([new Uint8Array(1_000_001)], "big.png", { type: "image/png" }));
    expect(await screen.findByText(/at most 1 MB/)).toBeDefined();
    expect(upload).not.toHaveBeenCalled();
  });
});
