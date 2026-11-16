"use client";

import type { ReactNode } from "react";
import { freshness } from "@/components/stations/stations-board";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy, BuoyHeatStress, BuoySettings, HeatStressView, Reading } from "@/lib/api/types";
import { buoyHealth, runningSettings, slotsInUse } from "@/lib/buoy-status";
import { delivery, durationLabel, issues, latestText, pointsFor, restarts, type Delivery, type Issue } from "@/lib/dashboard/metrics";
import { COUNT_SIGNAL, lastHeard } from "@/lib/format";
import { AlertChip } from "./heat-stress-bay";

const HOUR = 3600 * 1000;
// Only while the transmit slots have not loaded: a buoy heard within 9 hours has not missed a 3-a-day schedule.
const FALLBACK_LIVE_WITHIN_MS = 9 * HOUR;

interface HealthBayProps {
  buoys: Buoy[];
  readings: Record<number, Reading[]>;
  heat: HeatStressView | null | undefined;
  schedule?: BuoySettings | null;
  now: number;
}

interface BuoyHealthRow {
  buoy: Buoy;
  link: ReturnType<typeof freshness>;
  delivered: Delivery;
  battery: number | null;
  uptime: number | null;
  restarts: number;
  firmware: string | null;
  heat: BuoyHeatStress | undefined;
  issues: Issue[];
}

/** Live, Late or Silent against the buoy's own transmit slots (as Fleet), so a 1- or 2-a-day buoy
 * is not called late between its slots. */
function linkHealth(buoy: Buoy, props: HealthBayProps): ReturnType<typeof freshness> {
  if (!props.schedule) return freshness(lastHeard(buoy), props.now, FALLBACK_LIVE_WITHIN_MS);
  const running = runningSettings(buoy, props.schedule.firmware.remote);
  return buoyHealth(lastHeard(buoy), slotsInUse(props.schedule.firmware.slotsSod, running.tx_count, running.slot_phase_h), props.now);
}

function rowFor(buoy: Buoy, props: HealthBayProps): BuoyHealthRow {
  const rows = props.readings[buoy.buoy_id] ?? [];
  const battery = pointsFor(rows, "battery_v").at(-1)?.v ?? null;
  const uptime = pointsFor(rows, "uptime_s").at(-1)?.v ?? null;
  const link = buoy.disconnected_at ? { state: "off" as const, lit: 0, word: "Disconnected" } : linkHealth(buoy, props);
  return {
    buoy, link, battery, uptime,
    delivered: delivery(rows, buoy),
    restarts: restarts(rows),
    firmware: latestText(rows, "fw_version"),
    heat: props.heat?.buoys.find((b) => b.buoy_id === buoy.buoy_id),
    issues: issues(rows),
  };
}

function Kpi({ label, value, detail }: { label: string; value: string; detail?: ReactNode }) {
  return (
    <div className="sc-kpi">
      <span className="sc-tag">{label}</span>
      <span className="sc-kpi__value">{value}</span>
      {detail && <span className="sc-help">{detail}</span>}
    </div>
  );
}

function Kpis({ rows }: { rows: BuoyHealthRow[] }) {
  const live = rows.filter((r) => r.link.state === "ok").length;
  const received = rows.reduce((sum, r) => sum + r.delivered.received, 0);
  const expected = rows.reduce((sum, r) => sum + r.delivered.expected, 0);
  const powered = rows.filter((r) => r.battery !== null).sort((a, b) => (a.battery ?? 0) - (b.battery ?? 0));
  const heated = rows.filter((r) => r.heat?.current)
    .sort((a, b) => (b.heat?.current?.level ?? 0) - (a.heat?.current?.level ?? 0) || (b.heat?.current?.dhw ?? 0) - (a.heat?.current?.dhw ?? 0));
  const current = rows.flatMap((r) => r.issues.filter((i) => i.current));
  const commands = rows.filter((r) => r.buoy.state === "rejected" || r.buoy.settings_state === "rejected").length;
  const resets = rows.reduce((sum, r) => sum + r.restarts, 0);
  const worst = heated[0]?.heat?.current;
  return (
    <div className="sc-kpis">
      <Kpi label="Buoys live" value={`${live} of ${rows.length}`} detail={live === rows.length ? "All on schedule" : `${rows.length - live} late, silent or never heard`} />
      <Kpi label="Packets, 7 days" value={expected ? `${Math.round((Math.min(received, expected) / expected) * 100)} %` : "—"}
        detail={`${received} of ${expected} expected`} />
      <Kpi label="Lowest battery" value={powered.length ? `${powered[0].battery?.toFixed(2)} V` : "—"} detail={powered[0]?.buoy.label ?? "No battery readings"} />
      <Kpi label="Heat stress" value={worst ? `${worst.dhw.toFixed(1)} DHW` : "—"}
        detail={worst ? <><AlertChip alert={worst.alert} /> {heated[0].buoy.label}</> : "No MMM set or no data"} />
      <Kpi label="Active issues" value={String(current.length + commands)}
        detail={current.length + commands === 0 ? "None in the newest packets" : `${commands} command${commands === 1 ? "" : "s"} rejected · ${current.length} flag${current.length === 1 ? "" : "s"}`} />
      <Kpi label="Restarts, 7 days" value={String(resets)} detail="Uptime that went back to zero" />
    </div>
  );
}

function IssueList({ list }: { list: Issue[] }) {
  if (list.length === 0) return <span className="sc-help">None</span>;
  return (
    <span className="sc-issues">
      {list.map((i) => (
        <span key={i.code} className={`sc-badge sc-issue sc-issue--${i.tone}${i.current ? "" : " sc-issue--past"}`}
          title={`${i.code}: ${i.count} of the last 7 days' readings${i.current ? ", including the newest" : ""}`}>
          {i.label}{i.count > 1 ? ` ×${i.count}` : ""}
        </span>
      ))}
    </span>
  );
}

function StatusTable({ rows }: { rows: BuoyHealthRow[] }) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-health-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Link</th><th scope="col" className="n">Packets 7 d</th><th scope="col" className="n">Battery (V)</th>
            <th scope="col">Heat stress</th><th scope="col">Transmits a day</th><th scope="col">Settings</th><th scope="col">Firmware</th>
            <th scope="col">Uptime</th><th scope="col">Flags, 7 days</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.buoy.buoy_id}>
              <th scope="row">{r.buoy.label}</th>
              <td><SignalMeter {...r.link} /> <span className="sc-help"><Ago ms={lastHeard(r.buoy)} /></span></td>
              <td className="n">{r.delivered.received} / {r.delivered.expected}</td>
              <td className="n">{r.battery === null ? "—" : r.battery.toFixed(2)}</td>
              <td>{r.heat?.current ? <><AlertChip alert={r.heat.current.alert} /> <span className="sc-help">{r.heat.current.dhw.toFixed(1)} DHW</span></> : <span className="sc-help">—</span>}</td>
              <td>{r.buoy.tx_count_reported ?? "—"} <SignalMeter {...COUNT_SIGNAL[r.buoy.state]} /></td>
              <td><SignalMeter {...COUNT_SIGNAL[r.buoy.settings_state]} /></td>
              <td className="sc-mono">{r.firmware ?? "—"}</td>
              <td>{r.uptime === null ? "—" : durationLabel(r.uptime)}{r.restarts > 0 && <span className="sc-help"> · {r.restarts} restart{r.restarts === 1 ? "" : "s"}</span>}</td>
              <td><IssueList list={r.issues} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Fleet status, the top of the Overview: the fleet's headline numbers (live, packets delivered,
 * lowest battery, worst heat stress, active issues, restarts), then one row per buoy with its link,
 * delivery, power, heat stress, command and settings state, firmware, uptime and every flag the
 * week raised. Faded flags are past; solid ones are in the newest packet. */
export function HealthBay(props: HealthBayProps) {
  if (props.buoys.length === 0) return <p className="sc-help">No buoys yet. Add one on Fleet.</p>;
  const rows = props.buoys.map((buoy) => rowFor(buoy, props));
  return (
    <div className="sc-health">
      <Kpis rows={rows} />
      <StatusTable rows={rows} />
    </div>
  );
}
