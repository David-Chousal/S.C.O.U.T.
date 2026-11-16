"use client";

import { Ago } from "@/components/ui/ago";
import type { Buoy, Reading } from "@/lib/api/types";
import { digitsFor, METRIC_GROUPS, metricStats, pointsFor, signed, WINDOW_DAYS, type MetricStats, type Point } from "@/lib/dashboard/metrics";
import { VARIABLES, variableLabel } from "@/lib/variables";
import { Sparkline } from "./sparkline";
import { seriesColor } from "./trace-bay";

const DAY_MS = 24 * 3600 * 1000;

interface MetricsBayProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  readings: Record<number, Reading[]>;
  now: number;
}

interface BuoyMetric { buoy: Pick<Buoy, "buoy_id" | "label">; index: number; points: Point[]; stats: MetricStats; digits: number }

/** Each buoy's stats for one column, keeping the buoy's fleet position for its colour. */
function metricRows(props: MetricsBayProps, column: string): BuoyMetric[] {
  return props.buoys.flatMap((buoy, index) => {
    const rows = props.readings[buoy.buoy_id] ?? [];
    const points = pointsFor(rows, column);
    const stats = metricStats(points);
    return stats ? [{ buoy, index, points, stats, digits: digitsFor(rows, column) }] : [];
  });
}

function Tile({ column, rows, multi, now }: { column: string; rows: BuoyMetric[]; multi: boolean; now: number }) {
  const unit = VARIABLES[column]?.unit ?? "";
  const domain: [number, number] = [Math.min(...rows.map((r) => r.stats.min)), Math.max(...rows.map((r) => r.stats.max))];
  return (
    <article className="sc-metric" aria-label={variableLabel(column)}>
      <header className="sc-metric__head"><span>{variableLabel(column)}</span>{unit && <span className="sc-metric__unit">{unit}</span>}</header>
      {rows.map(({ buoy, index, points, stats, digits }) => (
        <div key={buoy.buoy_id} className="sc-metric__row">
          {multi && <span className="sc-metric__buoy"><i style={{ background: seriesColor(index) }} />{buoy.label}</span>}
          <span className="sc-metric__figure">
            <span className="sc-metric__value">{stats.latest.v.toFixed(digits)}</span>
            <span className="sc-metric__change" title="Change from the reading closest to 24 h earlier">
              {stats.change === null ? "no reading 24 h ago" : `${signed(stats.change, digits)} in 24 h`}
            </span>
          </span>
          <Sparkline points={points} from={now - WINDOW_DAYS * DAY_MS} to={now} color={seriesColor(index)} unit={unit} digits={digits} domain={domain}
            label={`${variableLabel(column)}${multi ? ` · ${buoy.label}` : ""}`} />
          <span className="sc-metric__range">
            7 d {stats.min.toFixed(digits)} to {stats.max.toFixed(digits)} · mean {stats.mean.toFixed(digits)} · <Ago ms={stats.latest.t} />
          </span>
        </div>
      ))}
    </article>
  );
}

function StatsTable({ shown }: { shown: { column: string; rows: BuoyMetric[] }[] }) {
  return (
    <details>
      <summary className="sc-help">Show every metric as a table</summary>
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th scope="col">Metric</th><th scope="col">Buoy</th><th scope="col" className="n">Latest</th><th scope="col" className="n">24 h change</th>
              <th scope="col" className="n">7 d min</th><th scope="col" className="n">7 d mean</th><th scope="col" className="n">7 d max</th><th scope="col" className="n">Readings</th></tr>
          </thead>
          <tbody>
            {shown.flatMap(({ column, rows }) => rows.map(({ buoy, stats, digits }) => (
              <tr key={`${column}-${buoy.buoy_id}`}>
                <th scope="row">{variableLabel(column)}{VARIABLES[column]?.unit ? ` (${VARIABLES[column].unit})` : ""}</th>
                <td>{buoy.label}</td>
                <td className="n">{stats.latest.v.toFixed(digits)}</td>
                <td className="n">{stats.change === null ? "—" : signed(stats.change, digits)}</td>
                <td className="n">{stats.min.toFixed(digits)}</td>
                <td className="n">{stats.mean.toFixed(digits)}</td>
                <td className="n">{stats.max.toFixed(digits)}</td>
                <td className="n">{stats.count}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Every measured number, grouped (water, soundscape, power and housing): one tile per metric with
 * each buoy's newest value, its 24 h change, a 7-day sparkline on a shared time axis and the
 * week's range. Metrics with nothing in the window are named, not hidden. */
export function MetricsBay(props: MetricsBayProps) {
  const multi = props.buoys.length > 1;
  const groups = METRIC_GROUPS.map((group) => ({
    name: group.name,
    metrics: group.columns.map((column) => ({ column, rows: metricRows(props, column) })),
  }));
  const shown = groups.flatMap((g) => g.metrics.filter((m) => m.rows.length > 0));
  const missing = groups.flatMap((g) => g.metrics.filter((m) => m.rows.length === 0).map((m) => variableLabel(m.column)));
  if (props.buoys.length === 0) return <p className="sc-help">No buoys yet.</p>;
  if (shown.length === 0) return <p className="sc-help">No readings in the last 7 days.</p>;
  return (
    <div className="sc-metrics">
      {multi && (
        <ul className="sc-legend" aria-label="Buoys">
          {props.buoys.map((b, i) => <li key={b.buoy_id}><i style={{ background: seriesColor(i) }} />{b.label}</li>)}
        </ul>
      )}
      {groups.map((group) => {
        const withData = group.metrics.filter((m) => m.rows.length > 0);
        if (withData.length === 0) return null;
        return (
          <section key={group.name} className="sc-metrics__group" aria-label={group.name}>
            <h3 className="sc-tag">{group.name}</h3>
            <div className="sc-metrics__grid">
              {withData.map((m) => <Tile key={m.column} column={m.column} rows={m.rows} multi={multi} now={props.now} />)}
            </div>
          </section>
        );
      })}
      {missing.length > 0 && (
        <p className="sc-help">No data in the last 7 days: {missing.join(", ")}. Blank columns are not measured on the radio link
          (housing sensors are SD-card only, turbidity is not yet calibrated to FAU) or had no recording.</p>
      )}
      <StatsTable shown={shown} />
    </div>
  );
}
