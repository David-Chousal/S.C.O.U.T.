import type { BlockView } from "@/lib/report/views";
import { PdfCharts, PdfHeat, PdfKeyFigures } from "./pdf-figures";
import { PdfTableUnit } from "./pdf-tables";
import { PdfMarker, PdfTextBlock, PdfTitle } from "./pdf-text";

interface PdfBlockUnitProps { view: BlockView; unit: number; rows?: [number, number] }

/** One piece of a block in the PDF: the twin of the screen's BlockUnit, drawn from the same view. */
export function PdfBlockUnit({ view, unit, rows }: PdfBlockUnitProps) {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
    case "buoyHealth":
    case "alerts":
      return <PdfTableUnit view={view} unit={unit} rows={rows} />;
    case "title": return <PdfTitle view={view} />;
    case "text": return <PdfTextBlock view={view} />;
    case "keyFigures": return <PdfKeyFigures view={view} unit={unit} />;
    case "timeSeries": return <PdfCharts view={view} unit={unit} />;
    case "heatStress": return <PdfHeat view={view} unit={unit} />;
    case "pageBreak":
    case "divider": return <PdfMarker view={view} />;
  }
}
