"use client";

import { useState } from "react";
import { Ago } from "@/components/ui/ago";
import type { Buoy, Reading } from "@/lib/api/types";
import { analyse } from "@/lib/dashboard/analysis";
import { METRIC_GROUPS, signed } from "@/lib/dashboard/metrics";
import { qcLabel, type QcResult } from "@/lib/dashboard/qc";
import type { TimeWindow } from "@/lib/dashboard/range";
import { loadTileOrder, saveTileOrder, type TileOrder } from "@/lib/dashboard/tile-order";
import { loadTileSizes, saveTileSizes, withTileSize, type TileSize, type TileSizes } from "@/lib/dashboard/tile-sizes";
import type { Trend } from "@/lib/dashboard/stats";
import { VARIABLES, variableLabel } from "@/lib/variables";
import { MetricDetail, type BuoyAnalysis } from "./metric-detail";
import { HousingTile } from "./housing-tile";
import { Sparkline } from "./sparkline";
import { MetricGroup, type GroupTile } from "./metric-group";
import { useTileColumns } from "./tile-frame";
import { seriesColor } from "./trace-bay";

type BayBuoy = Pick<Buoy, "buoy_id" | "label" | "tx_count_reported">;

const HOUSING_GROUP = "Power and housing";
const HOUSING_SEAL = "housing-seal";

interface MetricsBayProps {
  buoys: BayBuoy[];
  readings: Record<number, Reading[]>;
  window: TimeWindow;
}

/** Each buoy's analysis of one column, keeping the buoy's fleet position for its colour. */
function analyses(props: MetricsBayProps, column: string): BuoyAnalysis[] {
  return props.buoys.flatMap((buoy, index) => {
    const analysis = analyse(props.readings[buoy.buoy_id] ?? [], column);
    return analysis ? [{ buoy, index, analysis }] : [];
  });
}

/** The tile's shared value scale: every buoy's values that did not fail QC. */
function tileDomain(rows: BuoyAnalysis[]): [number, number] {
  const values = rows.flatMap(({ analysis }) => analysis.points.filter((_, i) => analysis.qc.flags[i].code !== 4).map((p) => p.v));
  return values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];
}

const ARROW: Record<Trend["direction"], string> = { rising: "▲ Rising", falling: "▼ Falling", steady: "→ No clear trend", "too few": "Too few for a trend" };

function TrendLine({ trend, digits, unit }: { trend: Trend; digits: number; unit: string }) {
  const rate = trend.direction === "rising" || trend.direction === "falling" ? ` ${signed(trend.slopePerDay, digits + 1)} ${unit}/day` : "";
  return <span className="sc-metric__trend" title={`Theil–Sen slope; Mann–Kendall p < 0.05 on ${trend.basis === "daily medians" ? "daily medians" : "each transmit hour"}`}>{ARROW[trend.direction]}{rate}</span>;
}

const QC_MARK = { ok: "✓", caution: "!", failed: "✕" } as const;

/** QC in a word and a mark, light enough to sit beside the title. */
function QcStatus({ qc }: { qc: Pick<QcResult, "suspect" | "fail"> }) {
  const tone = qc.fail ? "failed" : qc.suspect ? "caution" : "ok";
  return (
    <span className={`sc-qc sc-qc--${tone}`} title="Automated quality control after IOOS QARTOD">
      <i aria-hidden="true">{QC_MARK[tone]}</i>{qcLabel(qc)}
    </span>
  );
}

function Tile({ column, rows, multi, window, onOpen }: { column: string; rows: BuoyAnalysis[]; multi: boolean; window: TimeWindow; onOpen: () => void }) {
  const unit = VARIABLES[column]?.unit ?? "";
  const domain = tileDomain(rows);
  const total = rows.reduce((sum, r) => ({ suspect: sum.suspect + r.analysis.qc.suspect, fail: sum.fail + r.analysis.qc.fail }), { suspect: 0, fail: 0 });
  return (
    <article className="sc-metric" aria-label={variableLabel(column)}>
      <header className="sc-metric__head">
        <button type="button" className="sc-metric__open" onClick={onOpen} aria-label={`Open the ${variableLabel(column).toLowerCase()} analysis`}>
          <span className="sc-metric__name">{rows[0].analysis.profile.title ?? variableLabel(column)}</span>
          {unit && <span className="sc-metric__unit">{unit}</span>}
        </button>
        <QcStatus qc={total} />
      </header>
      {rows.map(({ buoy, index, analysis: a }) => (
        <div key={buoy.buoy_id} className="sc-metric__row">
          {multi && <span className="sc-metric__buoy"><i style={{ background: seriesColor(index) }} />{buoy.label}</span>}
          <span className="sc-metric__figure">
            <span className="sc-metric__value">{a.stats.latest.v.toFixed(a.digits)}</span>
            <span className="sc-metric__change" title="Change from the reading closest to 24 h earlier">
              {a.stats.change === null ? "no reading 24 h ago" : `${signed(a.stats.change, a.digits)} in 24 h`}
            </span>
          </span>
          <Sparkline points={a.points} from={window.from} to={window.now} color={seriesColor(index)} unit={unit} digits={a.digits}
            domain={domain} form={a.profile.form} band={[a.spread.q1, a.spread.q3]} flags={a.qc.flags} references={a.profile.references}
            label={`${variableLabel(column)}${multi ? ` · ${buoy.label}` : ""}`} phrase={window.phrase} />
          <span className="sc-metric__range">
            median {a.spread.median.toFixed(a.digits)} · IQR {a.spread.q1.toFixed(a.digits)} to {a.spread.q3.toFixed(a.digits)} · <Ago ms={a.stats.latest.t} />
          </span>
          <TrendLine trend={a.trend} digits={a.digits} unit={unit} />
        </div>
      ))}
    </article>
  );
}

function StatsTable({ shown }: { shown: { column: string; rows: BuoyAnalysis[] }[] }) {
  return (
    <details>
      <summary className="sc-help">Show every metric as a table</summary>
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th scope="col">Metric</th><th scope="col">Buoy</th><th scope="col" className="n">Latest</th><th scope="col" className="n">24 h change</th>
              <th scope="col" className="n">Median</th><th scope="col" className="n">IQR</th><th scope="col" className="n">Min – max</th>
              <th scope="col" className="n">Trend /day</th><th scope="col" className="n">Readings</th><th scope="col">QC</th></tr>
          </thead>
          <tbody>
            {shown.flatMap(({ column, rows }) => rows.map(({ buoy, analysis: a }) => (
              <tr key={`${column}-${buoy.buoy_id}`}>
                <th scope="row">{variableLabel(column)}{VARIABLES[column]?.unit ? ` (${VARIABLES[column].unit})` : ""}</th>
                <td>{buoy.label}</td>
                <td className="n">{a.stats.latest.v.toFixed(a.digits)}</td>
                <td className="n">{a.stats.change === null ? "—" : signed(a.stats.change, a.digits)}</td>
                <td className="n">{a.spread.median.toFixed(a.digits)}</td>
                <td className="n">{a.spread.q1.toFixed(a.digits)} to {a.spread.q3.toFixed(a.digits)}</td>
                <td className="n">{a.stats.min.toFixed(a.digits)} to {a.stats.max.toFixed(a.digits)}</td>
                <td className="n">{a.trend.direction === "rising" || a.trend.direction === "falling" ? signed(a.trend.slopePerDay, a.digits + 1) : a.trend.direction === "steady" ? "no trend" : "—"}</td>
                <td className="n">{a.stats.count}</td>
                <td>{qcLabel(a.qc)}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Every measured number, grouped (water, soundscape, power and housing). Each tile shows every
 * buoy's newest value, 24 h change, a sparkline over the chosen range on a shared time and value scale with the
 * IQR as a band and QC-flagged points marked, the median and IQR, and a robust trend. A tile
 * opens the metric's full analysis; its grip moves it within its section. Metrics with nothing in the window are named, not hidden. */
export function MetricsBay(props: MetricsBayProps) {
  const [open, setOpen] = useState<string | null>(null);
  // The bay renders only after readings load in the browser, so storage is there on first render.
  const [sizes, setSizes] = useState<TileSizes>(loadTileSizes);
  const [columns, rootRef] = useTileColumns();
  const resize = (key: string) => (size: TileSize | null) => setSizes((current) => {
    const next = withTileSize(current, key, size);
    saveTileSizes(next);
    return next;
  });
  const [order, setOrder] = useState<TileOrder>(loadTileOrder);
  const reorder = (group: string, keys: string[]) => setOrder((current) => {
    const next = { ...current, [group]: keys };
    saveTileOrder(next);
    return next;
  });
  const multi = props.buoys.length > 1;
  const groups = METRIC_GROUPS.map((group) => ({
    name: group.name,
    metrics: group.columns.map((column) => ({ column, rows: analyses(props, column) })),
  }));
  const shown = groups.flatMap((g) => g.metrics.filter((m) => m.rows.length > 0));
  const missing = groups.flatMap((g) => g.metrics.filter((m) => m.rows.length === 0).map((m) => variableLabel(m.column)));
  const opened = shown.find((m) => m.column === open);
  if (props.buoys.length === 0) return <p className="sc-help">No buoys yet.</p>;
  if (shown.length === 0) return <p className="sc-help">No readings in this time range.</p>;
  return (
    <div className="sc-metrics" ref={rootRef}>
      <div className="sc-metrics__key">
        {multi && (
          <ul className="sc-legend" aria-label="Buoys">
            {props.buoys.map((b, i) => <li key={b.buoy_id}><i style={{ background: seriesColor(i) }} />{b.label}</li>)}
          </ul>
        )}
        <span className="sc-help">Shaded band: the range&apos;s middle 50 % (IQR). <i className="sc-key-mark sc-key-mark--suspect" /> suspect, <i className="sc-key-mark sc-key-mark--fail" /> failed QC. Choose a metric&apos;s name for its full analysis.</span>
      </div>
      {groups.map((group) => {
        const tiles: GroupTile[] = group.metrics.filter((m) => m.rows.length > 0).map((m) => ({
          key: m.column, name: variableLabel(m.column),
          node: <Tile column={m.column} rows={m.rows} multi={multi} window={props.window} onOpen={() => setOpen(m.column)} />,
        }));
        // The housing seal comes from packet flags, so it shows even when the %RH value never arrives.
        if (group.name === HOUSING_GROUP) tiles.push({ key: HOUSING_SEAL, name: "Housing seal", node: <HousingTile buoys={props.buoys} readings={props.readings} multi={multi} /> });
        if (tiles.length === 0) return null;
        return (
          <MetricGroup key={group.name} name={group.name} tiles={tiles} saved={order[group.name]} sizes={sizes} columns={columns}
            onOrder={(keys) => reorder(group.name, keys)} onSize={resize} />
        );
      })}
      {missing.length > 0 && (
        <p className="sc-help">No data in this time range: {missing.join(", ")}. Blank columns are not measured on the radio link
          (the housing temperature and humidity values stay on the SD card, and Housing seal shows their alarm instead;
          turbidity is not yet calibrated to FAU) or had no recording.</p>
      )}
      <StatsTable shown={shown} />
      {opened && <MetricDetail column={opened.column} rows={opened.rows} window={props.window} readings={props.readings} onClose={() => setOpen(null)} />}
    </div>
  );
}
