"use client";

import type { ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";
import { MAX_ROW_CAP, type Block, type Sampling, type Stat, type TextStyle } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { FieldChips } from "./inline-edit";
import { NumberDraft } from "./number-draft";
import { VariablesPanel } from "./variables-panel";

interface BlockOptionsFormProps { block: Block; columns: string[]; dispatch: (action: ReportAction) => void }

const SAMPLING: readonly { value: Sampling; label: string }[] = [{ value: "all", label: "All" }, { value: "hourly", label: "Hourly" }, { value: "daily", label: "Daily" }];
const STATS: readonly { value: Stat; label: string }[] = [{ value: "latest", label: "Latest" }, { value: "min", label: "Lowest" }, { value: "mean", label: "Mean" }, { value: "max", label: "Highest" }];
const STYLES: readonly { value: TextStyle; label: string }[] = [{ value: "body", label: "Paragraph" }, { value: "heading", label: "Heading" }, { value: "subheading", label: "Subheading" }, { value: "callout", label: "Callout" }];
/** Columns that are not numbers cannot be charted or summed into a figure. */
const TEXT_COLUMNS = ["flags", "soh", "audio_file", "fw_version", "schema_version"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="sc-inspector__field"><span className="sc-label">{label}</span>{children}</div>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="sc-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}

/** The Display options for each kind of block. */
export function BlockOptionsForm({ block, columns, dispatch }: BlockOptionsFormProps) {
  const update = (options: Partial<Block["options"]>) => dispatch({ type: "update", id: block.id, options });
  const numeric = columns.filter((c) => !TEXT_COLUMNS.includes(c));
  switch (block.kind) {
    case "title":
      return (
        <Field label="Subtitle">
          <input className="sc-input" value={block.options.subtitle} maxLength={160} placeholder="e.g. Weekly summary for {buoys}" onChange={(e) => update({ subtitle: e.target.value })} />
          <FieldChips onPick={(field) => update({ subtitle: `${block.options.subtitle}${field}` })} />
        </Field>
      );
    case "text":
      return (
        <>
          <Field label="Style"><Segmented size="sm" label="Text style" options={STYLES} value={block.options.style} onChange={(style) => update({ style })} /></Field>
          <p className="sc-help">Type on the page. A blank line starts a new paragraph.</p>
        </>
      );
    case "keyFigures":
      return (
        <>
          <VariablesPanel columns={numeric} chosen={block.options.variables} onChange={(variables) => update({ variables })} />
          <Field label="Figure"><Segmented size="sm" label="Figure" options={STATS} value={block.options.stat} onChange={(stat) => update({ stat })} /></Field>
        </>
      );
    case "timeSeries":
      return (
        <>
          <VariablesPanel columns={numeric} chosen={block.options.variables} onChange={(variables) => update({ variables })} />
          <Check label="One chart per buoy" checked={block.options.perBuoy} onChange={(perBuoy) => update({ perBuoy })} />
          <Check label="Show the MMM on water temperature" checked={block.options.thresholds} onChange={(thresholds) => update({ thresholds })} />
        </>
      );
    case "summaryTable":
      return <VariablesPanel columns={columns} chosen={block.options.variables} onChange={(variables) => update({ variables })} />;
    case "readingsTable":
      return (
        <>
          <VariablesPanel columns={columns} chosen={block.options.variables} onChange={(variables) => update({ variables })} />
          <Field label="Sampling"><Segmented size="sm" label="Sampling" options={SAMPLING} value={block.options.sampling} onChange={(sampling) => update({ sampling })} /></Field>
          <label className="sc-inspector__field"><span className="sc-label">Rows per buoy, at most</span>
            <NumberDraft value={block.options.rowCap} min={10} max={MAX_ROW_CAP} onCommit={(rowCap) => update({ rowCap })} /></label>
        </>
      );
    case "heatStress":
      return <Check label="Degree heating weeks chart" checked={block.options.charts} onChange={(charts) => update({ charts })} />;
    case "alerts":
      return <Check label="Include test emails" checked={block.options.includeTests} onChange={(includeTests) => update({ includeTests })} />;
    default:
      return <p className="sc-help">This block has no display options.</p>;
  }
}
