import { expect, test } from "vitest";
import { createBlock } from "../document";
import { ALERTS, FLEET, HEAT } from "./fixtures";
import { imageView } from "./text";
import type { ViewContext } from "./types";

const ctx = (contentWidth: number, contentHeight: number): ViewContext => ({
  report: { buoys: [1], range: { preset: "7d", from: "", to: "" }, zone: "utc" }, now: 0, title: "T", contentWidth, contentHeight,
  fleet: FLEET, heat: HEAT, alerts: ALERTS, buoyLabel: (id) => `Buoy ${id}`, readings: () => ({ status: "loading" }),
});

test("a full-width square image on a landscape page is fitted to the page's height, keeping its shape", () => {
  const block = { ...createBlock("image"), options: { assetId: "a", alt: "", caption: "Reef", width: "full" as const, ratio: 1 } };
  const view = imageView(block, ctx(960, 696));
  expect(view.height).toBeLessThanOrEqual(696 - 24);
  expect(view.width).toBe(view.height);
});

test("an image that fits keeps its chosen width", () => {
  const block = { ...createBlock("image"), options: { assetId: "a", alt: "", caption: "", width: "medium" as const, ratio: 0.5 } };
  expect(imageView(block, ctx(720, 936)).width).toBe(432);
});
