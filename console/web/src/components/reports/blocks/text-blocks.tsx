import type { ImageView, MarkerView, TextView, TitleView } from "@/lib/report/views/types";

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

export function TextUnit({ view }: { view: TextView }) {
  const paragraphs = view.paragraphs.length ? view.paragraphs : [""];
  if (view.style === "heading") return <div className="sc-rb-text">{paragraphs.map((p, i) => <h2 key={i}>{p}</h2>)}</div>;
  if (view.style === "subheading") return <div className="sc-rb-text">{paragraphs.map((p, i) => <h3 key={i}>{p}</h3>)}</div>;
  return (
    <div className={`sc-rb-text${view.style === "callout" ? " sc-rb-text--callout" : ""}`}>
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

/** A divider prints as a rule; a page break shows only while editing, as a dashed marker. */
export function MarkerUnit({ view }: { view: MarkerView }) {
  return view.kind === "divider" ? <hr className="sc-rb-divider" /> : <div className="sc-rb-break" aria-label="Page break"><span>Page break</span></div>;
}

/** A logo or photo at its laid-out size; before one is chosen, a box saying how to add it. */
export function ImageUnit({ view }: { view: ImageView }) {
  return (
    <figure className="sc-rb-image">
      {view.src
        // A plain <img>: the console is a static export with no image optimiser, and the size is the view's.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={view.src} alt={view.alt} width={view.width} height={view.height} style={{ width: view.width, height: view.height }} />
        : <div className="sc-rb-image__empty" style={{ width: view.width, height: view.height }}><span>{view.message}</span></div>}
      {view.caption && <figcaption>{view.caption}</figcaption>}
    </figure>
  );
}
