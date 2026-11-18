import type { BlockView } from "@/lib/report/views";
import { PdfTableUnit } from "./pdf-tables";

interface PdfBlockUnitProps { view: BlockView; unit: number; rows?: [number, number] }

/** One piece of a block in the PDF: the twin of the screen's BlockUnit, drawn from the same view. */
export function PdfBlockUnit({ view, unit, rows }: PdfBlockUnitProps) {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
      return <PdfTableUnit view={view} unit={unit} rows={rows} />;
  }
}
