"use client";

import type { ReactNode } from "react";
import { freshness } from "@/components/stations/stations-board";
import type { SignalState } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy, BuoyHeatStress, BuoySettings, HeatStressView, Reading } from "@/lib/api/types";
import { buoyHealth, runningSettings, slotsInUse } from "@/lib/buoy-status";
import { startFor, type TimeWindow } from "@/lib/dashboard/range";
import { delivery, durationLabel, issues, latestText, pointsFor, restarts, type Delivery, type Issue } from "@/lib/dashboard/metrics";
import { COUNT_SIGNAL, lastHeard } from "@/lib/format";
import { AlertChip, alertSlug } from "./heat-stress-bay";

const HOUR = 3600 * 1000;
// Only while the transmit slots have not loaded: a buoy heard within 9 hours has not missed a 3-a-day schedule.
const FALLBACK_LIVE_WITHIN_MS = 9 * HOUR;

interface HealthBayProps {
  buoys: Buoy[];
  readings: Record<number, Reading[]>;
  heat: HeatStressView | null | undefined;
  schedule?: BuoySettings | null;
  window: TimeWindow;
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
  if (!props.schedule) return freshness(lastHeard(buoy), props.window.now, FALLBACK_LIVE_WITHIN_MS);
  const running = runningSettings(buoy, props.schedule.firmware.remote);
  return buoyHealth(lastHeard(buoy), slotsInUse(props.schedule.firmware.slotsSod, running.tx_count, running.slot_phase_h), props.window.now);
}

function rowFor(buoy: Buoy, props: HealthBayProps): BuoyHealthRow {
  const rows = props.readings[buoy.buoy_id] ?? [];
  const battery = pointsFor(rows, "battery_v").at(-1)?.v ?? null;
  const uptime = pointsFor(rows, "uptime_s").at(-1)?.v ?? null;
  const link = buoy.disconnected_at ? { state: "off" as const, lit: 0, word: "Disconnected" } : linkHealth(buoy, props);
  return {
    buoy, link, battery, uptime,
    delivered: delivery(rows, buoy, startFor(props.window, rows), props.window.now),
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

function Kpis({ rows, phrase }: { rows: BuoyHealthRow[]; phrase: string }) {
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
      <Kpi label={`Packets · ${phrase}`} value={expected ? `${Math.round((Math.min(received, expected) / expected) * 100)} %` : "—"}
        detail={`${received} of ${expected} expected`} />
      <Kpi label="Lowest battery" value={powered.length ? `${powered[0].battery?.toFixed(2)} V` : "—"} detail={powered[0]?.buoy.label ?? "No battery readings"} />
      <Kpi label="Heat stress" value={worst ? `${worst.dhw.toFixed(1)} DHW` : "—"}
        detail={worst ? <><AlertChip alert={worst.alert} /> {heated[0].buoy.label}</> : "No MMM set or no data"} />
      <Kpi label="Active issues" value={String(current.length + commands)}
        detail={current.length + commands === 0 ? "None in the newest packets" : `${commands} command${commands === 1 ? "" : "s"} rejected · ${current.length} flag${current.length === 1 ? "" : "s"}`} />
      <Kpi label={`Restarts · ${phrase}`} value={String(resets)} detail="Uptime that went back to zero" />
    </div>
  );
}

function IssueList({ list }: { list: Issue[] }) {
  if (list.length === 0) return <span className="sc-help">—</span>;
  return (
    <span className="sc-issues">
      {list.map((i) => (
        <span key={i.code} className={`sc-badge sc-issue sc-issue--${i.tone}${i.current ? "" : " sc-issue--past"}`}
          title={`${i.code}: in ${i.count} of the readings in range${i.current ? ", including the newest" : ""}`}>
          {i.label}{i.count > 1 ? ` ×${i.count}` : ""}
        </span>
      ))}
    </span>
  );
}

/** A status word with a small coloured dot: the word carries the meaning, the dot lets the eye scan. */
function Status({ state, word }: { state: SignalState; word: string }) {
  return <span className={`sc-status sc-status--${state}`}><i aria-hidden="true" />{word}</span>;
}

/** The buoy's command and settings state, but only when something needs attention (pending or rejected). */
function scheduleNote(buoy: Buoy): { state: SignalState; word: string } | null {
  const command = COUNT_SIGNAL[buoy.state];
  const settings = COUNT_SIGNAL[buoy.settings_state];
  if (command.state === "failed") return { state: "failed", word: "Command rejected" };
  if (settings.state === "failed") return { state: "failed", word: "Settings rejected" };
  if (command.state !== "ok" || settings.state !== "ok") return { state: "stale", word: "Pending" };
  return null;
}

function BuoyCell({ row }: { row: BuoyHealthRow }) {
  const details = [
    row.firmware && `v${row.firmware}`,
    row.uptime !== null && `up ${durationLabel(row.uptime)}`,
    row.restarts > 0 && `${row.restarts} restart${row.restarts === 1 ? "" : "s"}`,
  ].filter(Boolean).join(" · ");
  return (
    <th scope="row">
      <span className="sc-health-table__name">{row.buoy.label}</span>
      {details && <span className="sc-health-table__sub">{details}</span>}
    </th>
  );
}

function StatusTable({ rows }: { rows: BuoyHealthRow[] }) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-health-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Last heard</th><th scope="col" className="n">Packets</th>
            <th scope="col">Heat stress</th><th scope="col">Schedule</th><th scope="col">Flags in range</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const note = scheduleNote(r.buoy);
            const heat = r.heat?.current;
            return (
              <tr key={r.buoy.buoy_id}>
                <BuoyCell row={r} />
                <td><span className="sc-cell-row"><Status state={r.link.state} word={r.link.word} /><span className="sc-help"><Ago ms={lastHeard(r.buoy)} /></span></span></td>
                <td className="n">{r.delivered.received}<span className="sc-help"> / {r.delivered.expected}</span></td>
                <td>{heat
                  ? <span className="sc-heat-cell"><i className={`sc-heat-cell__swatch sc-alert-chip--${alertSlug(heat.alert)}`} aria-hidden="true" />{heat.alert} <span className="sc-help">{heat.dhw.toFixed(1)} DHW</span></span>
                  : <span className="sc-help">—</span>}</td>
                <td><span className="sc-cell-row">{r.buoy.tx_count_reported ?? "—"} a day{note && <Status {...note} />}</span></td>
                <td><IssueList list={r.issues} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Fleet status, the top of the Overview: the fleet's headline numbers (live, packets delivered,
 * lowest battery, worst heat stress, active issues, restarts), then one row per buoy: when it was last
 * heard, delivery, heat stress, its schedule (with a note only when a command or settings
 * change is pending or rejected) and every flag in range, with firmware and uptime under the name.
 * Faded flags are past; solid ones are in the newest packet. */
export function HealthBay(props: HealthBayProps) {
  if (props.buoys.length === 0) return <p className="sc-help">No buoys yet. Add one on Fleet.</p>;
  const rows = props.buoys.map((buoy) => rowFor(buoy, props));
  return (
    <div className="sc-health">
      <Kpis rows={rows} phrase={props.window.phrase} />
      <StatusTable rows={rows} />
    </div>
  );
}
