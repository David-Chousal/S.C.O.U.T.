"use client";

import { useState } from "react";
import { Dialog } from "@/components/overlays/dialog";
import type { Buoy, Reading } from "@/lib/api/types";
import { fixed, senLine, usablePoints, type MetricAnalysis } from "@/lib/dashboard/analysis";
import type { Point } from "@/lib/dashboard/metrics";
import { expectedReadings, signed } from "@/lib/dashboard/metrics";
import { startFor, type TimeWindow } from "@/lib/dashboard/range";
import type { QcTest } from "@/lib/dashboard/qc";
import { completeness, daysTo, dielMeans } from "@/lib/dashboard/stats";
import { VARIABLES, variableLabel } from "@/lib/variables";
import { padded, Plot, timeTicks, type Scale } from "./plot";
import { seriesColor } from "./trace-bay";

const DAY_MS = 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;

export interface BuoyAnalysis { buoy: Pick<Buoy, "buoy_id" | "label" | "tx_count_reported">; index: number; analysis: MetricAnalysis }

interface MetricDetailProps {
  column: string;
  rows: BuoyAnalysis[];
  window: TimeWindow;
  /** Every buoy's rows, for when each one's own window starts. */
  readings: Record<number, Reading[]>;
  onClose: () => void;
}

const QC_TESTS: { test: QcTest; what: string }[] = [
  { test: "Sensor range", what: "Outside what the sensor can report: Fail, left out of the statistics." },
  { test: "Site range", what: "Possible for the sensor, unlikely at this site: Suspect." },
  { test: "Spike", what: "Far from both neighbours at once (QARTOD's spike reference): Suspect." },
  { test: "Rate of change", what: "A step between neighbouring readings over 3 SD of the week's values: Suspect." },
  { test: "Flat line", what: "The same value six readings running, as a stuck sensor reads: Suspect." },
  { test: "Clipped recording", what: "Over 100 samples of the recording hit full scale, which biases the acoustic values: Suspect." },
];

/** The value range of every buoy's points that did not fail QC, padded, plus nearby references. */
function valueDomain(rows: BuoyAnalysis[], form: string): [number, number] {
  const usable = rows.flatMap(({ analysis }) => usablePoints(analysis).map((p) => p.v));
  // When every reading failed QC, scale to the failed readings so they stay visible.
  const values = usable.length ? usable : rows.flatMap(({ analysis }) => analysis.points.map((p) => p.v));
  const [lo, hi] = values.length ? padded([Math.min(...values), Math.max(...values)]) : [0, 1];
  const span = hi - lo;
  const refs = (rows[0]?.analysis.profile.references ?? []).map((r) => r.value).filter((v) => v >= lo - span * 0.3 && v <= hi + span * 0.3);
  return [Math.min(lo, ...refs, form === "bars" ? 0 : lo), Math.max(hi, ...refs)];
}

const nearest = (points: Point[], t: number) => points.reduce((best, p, i) => (Math.abs(p.t - t) < Math.abs(points[best].t - t) ? i : best), 0);
const when = (t: number) => `${new Date(t).toISOString().slice(5, 16).replace("T", " ")} UTC`;

function Marks({ rows, scale, form, domain }: { rows: BuoyAnalysis[]; scale: Scale; form: string; domain: [number, number] }) {
  const { x, y } = scale;
  const clamp = (v: number) => Math.min(domain[1], Math.max(domain[0], v));
  return (
    <>
      {rows.map(({ buoy, index, analysis }) => {
        const color = seriesColor(index);
        const offset = (index - (rows.length - 1) / 2) * 3;
        const sen = analysis.trend.direction === "rising" || analysis.trend.direction === "falling" ? senLine(usablePoints(analysis), analysis.trend.slopePerDay) : null;
        return (
          <g key={buoy.buoy_id}>
            {form === "bars"
              ? analysis.points.map((p) => <line key={p.t} className="sc-detail__stem" x1={x(p.t) + offset} x2={x(p.t) + offset} y1={y(Math.max(0, domain[0]))} y2={y(clamp(p.v))} style={{ stroke: color }} />)
              : <path className="sc-trace__line" style={{ stroke: color }}
                d={analysis.points.map((p, i) => `${i === 0 || p.t - analysis.points[i - 1].t > 26 * HOUR_MS ? "M" : "L"}${x(p.t).toFixed(1)},${y(clamp(p.v)).toFixed(1)}`).join("")} />}
            {sen && <line className="sc-detail__sen" x1={x(sen.from.t)} x2={x(sen.to.t)} y1={y(clamp(sen.from.v))} y2={y(clamp(sen.to.v))} style={{ stroke: color }} />}
            {analysis.points.map((p, i) => {
              const code = analysis.qc.flags[i].code;
              if (code === 1) return null;
              return <circle key={p.t} className={`sc-detail__flag sc-detail__flag--${code === 4 ? "fail" : "suspect"}`} cx={x(p.t) + offset} cy={y(clamp(p.v))} r={5} />;
            })}
          </g>
        );
      })}
    </>
  );
}

function TimeChart({ rows, window, column }: { rows: BuoyAnalysis[]; window: TimeWindow; column: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const profile = rows[0].analysis.profile;
  const domain = valueDomain(rows, profile.form);
  const unit = VARIABLES[column]?.unit ?? "";
  const digits = Math.max(...rows.map((r) => r.analysis.digits));
  const [t0, now] = [window.from, window.now];
  const ticks = timeTicks(t0, now);
  return (
    <div className="sc-detail__chart">
      <Plot height={240} xDomain={[t0, now]} yDomain={domain} xTicks={ticks} yDigits={digits} onHover={setHover}
        ariaLabel={`${variableLabel(column)}, ${window.phrase}, every buoy on one scale`}>
        {(scale) => (
          <>
            {(profile.references ?? []).filter((r) => r.value >= domain[0] && r.value <= domain[1]).map((r) => (
              <g key={r.label} className="sc-detail__ref">
                <line x1={scale.x(t0)} x2={scale.x(now)} y1={scale.y(r.value)} y2={scale.y(r.value)} />
                <text x={scale.x(t0) + 4} y={scale.y(r.value) - 4}>{r.label}</text>
              </g>
            ))}
            <Marks rows={rows} scale={scale} form={profile.form} domain={domain} />
            {hover !== null && <line className="sc-trace__cross" x1={scale.x(hover)} x2={scale.x(hover)} y1={10} y2={scale.height - 24} />}
          </>
        )}
      </Plot>
      {hover !== null && (
        <div className="sc-detail__tip" role="status">
          {rows.map(({ buoy, analysis }) => {
            const i = nearest(analysis.points, hover);
            const flag = analysis.qc.flags[i];
            return <div key={buoy.buoy_id}><b>{buoy.label}</b> {analysis.points[i].v.toFixed(analysis.digits)} {unit} · {when(analysis.points[i].t)}
              {flag.code !== 1 && ` · ${flag.code === 4 ? "Fail" : "Suspect"}: ${flag.tests.join(", ")}`}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function DielChart({ rows, column, phrase }: { rows: BuoyAnalysis[]; column: string; phrase: string }) {
  const domain = valueDomain(rows, rows[0].analysis.profile.form);
  const digits = Math.max(...rows.map((r) => r.analysis.digits));
  const hourOf = (t: number) => (t % DAY_MS) / HOUR_MS;
  const ticks = [0, 6, 12, 18, 24].map((h) => ({ value: h, label: `${String(h).padStart(2, "0")}:00` }));
  const clamp = (v: number) => Math.min(domain[1], Math.max(domain[0], v));
  return (
    <Plot height={200} xDomain={[0, 24]} yDomain={domain} xTicks={ticks} yDigits={digits}
      ariaLabel={`${variableLabel(column)} by hour of day (UTC), every reading of the ${phrase}`}>
      {({ x, y }) => rows.map(({ buoy, index, analysis }) => {
        const usable = analysis.points.filter((_, i) => analysis.qc.flags[i].code !== 4);
        const means = dielMeans(usable);
        return (
          <g key={buoy.buoy_id} style={{ color: seriesColor(index) }}>
            {usable.map((p) => <circle key={p.t} className="sc-detail__dot" cx={x(hourOf(p.t))} cy={y(clamp(p.v))} r={3} />)}
            {means.length > 1 && <path className="sc-detail__diel" d={means.map((m, i) => `${i ? "L" : "M"}${x(m.hour + 0.5).toFixed(1)},${y(clamp(m.mean)).toFixed(1)}`).join("")} />}
          </g>
        );
      })}
    </Plot>
  );
}

function trendText({ analysis }: BuoyAnalysis, unit: string): string {
  const { trend: t, digits } = analysis;
  if (t.direction === "too few") return `Too few ${t.basis === "daily medians" ? "days" : "readings"} for a trend (needs 8)`;
  const rate = `${signed(t.slopePerDay, digits + 1)} ${unit}/day`;
  const p = t.p < 0.001 ? "p < 0.001" : `p = ${t.p.toFixed(t.direction === "steady" ? 2 : 3)}`;
  const verdict = t.direction === "steady" ? `No clear trend (${rate}, ${p})` : `${t.direction === "rising" ? "Rising" : "Falling"} ${rate} (${p})`;
  return `${verdict} · on ${t.basis === "daily medians" ? "daily medians" : "each transmit hour"}`;
}

function StatsTable({ rows, column, window, readings }: { rows: BuoyAnalysis[]; column: string; window: TimeWindow; readings: Record<number, Reading[]> }) {
  const unit = VARIABLES[column]?.unit ?? "";
  const floor = column === "battery_v" ? 3.1 : null;
  return (
    <div className="sc-table-wrap">
      <table className="sc-table">
        <thead>
          <tr><th scope="col">Buoy</th><th scope="col" className="n">Readings</th><th scope="col" className="n">Median</th><th scope="col" className="n">IQR</th>
            <th scope="col" className="n">Min – max</th><th scope="col">Trend (Theil–Sen, Mann–Kendall)</th><th scope="col" className="n">QC pass / suspect / fail</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { buoy, analysis: a } = row;
            const expected = expectedReadings(buoy.tx_count_reported, startFor(window, readings[buoy.buoy_id] ?? []), window.now);
            const left = floor === null ? null : daysTo(floor, a.stats.latest.v, a.trend);
            return (
              <tr key={buoy.buoy_id}>
                <th scope="row">{buoy.label}</th>
                <td className="n">{a.stats.count} of {expected} ({Math.round(completeness(a.stats.count, expected) * 100)} %)</td>
                <td className="n">{a.spread ? a.spread.median.toFixed(a.digits) : "—"}</td>
                <td className="n">{a.spread ? `${a.spread.q1.toFixed(a.digits)} to ${a.spread.q3.toFixed(a.digits)}` : "no usable readings"}</td>
                <td className="n">{a.stats.min === null ? "—" : `${fixed(a.stats.min, a.digits)} to ${fixed(a.stats.max, a.digits)}`}</td>
                <td>{trendText(row, unit)}{left !== null && <span className="sc-help"> · about {Math.round(left)} days to the 3.1 V critical level at this rate (estimate)</span>}</td>
                <td className="n">{a.qc.pass} / {a.qc.suspect} / {a.qc.fail}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QcTable({ rows }: { rows: BuoyAnalysis[] }) {
  const tests = QC_TESTS.filter(({ test }) => test !== "Clipped recording" || rows[0].analysis.profile.clipAware);
  return (
    <div className="sc-table-wrap">
      <table className="sc-table">
        <thead><tr><th scope="col">Test</th>{rows.map(({ buoy }) => <th key={buoy.buoy_id} scope="col" className="n">{buoy.label}</th>)}<th scope="col">What it catches</th></tr></thead>
        <tbody>
          {tests.map(({ test, what }) => (
            <tr key={test}>
              <th scope="row">{test}</th>
              {rows.map(({ buoy, analysis }) => <td key={buoy.buoy_id} className="n">{analysis.qc.byTest[test] ?? 0}</td>)}
              <td className="sc-help">{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Details on demand for one metric: every buoy on one common scale with QC flags, Sen trend
 * lines and reference levels; the daily cycle by hour of day; robust statistics; and which
 * quality tests flagged what. */
export function MetricDetail({ column, rows, window, readings, onClose }: MetricDetailProps) {
  const unit = VARIABLES[column]?.unit ?? "";
  const profile = rows[0].analysis.profile;
  return (
    <Dialog open wide title={`${variableLabel(column)}${unit ? ` (${unit})` : ""}`} onClose={onClose}>
      {profile.read && <p className="sc-help">{profile.read}</p>}
      {rows.length > 1 && (
        <ul className="sc-legend" aria-label="Buoys">
          {rows.map(({ buoy, index }) => <li key={buoy.buoy_id}><i style={{ background: seriesColor(index) }} />{buoy.label}</li>)}
        </ul>
      )}
      <section className="sc-detail__section" aria-label="Over time">
        <h3 className="sc-tag">{window.phrase} · every buoy on one scale</h3>
        <TimeChart rows={rows} window={window} column={column} />
        <p className="sc-help">Hollow amber rings mark suspect points and solid red rings failed ones (hover for the test). Dashed lines are each buoy&apos;s Theil–Sen trend, drawn only where Mann–Kendall finds it significant (p &lt; 0.05).</p>
      </section>
      <section className="sc-detail__section" aria-label="Daily cycle">
        <h3 className="sc-tag">Daily cycle · every reading by hour of day (UTC)</h3>
        <DielChart rows={rows} column={column} phrase={window.phrase} />
        <p className="sc-help">The line joins each hour&apos;s mean. With 1–3 transmits a day the radio data shows only those hours; SD-card imports fill in the rest.</p>
      </section>
      <section className="sc-detail__section" aria-label="Statistics">
        <h3 className="sc-tag">Statistics · values that passed or were suspect</h3>
        <StatsTable rows={rows} column={column} window={window} readings={readings} />
      </section>
      <section className="sc-detail__section" aria-label="Quality control">
        <h3 className="sc-tag">Quality control · after IOOS QARTOD</h3>
        <QcTable rows={rows} />
      </section>
    </Dialog>
  );
}
