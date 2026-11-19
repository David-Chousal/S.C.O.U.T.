import type { MarkerView, TextView, TitleView } from "@/lib/report/views/types";

export function TitleUnit({ view }: { view: TitleView }) {
  return (
    <header className="sc-rb-title">
      <span className="sc-rb-title__mark">S.C.O.U.T.</span>
      <h1>{view.title}</h1>
      {view.subtitle && <p className="sc-rb-title__sub">{view.subtitle}</p>}
      <div className="sc-rb-title__lines">{view.lines.map((line, i) => <p key={i}>{line}</p>)}</div>
    </header>
  );
}

/** One paragraph of a Text block: each is its own unit, so long text can continue on the next page. */
export function TextUnit({ view, unit }: { view: TextView; unit: number }) {
  const paragraph = view.paragraphs[unit] ?? "";
  if (view.style === "heading") return <div className="sc-rb-text"><h2>{paragraph}</h2></div>;
  if (view.style === "subheading") return <div className="sc-rb-text"><h3>{paragraph}</h3></div>;
  return <div className={`sc-rb-text${view.style === "callout" ? " sc-rb-text--callout" : ""}`}><p>{paragraph}</p></div>;
}

/** A divider prints as a rule; a page break shows only while editing, as a dashed marker. */
export function MarkerUnit({ view }: { view: MarkerView }) {
  return view.kind === "divider" ? <hr className="sc-rb-divider" /> : <div className="sc-rb-break" aria-label="Page break"><span>Page break</span></div>;
}
