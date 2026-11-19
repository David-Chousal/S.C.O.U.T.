// The five built-in templates (docs/engineering/console-report-builder-plan.md, "Templates").
// A template is layout and options only: applying one keeps the report's buoys, range and zone.

import { createBlock, createDocument, newBlockId, type Block, type ReportDocument } from "./document";
import type { ReportVariables } from "./variables";

export interface BuiltInTemplate { id: string; name: string; description: string; blocks: () => Block[] }

const text = (value: string, style: "body" | "heading" | "callout" = "body"): Block =>
  ({ ...createBlock("text"), options: { text: value, style } });

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: "weekly", name: "Weekly field summary", description: "Team meetings: figures, temperature and turbidity, buoy health, notes",
    blocks: () => [
      { ...createBlock("title"), options: { subtitle: "Weekly field summary" } },
      { ...createBlock("keyFigures"), options: { variables: ["temp_c", "turbidity_fau", "battery_v"], stat: "latest" } },
      { ...createBlock("timeSeries"), options: { variables: ["temp_c", "turbidity_fau"], perBuoy: false, thresholds: true } },
      createBlock("buoyHealth"),
      text("Notes"),
    ],
  },
  {
    id: "heat", name: "Reef heat stress brief", description: "Advisors and outreach: heat stress with the MMM line",
    blocks: () => [
      { ...createBlock("title"), options: { subtitle: "Reef heat stress brief" } },
      text("Water temperature at {buoys} from {from} to {to}, against each site's maximum monthly mean (MMM)."),
      createBlock("heatStress"),
      { ...createBlock("timeSeries"), options: { variables: ["temp_c"], perBuoy: false, thresholds: true } },
    ],
  },
  {
    id: "appendix", name: "Data appendix", description: "Thesis and EDD appendices: summary and every reading",
    blocks: () => [
      { ...createBlock("title"), options: { subtitle: "Data appendix" } },
      createBlock("summaryTable"),
      { ...createBlock("readingsTable"), options: { variables: ["temp_c", "turbidity_fau", "battery_v"], sampling: "all", rowCap: 2000 } },
    ],
  },
  {
    id: "status", name: "One-page status", description: "Quick share: figures and buoy health on one page",
    blocks: () => [
      { ...createBlock("title"), options: { subtitle: "Status" } },
      { ...createBlock("keyFigures"), options: { variables: ["temp_c", "battery_v"], stat: "latest" } },
      createBlock("buoyHealth"),
    ],
  },
  { id: "blank", name: "Blank", description: "A title, then whatever you add", blocks: () => [createBlock("title")] },
];

/** A copy of a layout's blocks with fresh ids, so two reports never share block ids. */
export const freshBlocks = (blocks: Block[]): Block[] => blocks.map((b) => ({ ...structuredClone(b), id: newBlockId() }));

/** A document from a template's layout, keeping the report's own variables. */
export function fromTemplate(layout: Pick<ReportDocument, "title" | "page" | "blocks">, variables: ReportVariables): ReportDocument {
  return { ...createDocument(variables, freshBlocks(layout.blocks), layout.title), page: layout.page };
}

export function builtInDocument(template: BuiltInTemplate, variables: ReportVariables): ReportDocument {
  return createDocument(variables, template.blocks(), template.name);
}
