"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Buoy, BuoySettings, FirmwareSetting } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { useViewOnlyNote } from "@/lib/view-only-note";
import { BuoyOverview } from "./buoy-overview";
import { RemoteSettings } from "./remote-settings";

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

function selectedFromUrl(buoys: Buoy[]): number {
  const wanted = Number(new URLSearchParams(window.location.search).get("buoy"));
  return buoys.some((b) => b.buoy_id === wanted) ? wanted : buoys[0]?.buoy_id ?? 0;
}

/** Settings → Buoys: an overview of every buoy, one buoy's editor below it, then the firmware
 * defaults. The picked buoy is kept in the address (?buoy=2) so a link opens it. The editor
 * remounts when what the buoy should run changes, so its form starts from the saved values. */
export function BuoySettingsPanel({ data, error, reload }: { data: BuoySettings | null; error: string; reload: () => void }) {
  const { user } = useSession();
  const canEdit = can(user.role, "settings.write");
  useViewOnlyNote(canEdit ? null : `View only: renaming a buoy or changing its settings needs the ${needs("settings.write")} role.`);
  const [picked, setPicked] = useState<number | null>(null);
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading buoy settings…</span>;
  const selected = picked ?? (typeof window === "undefined" ? data.buoys[0]?.buoy_id ?? 0 : selectedFromUrl(data.buoys));
  const buoy = data.buoys.find((b) => b.buoy_id === selected);

  function select(buoyId: number) {
    setPicked(buoyId);
    const url = new URL(window.location.href);
    url.searchParams.set("buoy", String(buoyId));
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <section className="sc-bay" aria-labelledby="buoys-overview-title">
        <div className="sc-bay__head">
          <h3 className="sc-bay__title" id="buoys-overview-title">Buoys</h3>
          <span className="sc-tag">Pick one to change it</span>
        </div>
        {data.buoys.length === 0 ? (
          <EmptyState status="No buoys" title="No buoys yet">
            A buoy appears when its shore station first pushes a reading, or when an admin adds it on Fleet. Its settings open here.
          </EmptyState>
        ) : <BuoyOverview buoys={data.buoys} remote={data.firmware.remote} selected={selected} onSelect={select} />}
      </section>
      {buoy && (
        <RemoteSettings key={`${buoy.buoy_id}-${buoy.settings_digest_wanted}`} buoy={buoy} remote={data.firmware.remote}
          slotsSod={data.firmware.slotsSod} estimates={data.estimates} canEdit={canEdit} onSaved={reload} />
      )}
      <FirmwareTable settings={data.firmware.settings} />
    </>
  );
}
