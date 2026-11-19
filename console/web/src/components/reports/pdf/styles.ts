// The report's type scale in points: the screen's CSS pixels × 0.75 (report-builder.css).
import { PAGE_MARGIN_PX, PT_PER_PX } from "@/lib/report/page";

export const pt = (px: number) => px * PT_PER_PX;

export const INK = "#2b2520";
export const MUTED = "#6f6760";
export const LINE = "#ddd6d0";
export const LINE_STRONG = "#867f78";
export const SUNKEN = "#f1f1f0";

export const SANS = "DM Sans";
export const MONO = "JetBrains Mono";

export const S = {
  page: { paddingTop: pt(PAGE_MARGIN_PX), paddingHorizontal: pt(PAGE_MARGIN_PX), paddingBottom: pt(PAGE_MARGIN_PX), fontFamily: SANS, fontSize: pt(12), color: INK },
  body: { flexDirection: "column" as const, gap: pt(24), flexGrow: 1 },
  block: { flexDirection: "column" as const, gap: pt(16) },
  foot: { position: "absolute" as const, right: pt(PAGE_MARGIN_PX), bottom: pt(PAGE_MARGIN_PX), fontFamily: MONO, fontSize: pt(9), color: MUTED },
  section: { flexDirection: "column" as const, gap: pt(8) },
  h3: { flexDirection: "row" as const, alignItems: "flex-end" as const, fontWeight: 700, fontSize: pt(14) },
  h3Note: { fontWeight: 400, fontSize: pt(11), color: MUTED, marginLeft: pt(8) },
  muted: { fontSize: pt(12), color: MUTED },
  footnote: { fontSize: pt(10), color: MUTED },
  tableHead: { flexDirection: "row" as const, borderBottomWidth: 1, borderBottomColor: LINE_STRONG, paddingBottom: pt(4) },
  th: { fontFamily: MONO, fontWeight: 500, fontSize: pt(9), color: MUTED, textTransform: "uppercase" as const, letterSpacing: pt(0.5), paddingHorizontal: pt(6) },
  tr: { flexDirection: "row" as const, borderBottomWidth: 0.75, borderBottomColor: LINE },
  td: { fontSize: pt(11), paddingHorizontal: pt(6), paddingVertical: pt(3) },
  head: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-end" as const, borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: pt(12) },
  wordmark: { fontWeight: 700, fontSize: pt(14), letterSpacing: pt(1) },
  h1: { fontWeight: 700, fontSize: pt(22), marginTop: pt(4) },
  headNote: { fontSize: pt(11), color: MUTED },
};

export const T = {
  title: { flexDirection: "column" as const, gap: pt(4), borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: pt(12) },
  mark: { fontWeight: 700, fontSize: pt(12), letterSpacing: pt(1) },
  h1: { fontWeight: 700, fontSize: pt(24) },
  sub: { fontSize: pt(14), color: INK },
  lines: { flexDirection: "column" as const, gap: pt(2), marginTop: pt(4) },
  line: { fontSize: pt(11), color: MUTED },
  text: { flexDirection: "column" as const, gap: pt(8) },
  p: { fontSize: pt(12), lineHeight: 1.45 },
  h2: { fontWeight: 700, fontSize: pt(18) },
  h3x: { fontWeight: 700, fontSize: pt(14) },
  callout: { borderLeftWidth: 2.25, borderLeftColor: "#1f6763", backgroundColor: SUNKEN, paddingVertical: pt(8), paddingHorizontal: pt(12) },
  divider: { borderBottomWidth: 0.75, borderBottomColor: LINE_STRONG },
  tiles: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: pt(8) },
  tile: { width: pt(200), flexDirection: "column" as const, gap: pt(2), borderTopWidth: 1.5, borderTopColor: INK, paddingTop: pt(6) },
  tileLabel: { fontSize: pt(10), color: MUTED },
  tileValue: { fontWeight: 700, fontSize: pt(20) },
  tileUnit: { fontWeight: 500, fontSize: pt(11), color: MUTED },
  tileCaption: { fontFamily: MONO, fontSize: pt(9), color: MUTED, textTransform: "uppercase" as const },
  legend: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: pt(12), marginTop: pt(4) },
  legendItem: { flexDirection: "row" as const, alignItems: "center" as const, gap: pt(4) },
  swatch: { width: pt(12), height: pt(2) },
  legendText: { fontSize: pt(10), color: MUTED },
};
