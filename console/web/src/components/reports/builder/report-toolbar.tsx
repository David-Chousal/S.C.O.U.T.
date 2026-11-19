"use client";

import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import type { Buoy } from "@/lib/api/types";
import type { PageSetup } from "@/lib/report/page";
import { isValidCustom, RANGE_OPTIONS, type ReportRange, type ReportVariables } from "@/lib/report/variables";

const ZONES = [{ value: "utc", label: "UTC" }, { value: "local", label: "Local" }] as const;
const PAGES = [
  { value: "letter-portrait", label: "Letter, portrait" }, { value: "letter-landscape", label: "Letter, landscape" },
  { value: "a4-portrait", label: "A4, portrait" }, { value: "a4-landscape", label: "A4, landscape" },
] as const;
type PageValue = (typeof PAGES)[number]["value"];

const toggled = <T,>(list: readonly T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

interface BuoyPickProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  picked: readonly number[];
  onChange: (buoys: number[]) => void;
  label?: string;
}

/** Buoys as joined keys that latch independently: any number can be on. */
export function BuoyPick({ buoys, picked, onChange, label = "Buoys" }: BuoyPickProps) {
  return (
    <div className="sc-seg sc-seg--sm" role="group" aria-label={label}>
      {buoys.map((b) => (
        <button key={b.buoy_id} type="button" aria-pressed={picked.includes(b.buoy_id)}
          onClick={() => onChange(buoys.map((x) => x.buoy_id).filter((id) => toggled(picked, b.buoy_id).includes(id)))}>
          {b.label}
        </button>
      ))}
    </div>
  );
}

interface RangePickProps { range: ReportRange; onChange: (range: ReportRange) => void; label?: string }

/** 24 h, 7 d, 30 d or a custom span of whole days. */
export function RangePick({ range, onChange, label = "Date range" }: RangePickProps) {
  const [problem, setProblem] = useState("");
  // A cleared or half-typed date input reports "", and a day past the other end would reverse
  // the range: keep the last good range, and say why the edit did not take.
  const setDay = (key: "from" | "to", value: string) => {
    const next = { ...range, [key]: value };
    if (value && isValidCustom(next)) {
      setProblem("");
      onChange(next);
    } else {
      setProblem(value ? "The first day must not be after the last; the range is unchanged." : "Pick a whole day; the range is unchanged.");
    }
  };
  return (
    <div className="sc-report-range">
      <Segmented size="sm" label={label} options={RANGE_OPTIONS} value={range.preset} onChange={(preset) => onChange({ ...range, preset })} />
      {range.preset === "custom" && (
        <span className="sc-report-range__days">
          <input className="sc-input" type="date" aria-label="From" value={range.from} max={range.to} onChange={(e) => setDay("from", e.target.value)} />
          <span aria-hidden="true">–</span>
          <input className="sc-input" type="date" aria-label="To" value={range.to} min={range.from} onChange={(e) => setDay("to", e.target.value)} />
        </span>
      )}
      {range.preset === "custom" && problem && <span className="sc-help sc-report-range__problem" role="alert">{problem}</span>}
    </div>
  );
}

interface ReportToolbarProps {
  title: ReactNode;
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  variables: ReportVariables;
  onVariables: (variables: ReportVariables) => void;
  page: PageSetup;
  onPage: (page: PageSetup) => void;
  /** Undo, CSV, Print, Download PDF: whatever the builder offers at this step. */
  actions: ReactNode;
}

/** The report-wide controls: every block takes these unless it overrides them. */
export function ReportToolbar({ title, buoys, variables, onVariables, page, onPage, actions }: ReportToolbarProps) {
  const pageValue = `${page.size}-${page.orientation}` as PageValue;
  return (
    <div className="sc-report-bar" role="toolbar" aria-label="Report">
      <div className="sc-report-bar__title">{title}</div>
      <div className="sc-report-bar__vars">
        <BuoyPick buoys={buoys} picked={variables.buoys} onChange={(picked) => onVariables({ ...variables, buoys: picked })} />
        <RangePick range={variables.range} onChange={(range) => onVariables({ ...variables, range })} />
        <Segmented size="sm" label="Time zone" options={ZONES} value={variables.zone} onChange={(zone) => onVariables({ ...variables, zone })} />
        <Select aria-label="Page size" className="sc-report-bar__page" value={pageValue} options={PAGES}
          onChange={(value) => { const [size, orientation] = value.split("-") as [PageSetup["size"], PageSetup["orientation"]]; onPage({ size, orientation }); }} />
      </div>
      <div className="sc-report-bar__actions">{actions}</div>
    </div>
  );
}
