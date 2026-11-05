"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter, type SignalState } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, BuoySettings, Device, RemoteSetting } from "@/lib/api/types";
import { buoyHealth, runningSettings, slotsInUse } from "@/lib/buoy-status";
import { lastHeard, plural } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { CommandStation } from "./command-station";
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

interface StationsData {
  buoys: Buoy[];
  remote: RemoteSetting[];
  slotsSod: number[];
}

function BuoysTable({ data, active, allowed, now, onChanged }: {
  data: StationsData; active: Device[]; allowed: boolean; now: number; onChanged: () => void;
}) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-stations-buoys">
        <thead><tr><th scope="col">Buoy</th><th scope="col">Commands from</th><th scope="col">Last heard</th><th scope="col">Status</th></tr></thead>
        <tbody>
          {data.buoys.map((buoy) => {
            const running = runningSettings(buoy, data.remote);
            const health = buoyHealth(lastHeard(buoy), slotsInUse(data.slotsSod, running.tx_count, running.slot_phase_h), now);
            return (
              <tr key={buoy.buoy_id}>
                <th scope="row">{buoy.label}<span className="sub">ID {buoy.buoy_id}</span></th>
                <td><CommandStation buoy={buoy} stations={active} canPick={allowed} onChanged={onChanged} /></td>
                <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                <td><SignalMeter state={health.state} lit={health.lit} word={health.word} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Stations: which shore station commands each buoy and when each was heard, then the shore
 * stations' tokens, with a key to make one and a way to revoke and then delete them. */
export function StationsBoard() {
  const when = useWhen();
  const { user } = useSession();
  const { show } = useToast();
  const settings = useApi<BuoySettings>(api.settings);
  const devices = useApi<{ devices: Device[] }>(api.devices);
  const [adding, setAdding] = useState(false);
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
  const data = { buoys: settings.data.buoys, remote: settings.data.firmware.remote, slotsSod: settings.data.firmware.slotsSod };

  return (
    <>
      <section className="sc-bay" aria-labelledby="buoys-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="buoys-title">Buoys</h2>
          <span className="sc-tag">Which shore station sends each buoy&rsquo;s commands</span></div>
        {data.buoys.length === 0 ? <p className="sc-help">No buoy has reported yet.</p>
          : <BuoysTable data={data} active={active} allowed={allowed} now={now} onChanged={settings.reload} />}
      </section>
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
              <thead><tr><th scope="col">Station</th><th scope="col">Created</th><th scope="col">Last seen</th>
                <th scope="col">Status</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {devices.data.devices.map((device) => (
                  <tr key={device.id}>
                    <th scope="row">{device.name}</th>
                    <td className="sc-stations-table__when">{when(device.created_at)}</td>
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
      </section>
      <NewTokenDialog open={adding} onClose={() => setAdding(false)} onCreated={devices.reload} />
    </>
  );
}
