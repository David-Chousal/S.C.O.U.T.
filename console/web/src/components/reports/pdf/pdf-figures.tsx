import type { ReactNode } from "react";
import type { ChartGeometry } from "@/lib/report/chart";
import { PT_PER_PX } from "@/lib/report/page";
import type { BuoySection, ChartsView, HeatStressBlockView, KeyFiguresView } from "@/lib/report/views/types";
import { G, Line, Path, Svg, Text, View } from "./primitives";
import { PdfTable } from "./pdf-tables";
import { MONO, S, T } from "./styles";

/** The same chart as the screen's ChartSvg: one geometry, scaled from CSS pixels to points. */
export function PdfChart({ chart }: { chart: ChartGeometry }) {
  const axis = { fontFamily: MONO, fontSize: 8, fill: chart.axisColor };
  return (
    <View>
      <Svg width={chart.width * PT_PER_PX} height={chart.height * PT_PER_PX} viewBox={`0 0 ${chart.width} ${chart.height}`}>
        {chart.yTicks.map((t, i) => <Line key={`g${i}`} x1={chart.left} x2={chart.right} y1={t.y} y2={t.y} stroke="#ddd6d0" strokeWidth={0.75} />)}
        {chart.yTicks.map((t, i) => <Text key={`y${i}`} x={chart.left - 6} y={t.y + 3} textAnchor="end" style={axis}>{t.label}</Text>)}
        {chart.xTicks.map((t, i) => <Text key={`x${i}`} x={t.x} y={chart.height - 6} textAnchor="middle" style={axis}>{t.label}</Text>)}
        {chart.references.map((r, i) => (
          <G key={`r${i}`}>
            <Line x1={chart.left} x2={chart.right} y1={r.y} y2={r.y} stroke={r.color} strokeWidth={1} strokeDasharray="4 3" />
            <Text x={chart.right + 4} y={r.y + 3} style={{ ...axis, fill: r.color }}>{r.label}</Text>
          </G>
        ))}
        {chart.series.map((s, i) => <Path key={`s${i}`} d={s.d} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />)}
      </Svg>
      <View style={T.legend}>
        {chart.legend.map((l, i) => <View key={i} style={T.legendItem}><View style={[T.swatch, { backgroundColor: l.color }]} /><Text style={T.legendText}>{l.label}</Text></View>)}
      </View>
    </View>
  );
}

function PdfSection<B>({ section, children }: { section: BuoySection<B>; children: (body: B) => ReactNode }) {
  return (
    <View style={S.section} wrap={false}>
      <View style={S.h3}>
        <Text>{section.heading}</Text>
        {section.note ? <Text style={S.h3Note}>{section.note}</Text> : null}
      </View>
      {section.body ? children(section.body) : <Text style={S.muted}>{section.message}</Text>}
    </View>
  );
}

export function PdfKeyFigures({ view, unit }: { view: KeyFiguresView; unit: number }) {
  return (
    <PdfSection section={view.sections[unit]}>
      {(tiles) => (
        <View style={T.tiles}>
          {tiles.map((t, i) => (
            <View key={i} style={T.tile}>
              <Text style={T.tileLabel}>{t.label}</Text>
              <Text style={T.tileValue}>{t.value}{t.unit ? <Text style={T.tileUnit}>{t.unit}</Text> : null}</Text>
              <Text style={T.tileCaption}>{t.caption}</Text>
            </View>
          ))}
        </View>
      )}
    </PdfSection>
  );
}

export function PdfCharts({ view, unit }: { view: ChartsView; unit: number }) {
  const section = view.sections[unit];
  if (!section) return <Text style={S.footnote}>{view.footnote}</Text>;
  return <PdfSection section={section}>{(chart) => <PdfChart chart={chart} />}</PdfSection>;
}

export function PdfHeat({ view, unit }: { view: HeatStressBlockView; unit: number }) {
  const section = view.sections[unit];
  if (!section) return <Text style={S.footnote}>{view.footnote}</Text>;
  return <PdfSection section={section}>{(body) => <View style={S.section}><PdfTable table={body.facts} />{body.chart ? <PdfChart chart={body.chart} /> : null}</View>}</PdfSection>;
}
