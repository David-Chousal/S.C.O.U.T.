"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Buoy, BuoySettings } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { useViewOnlyNote } from "@/lib/view-only-note";
import { BuoyOverview } from "./buoy-overview";
import { RemoteSettings } from "./remote-settings";

function selectedFromUrl(buoys: Buoy[]): number {
  const wanted = Number(new URLSearchParams(window.location.search).get("buoy"));
  return buoys.some((b) => b.buoy_id === wanted) ? wanted : buoys[0]?.buoy_id ?? 0;
}

/** Settings → Buoys: an overview of every buoy and one buoy's editor below it. The picked buoy is kept in the address (?buoy=2) so a link opens it. The editor
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
    </>
  );
}
