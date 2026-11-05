"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter, type SignalState } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { BuoySettings, Device } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { AssignDialog } from "./assign-dialog";
import { commandRoutes } from "./command-routes";
import { NewTokenDialog } from "./new-token-dialog";

const HOUR = 3600 * 1000;
const REFRESH_MS = 30 * 1000;

/** How recently something checked in, as a signal meter. Buoys answer up to 3 times a day, so a
 * gap under 9 h is normal; a full day is silence. Shore stations sync at least hourly. */
export function freshness(lastSeen: number | null, now: number, okWithinMs: number): { state: SignalState; lit: number; word: string } {
  if (!lastSeen) return { state: "off", lit: 0, word: "Never" };
  const age = now - lastSeen;
  if (age <= okWithinMs) return { state: "ok", lit: 4, word: "Live" };
  if (age <= 24 * HOUR) return { state: "stale", lit: 2, word: "Stale" };
  return { state: "failed", lit: 1, word: "Silent" };
}

/** Stations: every shore station, the buoys whose commands it sends, when it was last seen, and
 * its token: a key to make one, hold to revoke, and delete once revoked. Buoys' own state lives on
 * Fleet. */
export function StationsBoard() {
  const when = useWhen();
  const { user } = useSession();
  const { show } = useToast();
  const settings = useApi<BuoySettings>(api.settings);
  const devices = useApi<{ devices: Device[] }>(api.devices);
  const [adding, setAdding] = useState(false);
  const [assigning, setAssigning] = useState<Device | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const allowed = can(user.role, "devices.write");
  const active = (devices.data?.devices ?? []).filter((device) => !device.revoked_at);
  usePoll(() => {
    settings.reload();
    devices.reload();
    setNow(Date.now());
  }, REFRESH_MS);

  async function run(action: () => Promise<unknown>, ok: string, detail: string, failed: string) {
    try {
      await action();
      show({ tone: "ok", title: ok, detail });
      devices.reload();
      settings.reload();
    } catch (failure) {
      show({ tone: "failed", title: failed, detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  const error = settings.error || devices.error;
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!settings.data || !devices.data) return <span className="sc-tag" aria-busy="true">Loading stations…</span>;
  const buoys = settings.data.buoys;
  const routes = commandRoutes(buoys, active);
  const canAssign = allowed && active.length > 1 && buoys.length > 0;

  return (
    <>
      <section className="sc-bay" aria-labelledby="shore-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="shore-title">Shore stations</h2>
          <span className="sc-row">
            <span className="sc-tag">{plural(active.length, "active token")}</span>
            <Key size="sm" variant="primary" icon="plus" disabled={!allowed} onClick={() => setAdding(true)}
              title={allowed ? undefined : "Making a token needs the admin role"}>New token</Key>
          </span>
        </div>
        {devices.data.devices.length === 0 ? <p className="sc-help">No shore stations yet.</p> : (
          <div className="sc-table-wrap">
            <table className="sc-table sc-stations-table">
              <thead><tr><th scope="col">Station</th><th scope="col">Buoys it commands</th><th scope="col">Last seen</th>
                <th scope="col">Status</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {devices.data.devices.map((device) => (
                  <tr key={device.id}>
                    <th scope="row">{device.name}<span className="sub">created {when(device.created_at)}</span></th>
                    <td>
                      <span className="sc-chips">
                        {(routes.byStation.get(device.id) ?? []).map((buoy) => <span key={buoy.buoy_id} className="sc-chip">{buoy.label}</span>)}
                        {!device.revoked_at && (routes.byStation.get(device.id) ?? []).length === 0 && <span className="sc-help">None</span>}
                        {device.revoked_at && <span className="sc-help">—</span>}
                        {canAssign && !device.revoked_at && (
                          <Key size="sm" onClick={() => setAssigning(device)} aria-label={`Assign buoys to ${device.name}`}>Assign</Key>
                        )}
                      </span>
                    </td>
                    <td className="sc-stations-table__when"><Ago ms={device.last_seen_at} /></td>
                    <td>{device.revoked_at
                      ? <><span className="sc-badge sc-badge--muted">Revoked</span><span className="sub">{when(device.revoked_at)}</span></>
                      : <SignalMeter {...freshness(device.last_seen_at, now, 2 * HOUR)} />}</td>
                    <td className="sc-stations-table__actions">
                      {device.revoked_at ? (
                        <Key size="sm" iconOnly icon="trash" aria-label={`Delete ${device.name}'s revoked token`} disabled={!allowed}
                          title="Delete for good"
                          onClick={() => run(() => api.deleteDevice(device.id), `Deleted ${device.name}'s token`, "It is gone from the list; the audit log keeps the record.", "Not deleted")} />
                      ) : (
                        <HoldKey size="sm" label="Hold to revoke" holdLabel={`Hold to revoke ${device.name}'s token`} disabled={!allowed}
                          onConfirm={() => run(() => api.revokeDevice(device.id), `Revoked ${device.name}'s token`, "It can no longer push readings or read settings.", "Not revoked")} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {active.length === 1 && buoys.length > 0 && (
          <p className="sc-help">{active[0].name} is the only active station, so it sends every buoy&rsquo;s commands.</p>
        )}
        {active.length > 1 && routes.orphans.length > 0 && (
          <Banner tone="caution">
            <strong>{routes.orphans.map((b) => b.label).join(", ")}</strong> {routes.orphans.length === 1 ? "has" : "have"} no station
            sending {routes.orphans.length === 1 ? "its" : "their"} commands, so settings changes cannot reach {routes.orphans.length === 1 ? "it" : "them"}.
            Assign {routes.orphans.length === 1 ? "it" : "them"} to a station.
          </Banner>
        )}
      </section>
      <AssignDialog key={assigning?.id ?? "none"} station={assigning} buoys={buoys} active={active}
        onClose={() => setAssigning(null)} onSaved={settings.reload} />
      <NewTokenDialog open={adding} onClose={() => setAdding(false)} onCreated={devices.reload} />
    </>
  );
}
