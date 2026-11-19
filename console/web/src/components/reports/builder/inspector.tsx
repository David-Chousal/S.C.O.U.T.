"use client";

import type { ReactNode } from "react";
import { Key } from "@/components/ui/key";
import type { Buoy } from "@/lib/api/types";
import { BLOCK_INFO, type Block } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { RANGE_OPTIONS, type ReportVariables } from "@/lib/report/variables";
import { BlockOptionsForm } from "./block-options";
import { BuoyPick, RangePick } from "./report-toolbar";

interface InspectorProps {
  block: Block;
  report: ReportVariables;
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  columns: string[];
  dispatch: (action: ReportAction) => void;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className="sc-inspector__group" aria-label={title}><h3 className="sc-label">{title}</h3>{children}</section>;
}

interface InheritedProps { label: string; inherited: string; overridden: boolean; onOverride: () => void; onReset: () => void; children: ReactNode }

/** One variable: greyed "From report" with an Override key, or the block's own value with "Use report's". */
function Inherited({ label, inherited, overridden, onOverride, onReset, children }: InheritedProps) {
  return (
    <div className="sc-inspector__var">
      <div className="sc-inspector__var-head">
        <span>{label}</span>
        {overridden
          ? <button type="button" className="sc-link" onClick={onReset}>Use report&apos;s</button>
          : <button type="button" className="sc-link" onClick={onOverride}>Override</button>}
      </div>
      {overridden ? children : <p className="sc-inspector__inherited"><span className="sc-tag">From report</span> {inherited}</p>}
    </div>
  );
}

function DataGroup({ block, report, buoys, dispatch }: Omit<InspectorProps, "columns">) {
  const set = (override: Block["override"]) => dispatch({ type: "setOverride", id: block.id, override });
  const { buoys: ownBuoys, range: ownRange } = block.override;
  const names = (ids: number[]) => ids.map((id) => buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`).join(", ") || "None";
  const rangeName = RANGE_OPTIONS.find((o) => o.value === report.range.preset)?.label ?? "";
  return (
    <Group title="Data">
      <Inherited label="Buoys" inherited={names(report.buoys)} overridden={Boolean(ownBuoys)}
        onOverride={() => set({ ...block.override, buoys: report.buoys })} onReset={() => set({ ...block.override, buoys: undefined })}>
        <BuoyPick label="This block's buoys" buoys={buoys} picked={ownBuoys ?? []} onChange={(picked) => set({ ...block.override, buoys: picked })} />
      </Inherited>
      <Inherited label="Date range" inherited={report.range.preset === "custom" ? `${report.range.from} to ${report.range.to}` : rangeName}
        overridden={Boolean(ownRange)} onOverride={() => set({ ...block.override, range: report.range })} onReset={() => set({ ...block.override, range: undefined })}>
        <RangePick label="This block's range" range={ownRange ?? report.range} onChange={(range) => set({ ...block.override, range })} />
      </Inherited>
    </Group>
  );
}

/** The selected block's options: Data (variables it inherits or overrides) and Display. */
export function Inspector({ block, report, buoys, columns, dispatch }: InspectorProps) {
  const info = BLOCK_INFO[block.kind];
  return (
    <div className="sc-inspector">
      <header><h2 className="sc-bay__title">{info.label}</h2><p className="sc-help">{info.description}</p></header>
      {info.data && <DataGroup block={block} report={report} buoys={buoys} dispatch={dispatch} />}
      <Group title="Display"><BlockOptionsForm block={block} columns={columns} dispatch={dispatch} /></Group>
      <div className="sc-row sc-inspector__actions">
        <Key size="sm" icon="eye" aria-pressed={block.hidden} onClick={() => dispatch({ type: "toggleHidden", id: block.id })}>
          {block.hidden ? "Show in PDF" : "Hide in PDF"}
        </Key>
      </div>
    </div>
  );
}
