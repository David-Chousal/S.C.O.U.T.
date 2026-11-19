import { PT_PER_PX } from "@/lib/report/page";
import type { ImageView, MarkerView, TextView, TitleView } from "@/lib/report/views/types";
import { Image, Text, View } from "./primitives";
import { MUTED, T, pt } from "./styles";

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

export function PdfTextBlock({ view }: { view: TextView }) {
  const paragraphs = view.paragraphs.length ? view.paragraphs : [""];
  const style = view.style === "heading" ? T.h2 : view.style === "subheading" ? T.h3x : T.p;
  return (
    <View style={view.style === "callout" ? [T.text, T.callout] : T.text}>
      {paragraphs.map((p, i) => <Text key={i} style={style}>{p}</Text>)}
    </View>
  );
}

/** A divider is a rule; a page break draws nothing (the page itself has already ended). */
export function PdfMarker({ view }: { view: MarkerView }) {
  return view.kind === "divider" ? <View style={T.divider} /> : null;
}

/** The same image, fetched by the PDF library from the console (the browser's session cookie goes with it). */
export function PdfImage({ view }: { view: ImageView }) {
  const size = { width: view.width * PT_PER_PX, height: view.height * PT_PER_PX };
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <View style={{ flexDirection: "column", gap: pt(4) }}>
      {view.src
        // react-pdf's Image, not an HTML <img>: a PDF image has no alt attribute; the caption is its text.
        // eslint-disable-next-line jsx-a11y/alt-text
        ? <Image src={`${origin}${view.src}`} style={size} />
        : <View style={[size, { borderWidth: 0.75, borderStyle: "dashed", borderColor: MUTED, justifyContent: "center", alignItems: "center" }]}><Text style={T.line}>{view.message}</Text></View>}
      {view.caption ? <Text style={T.line}>{view.caption}</Text> : null}
    </View>
  );
}
