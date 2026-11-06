"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter } from "@/components/status/signal-meter";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, CountState, Estimates, RemoteSetting } from "@/lib/api/types";
import { TransmitConfirm } from "./transmit-confirm";
import { Select } from "@/components/ui/select";

export const SETTINGS_SIGNAL: Record<CountState, { state: "ok" | "stale" | "failed"; lit: number; word: string; detail: string }> = {
  confirmed: { state: "ok", lit: 4, word: "Confirmed", detail: "The buoy reports running exactly these settings." },
  default: { state: "ok", lit: 4, word: "Default", detail: "Nothing requested; the buoy runs its firmware defaults." },
  pending: { state: "stale", lit: 2, word: "Pending", detail: "Sent after the buoy's next packet; confirmed when its digest matches." },
  unreported: { state: "stale", lit: 1, word: "Pending", detail: "No v5 packet yet, so the buoy cannot confirm settings. It needs firmware with packet v5." },
  rejected: { state: "failed", lit: 1, word: "Rejected", detail: "The buoy refused the last command (its packet carried CMD_REJECTED)." },
};

/** Every value a setting allows, when there are few enough to list. */
export function optionsOf(spec: RemoteSetting): number[] | null {
  if (spec.choices) return spec.choices;
  const count = Math.floor((spec.max! - spec.min!) / spec.step!) + 1;
  return count <= 12 ? Array.from({ length: count }, (_, i) => spec.min! + i * spec.step!) : null;
}

export function display(spec: RemoteSetting, value: number): string {
  if (spec.key === "audio_clip_s" && value === 0) return "Off";
  return spec.unit ? `${value} ${spec.unit}` : String(value);
}

/** The slots a count uses (1 → first, 2 → first and last, 3 → all), as scout_tx_slot_mask does. */
const SLOT_INDICES: Record<number, number[]> = { 1: [0], 2: [0, 2], 3: [0, 1, 2] };

/** When a buoy with this count and phase sends, e.g. "00:10 and 16:10 UTC". */
export function sendTimes(slotsSod: number[], txCount: number, phaseH: number): string {
  const times = (SLOT_INDICES[txCount] ?? []).map((i) => {
    const sod = (slotsSod[i] + phaseH * 3600) % 86400;
    return `${String(Math.floor(sod / 3600)).padStart(2, "0")}:${String(Math.floor((sod % 3600) / 60)).padStart(2, "0")}`;
  });
  const joined = times.length > 1 ? `${times.slice(0, -1).join(", ")} and ${times.at(-1)}` : times[0];
  return `${joined} UTC`;
}

/** The keys whose value in `form` differs from what the buoy is asked to run now. */
export function changedKeys(remote: RemoteSetting[], wanted: number[], form: Record<string, number>): string[] {
  return remote.filter((spec, i) => form[spec.key] !== wanted[i]).map((spec) => spec.key);
}

interface FieldProps {
  spec: RemoteSetting;
  /** Overrides spec.help, for a line that depends on other values in the form. */
  help?: string;
  buoyId: number;
  value: number;
  requested: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
}

function Field({ spec, help, buoyId, value, requested, disabled, onChange }: FieldProps) {
  const id = `buoy-${buoyId}-${spec.key}`;
  const options = optionsOf(spec);
  return (
    <div className="sc-fieldset sc-fieldset--tip">
      <span className="sc-fieldset__label"><label className="sc-tag" htmlFor={id}>{spec.label}</label></span>
      {options ? (
        <Select id={id} value={value} disabled={disabled} aria-describedby={`${id}-help`} onChange={onChange}
          options={options.map((option) => ({ value: option, label: display(spec, option) }))} />
      ) : (
        <input id={id} className="sc-input" type="number" inputMode="numeric" min={spec.min} max={spec.max} step={spec.step}
          value={value} disabled={disabled} aria-describedby={`${id}-help`} onChange={(event) => onChange(Number(event.target.value))} />
      )}
      <span id={`${id}-help`} className="sc-tip sc-fieldset__tip">{help ?? spec.help} Default {display(spec, spec.default)}{requested ? " · requested" : ""}.</span>
    </div>
  );
}

interface RemoteSettingsProps {
  buoy: Buoy;
  remote: RemoteSetting[];
  slotsSod: number[];
  estimates: Estimates;
  canEdit: boolean;
  onSaved: () => void;
}

/** The buoy's name in the console, saved on its own: it never goes to the buoy. */
function RenameField({ buoy, canEdit, onSaved }: { buoy: Buoy; canEdit: boolean; onSaved: () => void }) {
  const { show } = useToast();
  const [label, setLabel] = useState(buoy.label);
  const [saving, setSaving] = useState(false);
  const id = `buoy-${buoy.buoy_id}-label`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.renameBuoy(buoy.buoy_id, label.trim());
      show({ tone: "ok", title: `Renamed buoy ${buoy.buoy_id} to ${label.trim()}` });
      onSaved();
    } catch (failure) {
      show({ tone: "failed", title: "Not renamed", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="sc-rename" onSubmit={onSubmit}>
      <label className="sc-tag" htmlFor={id}>Name in the console</label>
      <span className="sc-rename__row">
        <input id={id} className="sc-input" maxLength={40} required value={label} disabled={!canEdit}
          onChange={(event) => setLabel(event.target.value)} />
        <Key type="submit" disabled={!canEdit || saving || label.trim() === buoy.label}>{saving ? "Saving…" : "Save name"}</Key>
      </span>
    </form>
  );
}

/** One buoy's editor: its name, whether it runs what was asked, and a control per remote setting.
 * Saving sends only the settings that changed; the console refuses a set the buoy would refuse,
 * so a bad combination never reaches the radio. */
export function RemoteSettings({ buoy, remote, slotsSod, estimates, canEdit, onSaved }: RemoteSettingsProps) {
  const { show } = useToast();
  const initial = Object.fromEntries(remote.map((spec, i) => [spec.key, buoy.settings_wanted[i]]));
  const [form, setForm] = useState<Record<string, number>>(initial);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const signal = SETTINGS_SIGNAL[buoy.settings_state];
  const changed = changedKeys(remote, buoy.settings_wanted, form);
  const titleId = `buoy-${buoy.buoy_id}-remote-title`;

  // A new transmit count is confirmed first, with what it does to battery life.
  const fromCount = buoy.settings_wanted[remote.findIndex((spec) => spec.key === "tx_count")];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changed.includes("tx_count")) setConfirming(true);
    else void send();
  }

  async function send() {
    setConfirming(false);
    setSaving(true);
    try {
      await api.requestSettings(buoy.buoy_id, Object.fromEntries(changed.map((key) => [key, form[key]])));
      show({ tone: "ok", title: `Sent ${changed.length} setting${changed.length === 1 ? "" : "s"} for ${buoy.label}`,
        detail: "The shore station sends them after the buoy's next packet." });
      onSaved();
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    try {
      await api.restoreDefaults(buoy.buoy_id);
      setForm(Object.fromEntries(remote.map((spec) => [spec.key, spec.default])));
      show({ tone: "ok", title: `${buoy.label} goes back to the firmware defaults` });
      onSaved();
    } catch (failure) {
      show({ tone: "failed", title: "Not restored", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  return (
    <section className="sc-bay" aria-labelledby={titleId}>
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id={titleId}>{buoy.label}</h3>
        <span className="sc-row"><span className="sc-tag">Buoy ID {buoy.buoy_id}</span>
          <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} /></span>
      </div>
      <RenameField key={buoy.label} buoy={buoy} canEdit={canEdit} onSaved={onSaved} />
      <p className="sc-help">{signal.detail} Wanted digest <span className="sc-num">{buoy.settings_digest_wanted}</span> ·
        buoy reports <span className="sc-num">{buoy.settings_digest_reported ?? "—"}</span>.</p>
      <form className="sc-settings-form sc-remote-form" onSubmit={onSubmit}>
        {remote.map((spec) => (
          <Field key={spec.key} spec={spec} buoyId={buoy.buoy_id}
            help={spec.key === "tx_count" || spec.key === "slot_phase_h"
              ? `Sends at ${sendTimes(slotsSod, form.tx_count, form.slot_phase_h)}.` : undefined} value={form[spec.key]} disabled={!canEdit}
            requested={buoy.settings_requested[spec.key] !== null}
            onChange={(value) => setForm((now) => ({ ...now, [spec.key]: value }))} />
        ))}
        <div className="sc-settings-form__foot sc-remote-form__actions">
          <Key type="submit" variant="primary" disabled={!canEdit || saving || changed.length === 0}>
            {saving ? "Sending…" : changed.length ? `Send ${changed.length} change${changed.length === 1 ? "" : "s"}` : "No changes"}
          </Key>
          <Key type="button" disabled={!canEdit || changed.length === 0} onClick={() => setForm(initial)}>Undo</Key>
          <HoldKey label="Hold to restore defaults" holdLabel={`Hold to restore ${buoy.label}'s defaults`}
            disabled={!canEdit} onConfirm={restore} />
        </div>
      </form>
      <TransmitConfirm open={confirming} buoyLabel={buoy.label} from={fromCount} to={form.tx_count}
        sendTimes={sendTimes(slotsSod, form.tx_count, form.slot_phase_h)} estimates={estimates}
        onCancel={() => setConfirming(false)} onConfirm={() => void send()} />
    </section>
  );
}
