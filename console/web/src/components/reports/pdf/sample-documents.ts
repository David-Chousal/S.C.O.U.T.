// Documents the screen-versus-PDF text test renders both ways. Step 8 adds the built-in
// templates, so every template is checked too.
import { createBlock, createDocument, type ReportDocument } from "@/lib/report/document";

const VARIABLES = { buoys: [1, 2, 3, 4], range: { preset: "7d" as const, from: "", to: "" }, zone: "utc" as const };

export const SAMPLE_DOCUMENTS: ReportDocument[] = [
  createDocument(VARIABLES, [createBlock("title", "t"), createBlock("summaryTable", "s"), createBlock("readingsTable", "r")], "Default report"),
  createDocument(VARIABLES, [
    { ...createBlock("readingsTable", "h"), options: { variables: ["temp_c", "ndsi_e4"], sampling: "hourly", rowCap: 20 } },
    { ...createBlock("summaryTable", "o"), override: { buoys: [2] }, options: { variables: ["ndsi_e4"] } },
  ], "Sampled and overridden"),
  createDocument(VARIABLES, [
    { ...createBlock("title", "t"), options: { subtitle: "For {buoys}, {period}" } },
    { ...createBlock("text", "x"), options: { text: "Week of {from}.\n\nAll buoys reported.", style: "callout" } },
    { ...createBlock("text", "y"), options: { text: "Heading", style: "heading" } },
    createBlock("keyFigures", "k"),
    { ...createBlock("keyFigures", "k2"), options: { variables: ["temp_c"], stat: "max" } },
    createBlock("timeSeries", "c"),
    { ...createBlock("timeSeries", "c2"), options: { variables: ["temp_c", "battery_v"], perBuoy: true, thresholds: true } },
    createBlock("heatStress", "h"),
    createBlock("buoyHealth", "b"),
    { ...createBlock("alerts", "a"), options: { includeTests: true } },
    createBlock("divider", "d"),
    createBlock("pageBreak", "p"),
  ], "Every block"),
];
