// Documents the screen-versus-PDF text test renders both ways. Step 8 replaces these with the
// built-in templates, so every template is checked.
import { createBlock, createDocument, type ReportDocument } from "@/lib/report/document";

const VARIABLES = { buoys: [1, 2, 3, 4], range: { preset: "7d" as const, from: "", to: "" }, zone: "utc" as const };

export const SAMPLE_DOCUMENTS: ReportDocument[] = [
  createDocument(VARIABLES, [createBlock("summaryTable", "s"), createBlock("readingsTable", "r")], "Default report"),
  createDocument(VARIABLES, [
    { ...createBlock("readingsTable", "h"), options: { variables: ["temp_c", "ndsi_e4"], sampling: "hourly", rowCap: 20 } },
    { ...createBlock("summaryTable", "o"), override: { buoys: [2] }, options: { variables: ["ndsi_e4"] } },
  ], "Sampled and overridden"),
];
