"use client";

import { useState } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Segmented } from "@/components/ui/segmented";
import { api } from "@/lib/api/client";
import type { BlockOfKind, ImageWidth } from "@/lib/report/document";

const MAX_BYTES = 1_000_000;
const WIDTHS: readonly { value: ImageWidth; label: string }[] = [{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "full", label: "Full width" }];

/** Height ÷ width of the picture, so the page can lay it out before it loads. */
async function shapeOf(file: File): Promise<number> {
  const bitmap = await createImageBitmap(file);
  const ratio = bitmap.height / bitmap.width;
  bitmap.close();
  return Math.min(4, Math.max(0.1, Math.round(ratio * 1000) / 1000));
}

interface ImageOptionsProps { block: BlockOfKind<"image">; update: (options: Partial<BlockOfKind<"image">["options"]>) => void }

/** Upload a PNG or JPEG (at most 1 MB, kept in the console's file storage), then size and describe it. */
export function ImageOptions({ block, update }: ImageOptionsProps) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  async function choose(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return show({ tone: "failed", title: "Not uploaded", detail: "Only PNG and JPEG images can go in a report." });
    if (file.size > MAX_BYTES) return show({ tone: "failed", title: "Not uploaded", detail: "Images are at most 1 MB. Make it smaller and try again." });
    setBusy(true);
    try {
      const [ratio, { id }] = await Promise.all([shapeOf(file), api.uploadReportImage(file)]);
      update({ assetId: id, ratio, alt: block.options.alt || file.name.replace(/\.[^.]+$/, "") });
      show({ tone: "ok", title: "Image added" });
    } catch (failure) {
      show({ tone: "failed", title: "Not uploaded", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <label className="sc-inspector__field"><span className="sc-label">{block.options.assetId ? "Replace the image" : "Image (PNG or JPEG, up to 1 MB)"}</span>
        <input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} /></label>
      {busy && <span className="sc-tag" role="status">Uploading…</span>}
      <div className="sc-inspector__field"><span className="sc-label">Width</span>
        <Segmented size="sm" label="Image width" options={WIDTHS} value={block.options.width} onChange={(width) => update({ width })} /></div>
      <label className="sc-inspector__field"><span className="sc-label">Description, for screen readers</span>
        <input className="sc-input" value={block.options.alt} maxLength={200} onChange={(e) => update({ alt: e.target.value })} /></label>
      <label className="sc-inspector__field"><span className="sc-label">Caption</span>
        <input className="sc-input" value={block.options.caption} maxLength={200} onChange={(e) => update({ caption: e.target.value })} /></label>
    </>
  );
}
