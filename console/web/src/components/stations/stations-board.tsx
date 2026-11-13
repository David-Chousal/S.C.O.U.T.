"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { SignalMeter, type SignalState } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { ActionMenu, type ActionMenuItem } from "@/components/overlays/action-menu";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { BuoySettings, Device } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { AssignDialog } from "./assign-dialog";
import { commandRoutes } from "./command-routes";
import { NewTokenDialog } from "./new-token-dialog";
import { DeleteStationDialog, RevokeDialog, StationInfoDialog } from "./station-dialogs";
import { WifiSetupDialog, wifiSetupPending } from "./wifi-setup-dialog";

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

/** Stations: every shore station, when it was last seen, its status, and a ⋯ menu (Info, which
 * lists the buoys it commands; Assign buoys; Change WiFi; Revoke). A revoked station shows a delete key instead.
 * Buoys' own state lives on Fleet. */
export function StationsBoard() {
  const { user } = useSession();
  const settings = useApi<BuoySettings>(api.settings);
  const devices = useApi<{ devices: Device[] }>(api.devices);
  const [adding, setAdding] = useState(false);
  const [assigning, setAssigning] = useState<Device | null>(null);
  const [info, setInfo] = useState<Device | null>(null);
  const [revoking, setRevoking] = useState<Device | null>(null);
  const [rewifi, setRewifi] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const allowed = can(user.role, "devices.write");
  const active = (devices.data?.devices ?? []).filter((device) => !device.revoked_at);
  usePoll(() => {
    settings.reload();
    devices.reload();
    setNow(Date.now());
  }, REFRESH_MS);

  function changed() {
    devices.reload();
    settings.reload();
  }

  function menuFor(device: Device): ActionMenuItem[] {
    const items: ActionMenuItem[] = [{ label: "Info", icon: "info", onSelect: () => setInfo(device) }];
    // Which buoys it commands is in Info; with two or more stations, Assign buoys changes it.
    if (canAssign) items.push({ label: "Assign buoys", icon: "connections", onSelect: () => setAssigning(device) });
    if (allowed) items.push({ label: "Change WiFi", icon: "sync", onSelect: () => setRewifi(device) });
    if (allowed) items.push({ label: "Revoke", icon: "close", danger: true, onSelect: () => setRevoking(device) });
    return items;
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
        {devices.data.devices.length === 0 ? (
          <EmptyState status="No stations" title="No shore stations yet">
            A shore station appears here when you make a token for it.
          </EmptyState>
        ) : (
          <div className="sc-table-wrap">
            <table className="sc-table sc-stations-table">
              <thead><tr><th scope="col">Station</th><th scope="col">Last seen</th>
                <th scope="col">Status</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {devices.data.devices.map((device) => (
                  <tr key={device.id}>
                    <th scope="row">{device.name}</th>
                    <td className="sc-stations-table__when"><Ago ms={device.last_seen_at} /></td>
                    <td>{device.revoked_at
                      ? <span className="sc-badge sc-badge--muted">Revoked</span>
                      : <span className="sc-row">
                        <SignalMeter {...freshness(device.last_seen_at, now, 2 * HOUR)} />
                        {wifiSetupPending(device, now) && <span className="sc-badge sc-badge--pending">WiFi setup open</span>}
                      </span>}</td>
                    <td className="sc-stations-table__actions">
                      {device.revoked_at ? (
                        <Key size="sm" iconOnly icon="trash" aria-label={`Delete ${device.name}`} disabled={!allowed}
                          title="Delete from the console" onClick={() => setDeleting(device)} />
                      ) : <ActionMenu label={`Actions for ${device.name}`} items={menuFor(device)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <StationInfoDialog device={info} commands={info ? routes.byStation.get(info.id) ?? [] : []} onlyStation={active.length === 1}
        onClose={() => setInfo(null)} />
      <WifiSetupDialog device={rewifi} onClose={() => setRewifi(null)} onDone={changed} />
      <RevokeDialog device={revoking} onClose={() => setRevoking(null)} onDone={changed} />
      <DeleteStationDialog device={deleting} onClose={() => setDeleting(null)} onDone={changed} />
    </>
  );
}
