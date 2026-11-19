"use client";

import { Segmented } from "@/components/ui/segmented";
import { MAX_ROW_CAP, type Block, type Sampling } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { NumberDraft } from "./number-draft";
import { VariablesPanel } from "./variables-panel";

interface BlockOptionsFormProps { block: Block; columns: string[]; dispatch: (action: ReportAction) => void }

const SAMPLING: readonly { value: Sampling; label: string }[] = [{ value: "all", label: "All" }, { value: "hourly", label: "Hourly" }, { value: "daily", label: "Daily" }];

/** The Display options for each kind of block. */
export function BlockOptionsForm({ block, columns, dispatch }: BlockOptionsFormProps) {
  const update = (options: Partial<Block["options"]>) => dispatch({ type: "update", id: block.id, options });
  switch (block.kind) {
    case "summaryTable":
      return <VariablesPanel columns={columns} chosen={block.options.variables} onChange={(variables) => update({ variables })} />;
    case "readingsTable":
      return (
        <>
          <VariablesPanel columns={columns} chosen={block.options.variables} onChange={(variables) => update({ variables })} />
          <div className="sc-inspector__field"><span className="sc-label">Sampling</span>
            <Segmented size="sm" label="Sampling" options={SAMPLING} value={block.options.sampling} onChange={(sampling) => update({ sampling })} /></div>
          <label className="sc-inspector__field"><span className="sc-label">Rows per buoy, at most</span>
            <NumberDraft value={block.options.rowCap} min={10} max={MAX_ROW_CAP} onCommit={(rowCap) => update({ rowCap })} /></label>
        </>
      );
    default:
      return <p className="sc-help">This block has no display options.</p>;
  }
}
