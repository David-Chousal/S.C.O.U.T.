"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, BuoySettings, FirmwareSetting } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { RemoteSettings } from "./remote-settings";

function BuoyCard({ buoy, canRename, onSaved }: { buoy: Buoy; canRename: boolean; onSaved: () => void }) {
  const { show } = useToast();
  const [label, setLabel] = useState(buoy.label);
  const [saving, setSaving] = useState(false);
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
        <div className="sc-settings-form__foot">
          <Key type="submit" variant="primary" disabled={!canRename || saving || label.trim() === buoy.label}>
            {saving ? "Saving…" : "Save name"}
          </Key>
        </div>
      </form>
    </section>
  );
}

/** Keep "3.10 V" and "CR 4/8" on one line: a number never wraps away from its unit or name. */
export function keepUnits(value: string): string {
  return value.replace(/(\d) (?=[^\s·]{1,4}(?:\s|$))/g, "$1\u00a0").replace(/\b([A-Z]{2,3}) (?=\d)/g, "$1\u00a0");
}

const CHANGE_LABEL: Record<FirmwareSetting["change"], string> = { radio: "By radio", firmware: "Firmware" };

function FirmwareTable({ settings }: { settings: FirmwareSetting[] }) {
  return (
    <section className="sc-bay" aria-labelledby="firmware-title">
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id="firmware-title">Firmware defaults</h3>
        <span className="sc-tag">Every buoy · read from the firmware</span>
      </div>
      <p className="sc-help">What every buoy starts with, read from the firmware in the repo so it cannot drift. Settings marked
        {" "}<strong>By radio</strong> can be changed per buoy above; the rest need a firmware update.</p>
      <div className="sc-table-wrap">
        <table className="sc-table sc-firmware-table">
          <thead><tr><th scope="col">Setting</th><th scope="col">Default</th><th scope="col">Changes</th></tr></thead>
          <tbody>
            {settings.map((setting) => (
              <tr key={setting.key}>
                <th scope="row">{setting.label}<span className="sub">{setting.description}</span></th>
                <td><span className="sc-num">{keepUnits(setting.value)}</span></td>
                <td><span className={setting.change === "radio" ? "sc-badge" : "sc-badge sc-badge--muted"}>{CHANGE_LABEL[setting.change]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Settings → Buoys: each buoy's name and transmit count, its remote settings, then the firmware's
 * settings. Each remote-settings bay remounts when what the buoy should run changes, so its form
 * always starts from the saved values. */
export function BuoySettingsPanel({ data, error, reload }: { data: BuoySettings | null; error: string; reload: () => void }) {
  const { user } = useSession();
  const canRename = can(user.role, "settings.write");
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading buoy settings…</span>;
  return (
    <>
      {!canRename && <Banner tone="info" icon="lock">View only: renaming a buoy or changing its settings needs the {needs("settings.write")} role.</Banner>}
      {data.buoys.length === 0 ? (
        <EmptyState status="No buoys" title="No buoys yet">A buoy appears when its shore station first pushes a reading.</EmptyState>
      ) : (
        <div className="sc-grid12">
          {data.buoys.map((buoy) => (
            <div className="span-6" key={buoy.buoy_id}><BuoyCard buoy={buoy} canRename={canRename} onSaved={reload} /></div>
          ))}
          {data.buoys.map((buoy) => (
            <div className="span-12" key={`${buoy.buoy_id}-${buoy.settings_digest_wanted}`}>
              <RemoteSettings buoy={buoy} remote={data.firmware.remote} slotsSod={data.firmware.slotsSod}
                canEdit={canRename} onSaved={reload} />
            </div>
          ))}
        </div>
      )}
      <FirmwareTable settings={data.firmware.settings} />
    </>
  );
}
