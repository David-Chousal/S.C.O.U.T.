"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, BuoySettings, FirmwareSetting } from "@/lib/api/types";
import { COUNT_SIGNAL } from "@/lib/format";
import { can, needs, useSession } from "@/lib/session";

const STATUS_BADGE: Record<FirmwareSetting["status"], string> = {
  decided: "sc-badge sc-badge--muted",
  provisional: "sc-badge sc-badge--pending",
  "pending sign-off": "sc-badge sc-badge--pending",
};

function BuoyCard({ buoy, canRename, onSaved }: { buoy: Buoy; canRename: boolean; onSaved: () => void }) {
  const { show } = useToast();
  const [label, setLabel] = useState(buoy.label);
  const [saving, setSaving] = useState(false);
  const signal = COUNT_SIGNAL[buoy.state];
  const inputId = `buoy-${buoy.buoy_id}-label`;

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
    <section className="sc-bay" aria-labelledby={`${inputId}-title`}>
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id={`${inputId}-title`}>{buoy.label}</h3>
        <span className="sc-tag">Buoy ID {buoy.buoy_id}</span>
      </div>
      <form className="sc-settings-form" onSubmit={onSubmit}>
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><label className="sc-tag" htmlFor={inputId}>Name in the console</label></span>
          <input id={inputId} className="sc-input" maxLength={40} required value={label} disabled={!canRename}
            aria-describedby={`${inputId}-help`} onChange={(event) => setLabel(event.target.value)} />
          <span id={`${inputId}-help`} className="sc-help">Only the console uses it; the buoy sends its numeric ID.</span>
        </div>
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Transmits a day</span></span>
          <span className="sc-row sc-settings-count">
            <strong>{buoy.tx_count_requested ? `${buoy.tx_count_requested} requested` : "Default (3)"}</strong>
            <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} />
          </span>
          <span className="sc-help">Buoy reports {buoy.tx_count_reported ?? "—"} a day · newest packet <Ago ms={buoy.reported_at} /> ·{" "}
            <Link className="sc-link" href="/fleet/">change it on Fleet</Link></span>
        </div>
        <div className="sc-settings-form__foot">
          <Key type="submit" variant="primary" disabled={!canRename || saving || label.trim() === buoy.label}>
            {saving ? "Saving…" : "Save name"}
          </Key>
        </div>
      </form>
    </section>
  );
}

/** The way most settings change; said once above the table, so only the exceptions repeat it. */
export function usualChange(settings: FirmwareSetting[]): string {
  const counts = new Map<string, number>();
  for (const setting of settings) counts.set(setting.change, (counts.get(setting.change) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** Keep "3.10 V" and "CR 4/8" on one line: a number never wraps away from its unit or name. */
export function keepUnits(value: string): string {
  return value.replace(/(\d) (?=[^\s·]{1,4}(?:\s|$))/g, "$1\u00a0").replace(/\b([A-Z]{2,3}) (?=\d)/g, "$1\u00a0");
}

function FirmwareTable({ settings }: { settings: FirmwareSetting[] }) {
  const usual = usualChange(settings);
  return (
    <section className="sc-bay" aria-labelledby="firmware-title">
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id="firmware-title">Firmware settings</h3>
        <span className="sc-tag">Every buoy · read from the firmware</span>
      </div>
      <p className="sc-help">These come straight from the buoy firmware in the repo (config.h), so they cannot drift from it.
        Unless a row says otherwise, a setting changes by: {usual}.</p>
      <div className="sc-table-wrap">
        <table className="sc-table sc-firmware-table">
          <thead><tr><th scope="col">Setting</th><th scope="col">Value</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {settings.map((setting) => (
              <tr key={setting.key}>
                <th scope="row">{setting.label}</th>
                <td><span className="sc-num">{keepUnits(setting.value)}</span>{setting.note && <span className="sub">{setting.note}</span>}
                  {setting.change !== usual && <span className="sub">Changes: {setting.change}</span>}</td>
                <td><span className={STATUS_BADGE[setting.status]}>{setting.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Settings → Buoys: each buoy's name and transmit count, then the firmware's settings. */
export function BuoySettingsPanel({ data, error, reload }: { data: BuoySettings | null; error: string; reload: () => void }) {
  const { user } = useSession();
  const canRename = can(user.role, "settings.write");
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading buoy settings…</span>;
  return (
    <>
      {!canRename && <Banner tone="info" icon="lock">View only: renaming a buoy needs the {needs("settings.write")} role.</Banner>}
      {data.buoys.length === 0 ? (
        <EmptyState status="No buoys" title="No buoys yet">A buoy appears when its shore station first pushes a reading.</EmptyState>
      ) : (
        <div className="sc-grid12">
          {data.buoys.map((buoy) => (
            <div className="span-6" key={buoy.buoy_id}><BuoyCard buoy={buoy} canRename={canRename} onSaved={reload} /></div>
          ))}
        </div>
      )}
      <FirmwareTable settings={data.firmware.settings} />
    </>
  );
}
