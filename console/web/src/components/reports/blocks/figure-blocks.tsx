import type { ChartGeometry } from "@/lib/report/chart";
import type { ChartsView, HeatStressBlockView, KeyFiguresView } from "@/lib/report/views/types";
import { ReportTable, Section } from "./table-block";

/** A report chart as DOM SVG, from geometry the PDF draws identically. */
export function ChartSvg({ chart }: { chart: ChartGeometry }) {
  return (
    <figure className="sc-rb-chart">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} width="100%" role="img" aria-label={chart.legend.map((l) => l.label).join(", ")}>
        {chart.yTicks.map((t, i) => <line key={`g${i}`} x1={chart.left} x2={chart.right} y1={t.y} y2={t.y} stroke="#ddd6d0" strokeWidth={0.75} />)}
        {chart.yTicks.map((t, i) => <text key={`y${i}`} x={chart.left - 6} y={t.y + 3} textAnchor="end" className="sc-rb-chart__axis">{t.label}</text>)}
        {chart.xTicks.map((t, i) => <text key={`x${i}`} x={t.x} y={chart.height - 6} textAnchor="middle" className="sc-rb-chart__axis">{t.label}</text>)}
        {chart.references.map((r, i) => (
          <g key={`r${i}`}>
            <line x1={chart.left} x2={chart.right} y1={r.y} y2={r.y} stroke={r.color} strokeWidth={1} strokeDasharray="4 3" />
            <text x={chart.right + 4} y={r.y + 3} className="sc-rb-chart__ref" fill={r.color}>{r.label}</text>
          </g>
        ))}
        {chart.dots.map((p, i) => <circle key={`d${i}`} cx={p.x} cy={p.y} r={2} fill={p.color} />)}
        {chart.series.map((s, i) => <path key={`s${i}`} d={s.d} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />)}
      </svg>
      <figcaption className="sc-rb-legend">{chart.legend.map((l, i) => <span key={i}><i style={{ background: l.color }} />{l.label}</span>)}</figcaption>
    </figure>
  );
}

export function KeyFiguresUnit({ view, unit }: { view: KeyFiguresView; unit: number }) {
  return (
    <Section section={view.sections[unit]}>
      {(tiles) => (
        <div className="sc-rb-tiles">
          {tiles.map((t, i) => (
            <div key={i} className="sc-rb-tile">
              <span className="sc-rb-tile__label">{t.label}</span>
              <span className="sc-rb-tile__value">{t.value}{t.unit && <small>{t.unit}</small>}</span>
              <span className="sc-rb-tile__caption">{t.caption}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function ChartsUnit({ view, unit }: { view: ChartsView; unit: number }) {
  const section = view.sections[unit];
  if (!section) return <p className="sc-rb-foot">{view.footnote}</p>;
  return <Section section={section}>{(chart) => <ChartSvg chart={chart} />}</Section>;
}

export function HeatUnit({ view, unit }: { view: HeatStressBlockView; unit: number }) {
  const section = view.sections[unit];
  if (!section) return <p className="sc-rb-foot">{view.footnote}</p>;
  return (
    <Section section={section}>
      {(body) => <div className="sc-rb-stack sc-rb-stack--tight"><ReportTable table={body.facts} />{body.chart && <ChartSvg chart={body.chart} />}</div>}
    </Section>
  );
}
