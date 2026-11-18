import type { BlockView } from "@/lib/report/views";
import { TableUnit, tableUnits } from "./table-block";

/** How many pieces a block flows as: page breaks may fall between them. */
export function unitCount(view: BlockView): number {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
      return tableUnits(view);
  }
}

interface BlockUnitProps { view: BlockView; unit: number; rows?: [number, number] }

/** One piece of a block on screen, or only rows [start, end) of a table that split across pages. */
export function BlockUnit({ view, unit, rows }: BlockUnitProps) {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
      return <TableUnit view={view} unit={unit} rows={rows} />;
  }
}
