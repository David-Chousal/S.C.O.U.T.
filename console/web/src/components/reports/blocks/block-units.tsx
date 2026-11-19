import type { BlockView } from "@/lib/report/views";
import { ChartsUnit, HeatUnit, KeyFiguresUnit } from "./figure-blocks";
import { TableUnit } from "./table-block";
import { ImageUnit, MarkerUnit, TextUnit, TitleUnit } from "./text-blocks";

/** How many pieces a block flows as: page breaks may fall between them. */
export function unitCount(view: BlockView): number {
  if ("sections" in view) return view.sections.length + ("footnote" in view && view.footnote ? 1 : 0);
  // A long Text block flows paragraph by paragraph, so a page break can fall between paragraphs.
  if (view.kind === "text") return Math.max(1, view.paragraphs.length);
  return 1;
}

interface BlockUnitProps { view: BlockView; unit: number; rows?: [number, number] }

/** One piece of a block on screen, or only rows [start, end) of a table that split across pages. */
export function BlockUnit({ view, unit, rows }: BlockUnitProps) {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
    case "buoyHealth":
    case "alerts":
      return <TableUnit view={view} unit={unit} rows={rows} />;
    case "title": return <TitleUnit view={view} />;
    case "text": return <TextUnit view={view} unit={unit} />;
    case "keyFigures": return <KeyFiguresUnit view={view} unit={unit} />;
    case "timeSeries": return <ChartsUnit view={view} unit={unit} />;
    case "heatStress": return <HeatUnit view={view} unit={unit} />;
    case "pageBreak":
    case "divider": return <MarkerUnit view={view} />;
    case "image": return <ImageUnit view={view} />;
  }
}
