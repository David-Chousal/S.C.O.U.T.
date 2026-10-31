"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter, type SignalState } from "@/components/status/signal-meter";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Device, Fleet } from "@/lib/api/types";
import { lastHeard, newestPacket } from "@/lib/format";

import { can, useSession } from "@/lib/session";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";

const HOUR = 3600 * 1000;

/** How recently something checked in, as a signal meter. Buoys answer up to 3 times a day, so a
 * gap under 9 h is normal; a full day is silence. Shore stations sync at least hourly. */
export function freshness(lastSeen: number | null, now: number, okWithinMs: number): { state: SignalState; lit: number; word: string } {
  if (!lastSeen) return { state: "off", lit: 0, word: "Never" };
  const age = now - lastSeen;
  if (age <= okWithinMs) return { state: "ok", lit: 4, word: "Live" };
  if (age <= 24 * HOUR) return { state: "stale", lit: 2, word: "Stale" };
  return { state: "failed", lit: 1, word: "Silent" };
}

function NewToken({ onCreated, allowed }: { onCreated: (name: string, token: string) => void; allowed: boolean }) {
  const { show } = useToast();
  const [name, setName] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await api.createDevice(name.trim());
      onCreated(result.name, result.token);
      setName("");
    } catch (failure) {
      show({ tone: "failed", title: "No token created", detail: failure instanceof Error ? failure.message : undefined });
    }
  }
  return (
    <form className="sc-settings-form" onSubmit={onSubmit}>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Shore station name</span></span>
        <input className="sc-input" maxLength={60} required placeholder="Kaneohe shore" value={name} disabled={!allowed}
          onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="sc-settings-form__foot"><Key type="submit" icon="plus" disabled={!allowed}>Create token</Key></div>
    </form>
  );
}

/** Stations: when each buoy and each shore station was last heard from, and the shore's tokens. */
export function StationsBoard() {
  const when = useWhen();
  const { user } = useSession();
  const { show } = useToast();
  const fleet = useApi<Fleet>(api.fleet);
  const devices = useApi<{ devices: Device[] }>(api.devices);
  const [created, setCreated] = useState<{ name: string; token: string } | null>(null);
  const [now] = useState(() => Date.now());
  const allowed = can(user.role, "devices.write");

  async function revoke(device: Device) {
    try {
      await api.revokeDevice(device.id);
      show({ tone: "ok", title: `Revoked ${device.name}'s token`, detail: "It can no longer push readings or read settings." });
      devices.reload();
    } catch (failure) {
      show({ tone: "failed", title: "Not revoked", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  const error = fleet.error || devices.error;
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!fleet.data || !devices.data) return <span className="sc-tag" aria-busy="true">Loading stations…</span>;

  return (
    <>
      <section className="sc-bay" aria-labelledby="buoys-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="buoys-title">Buoys</h2><span className="sc-tag">Last packet the shore pushed</span></div>
        {fleet.data.buoys.length === 0 ? <p className="sc-help">No buoy has reported yet.</p> : (
          <div className="sc-list">
            {fleet.data.buoys.map((buoy) => {
              const signal = freshness(lastHeard(buoy), now, 9 * HOUR);
              return (
                <div key={buoy.buoy_id} className="sc-list__row">
                  <span className="sc-list__main"><strong>{buoy.label}</strong><span>{newestPacket(buoy, when)} · {buoy.tx_count_reported ?? "—"} a day</span></span>
                  <span className="sc-list__end"><SignalMeter {...signal} /></span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="sc-bay" aria-labelledby="shore-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="shore-title">Shore stations</h2><span className="sc-tag">Device tokens</span></div>
        <p className="sc-help">A shore station uses its token (SCOUT_CONSOLE_TOKEN) to push readings and pull the requested transmit counts.
          The buoys&rsquo; radio command keys stay on the shore station and never come here.</p>
        {!allowed && <Banner tone="info" icon="lock">View only: creating and revoking tokens needs the admin role.</Banner>}
        {created && (
          <Banner tone="info" icon="lock" action={<Key size="sm" onClick={() => setCreated(null)}>Done</Key>}>
            <strong>Token for {created.name}</strong>: copy it now; it is shown only once.
            <code className="sc-secret">{created.token}</code>
          </Banner>
        )}
        <div className="sc-list">
          {devices.data.devices.length === 0 && <p className="sc-help">No shore stations yet.</p>}
          {devices.data.devices.map((device) => (
            <div key={device.id} className="sc-list__row">
              <span className="sc-list__main"><strong>{device.name}</strong><span>created {when(device.created_at)} · last seen {when(device.last_seen_at)}</span></span>
              <span className="sc-list__end">
                {device.revoked_at ? <span className="sc-badge sc-badge--muted">Revoked {when(device.revoked_at)}</span> : (
                  <>
                    <SignalMeter {...freshness(device.last_seen_at, now, 2 * HOUR)} />
                    <HoldKey size="sm" label="Hold to revoke" holdLabel={`Hold to revoke ${device.name}'s token`} disabled={!allowed} onConfirm={() => revoke(device)} />
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <NewToken allowed={allowed} onCreated={(name, token) => { setCreated({ name, token }); devices.reload(); }} />
      </section>
    </>
  );
}
