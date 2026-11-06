"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { Key } from "@/components/ui/key";
import { Select } from "@/components/ui/select";
import type { AlertKind, AlertPreset, AlertRule, AlertRuleInput, AlertsView } from "@/lib/api/types";

export interface Draft {
  buoy: number | "any";
  kind: AlertKind;
  metric: string;
  op: "above" | "below";
  value: string;
  remind: string;
  /** Where a preset's number came from, shown under the form. */
  source?: string;
}

const KINDS: readonly { value: AlertKind; label: string }[] = [
  { value: "threshold", label: "A reading crosses a value" },
  { value: "flag", label: "A firmware flag appears" },
  { value: "silence", label: "The buoy goes quiet" },
];
const OPS = [{ value: "above", label: "above" }, { value: "below", label: "below" }] as const;

export const emptyDraft = (catalog: Pick<AlertsView, "metrics" | "flags">): Draft => ({
  buoy: "any", kind: "threshold", metric: catalog.metrics[0]?.key ?? "", op: "above", value: "", remind: "",
});

export function draftOfPreset(preset: AlertPreset, catalog: Pick<AlertsView, "metrics" | "flags">): Draft {
  return {
    ...emptyDraft(catalog), kind: preset.kind, metric: preset.metric ?? (preset.kind === "flag" ? catalog.flags[0]?.key ?? "" : catalog.metrics[0]?.key ?? ""),
    op: preset.op ?? "above", value: preset.value === null ? "" : String(preset.value), source: preset.source,
  };
}

export function draftOfRule(rule: AlertRule): Draft {
  return {
    buoy: rule.buoy_id ?? "any", kind: rule.kind, metric: rule.metric ?? "", op: rule.op ?? "above",
    value: rule.value === null ? "" : String(rule.value), remind: rule.remind_hours === null ? "" : String(rule.remind_hours),
  };
}

/** The draft as the API takes it, or a sentence saying what is missing. */
export function inputOf(draft: Draft): AlertRuleInput | string {
  const value = draft.value.trim() === "" ? NaN : Number(draft.value);
  const remind = draft.remind.trim() === "" ? null : Number(draft.remind);
  if (remind !== null && !(Number.isInteger(remind) && remind >= 1)) return "Remind every whole number of hours, or leave it empty.";
  const base = { buoy_id: draft.buoy === "any" ? null : draft.buoy, remind_hours: remind };
  if (draft.kind === "flag") return { ...base, kind: "flag", metric: draft.metric, op: null, value: null };
  if (!Number.isFinite(value)) return draft.kind === "silence" ? "Give the number of quiet hours." : "Give the value to compare against.";
  if (draft.kind === "silence") return { ...base, kind: "silence", metric: null, op: null, value };
  return { ...base, kind: "threshold", metric: draft.metric, op: draft.op, value };
}

interface AlertEditorProps {
  catalog: AlertsView;
  buoys: readonly { buoy_id: number; label: string }[];
  draft: Draft;
  onDraft: (draft: Draft) => void;
  editing: boolean;
  disabled: boolean;
  onSave: (input: AlertRuleInput) => Promise<void>;
  onCancel: () => void;
}

/** Builds or edits one rule: which buoy, what it watches, the condition and value in the metric's
 * unit, and an optional reminder. Presets fill it in; nothing is saved until the person saves. */
export function AlertEditor({ catalog, buoys, draft, onDraft, editing, disabled, onSave, onCancel }: AlertEditorProps) {
  const [problem, setProblem] = useState("");
  const set = (patch: Partial<Draft>) => onDraft({ ...draft, ...patch, source: patch.source ?? draft.source });
  const unit = catalog.metrics.find((m) => m.key === draft.metric)?.unit ?? "";
  const buoyOptions = [{ value: "any" as const, label: "Any buoy" }, ...buoys.map((b) => ({ value: b.buoy_id, label: b.label }))];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputOf(draft);
    if (typeof input === "string") return setProblem(input);
    setProblem("");
    await onSave(input);
  }

  function pickKind(kind: AlertKind) {
    const metric = kind === "flag" ? catalog.flags[0]?.key ?? "" : kind === "threshold" ? catalog.metrics[0]?.key ?? "" : "";
    set({ kind, metric, value: "", source: "" });
  }

  return (
    <form className="sc-alert-builder" onSubmit={submit} aria-label={editing ? "Edit alert" : "New alert"}>
      <div className="sc-row sc-alert-presets" role="group" aria-label="Presets">
        <span className="sc-tag">Start from</span>
        {catalog.presets.map((preset) => (
          <Key key={preset.id} size="sm" disabled={disabled} onClick={() => onDraft(draftOfPreset(preset, catalog))}>{preset.label}</Key>
        ))}
      </div>
      <div className="sc-settings-form sc-alert-form">
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Buoy</span></span>
          <Select aria-label="Buoy" value={draft.buoy} options={buoyOptions} disabled={disabled} onChange={(buoy) => set({ buoy })} />
        </div>
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Alert when</span></span>
          <Select aria-label="Alert when" value={draft.kind} options={KINDS} disabled={disabled} onChange={pickKind} />
        </div>
        {draft.kind === "threshold" && <>
          <div className="sc-fieldset">
            <span className="sc-fieldset__label"><span className="sc-tag">Reading</span></span>
            <Select aria-label="Reading" value={draft.metric} disabled={disabled}
              options={catalog.metrics.map((m) => ({ value: m.key, label: m.unit ? `${m.label} (${m.unit})` : m.label }))}
              onChange={(metric) => set({ metric })} />
          </div>
          <div className="sc-fieldset">
            <span className="sc-fieldset__label"><span className="sc-tag">Condition</span></span>
            <span className="sc-row sc-alert-form__value">
              <Select aria-label="Condition" value={draft.op} options={OPS} disabled={disabled} onChange={(op) => set({ op })} />
              <input className="sc-input sc-num" aria-label={`Value in ${unit}`} inputMode="decimal" value={draft.value} disabled={disabled}
                placeholder="Set a value" onChange={(event) => set({ value: event.target.value })} />
              <span className="sc-help sc-num">{unit}</span>
            </span>
          </div>
        </>}
        {draft.kind === "flag" && (
          <div className="sc-fieldset">
            <span className="sc-fieldset__label"><span className="sc-tag">Flag</span></span>
            <Select aria-label="Flag" value={draft.metric} disabled={disabled}
              options={catalog.flags.map((f) => ({ value: f.key, label: `${f.label} · ${f.key}` }))} onChange={(metric) => set({ metric })} />
          </div>
        )}
        {draft.kind === "silence" && (
          <label className="sc-fieldset">
            <span className="sc-fieldset__label"><span className="sc-tag">Quiet for</span></span>
            <span className="sc-row sc-alert-form__value">
              <input className="sc-input sc-num" aria-label="Quiet hours" inputMode="numeric" value={draft.value} disabled={disabled}
                placeholder="Set hours" onChange={(event) => set({ value: event.target.value })} />
              <span className="sc-help sc-num">h</span>
            </span>
          </label>
        )}
        <label className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Remind every</span></span>
          <span className="sc-row sc-alert-form__value">
            <input className="sc-input sc-num" aria-label="Remind every (hours)" inputMode="numeric" value={draft.remind} disabled={disabled}
              placeholder="Never" onChange={(event) => set({ remind: event.target.value })} />
            <span className="sc-help sc-num">h</span>
          </span>
          <span className="sc-help">While it stays in breach. Empty: one email per breach.</span>
        </label>
      </div>
      {draft.source && <p className="sc-help">{draft.source}</p>}
      {problem && <Banner tone="failed">{problem}</Banner>}
      <span className="sc-row">
        <button className="sc-key sc-key--primary" type="submit" disabled={disabled}>{editing ? "Save changes" : "Add alert"}</button>
        {editing && <Key onClick={onCancel}>Cancel</Key>}
      </span>
    </form>
  );
}
