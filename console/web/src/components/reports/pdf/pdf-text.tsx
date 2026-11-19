import type { MarkerView, TextView, TitleView } from "@/lib/report/views/types";
import { Text, View } from "./primitives";
import { T } from "./styles";

export function PdfTitle({ view }: { view: TitleView }) {
  return (
    <View style={T.title}>
      <Text style={T.mark}>S.C.O.U.T.</Text>
      <Text style={T.h1}>{view.title}</Text>
      {view.subtitle ? <Text style={T.sub}>{view.subtitle}</Text> : null}
      <View style={T.lines}>{view.lines.map((line, i) => <Text key={i} style={T.line}>{line}</Text>)}</View>
    </View>
  );
}

export function PdfTextBlock({ view, unit }: { view: TextView; unit: number }) {
  const style = view.style === "heading" ? T.h2 : view.style === "subheading" ? T.h3x : T.p;
  return (
    <View style={view.style === "callout" ? [T.text, T.callout] : T.text}>
      <Text style={style}>{view.paragraphs[unit] ?? ""}</Text>
    </View>
  );
}

/** A divider is a rule; a page break draws nothing (the page itself has already ended). */
export function PdfMarker({ view }: { view: MarkerView }) {
  return view.kind === "divider" ? <View style={T.divider} /> : null;
}
