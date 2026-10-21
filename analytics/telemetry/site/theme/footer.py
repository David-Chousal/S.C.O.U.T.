"""The footer, the sample-data banner, inner page headers, figures."""

CSS = """/* ── Footer ───────────────────────────────────────────────────────────────── */
.site-footer{position:relative;isolation:isolate;overflow:hidden;
  border-top:1px solid var(--color-line);margin-top:var(--space-section);
  padding-top:clamp(3.4rem,2.4rem + 3vw,5rem);padding-bottom:clamp(1.5rem,1rem + 1vw,2.25rem)}
.footer-grid{position:relative;z-index:1;display:grid;grid-template-columns:2fr 1fr 1fr;gap:2.4rem}
@media(max-width:560px){.footer-grid{grid-template-columns:1fr 1fr}}
.footer-brand{grid-column:1/-1;max-width:38ch}
@media(min-width:561px){.footer-brand{grid-column:auto}}
.footer-brand .brand{margin-bottom:1.1rem}
.footer-brand p{color:var(--color-text-muted);font-size:0.94rem;margin:0}
.footer-col h4{font-size:var(--text-micro);letter-spacing:var(--track-micro);text-transform:uppercase;
  color:var(--color-text-subtle);font-weight:500;margin:0 0 1.1rem}
.footer-col ul{list-style:none;margin:0;padding:0;display:grid;gap:0.6rem}
.footer-col a{color:var(--color-text-subtle);font-size:0.94rem}
.footer-col a:hover{color:var(--color-text);opacity:1}
.footer-base{display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.6rem;
  margin-top:2.8rem;padding-top:1.6rem;border-top:1px solid var(--color-line);
  color:var(--color-text-subtle);font-size:var(--text-small)}
@media(max-width:560px){.footer-base{flex-direction:column;align-items:flex-start;gap:0.35rem}}

/* ── Sample-data banner (Analytics) ───────────────────────────────────────── */
.banner{max-width:1140px;margin:1.6rem auto 0;padding:0.9rem 1.3rem;border-radius:var(--radius-none);
  background:var(--color-surface);box-shadow:var(--shadow-1);color:var(--color-text-subtle);font-size:var(--text-small)}
.banner b{color:var(--status-warning)}

/* ── Page header (inner pages) ────────────────────────────────────────────── */
/* Inner-page headers get their own arrival: a deep, tinted wash behind oversized display type,
   so Technology/Science/About/Analytics/Fleet all open on a moment rather than straight into
   body copy. Purely CSS, so the pages whose markup lives outside `pages/` (Analytics, Fleet)
   inherit it without changing. */
/* Deliberately NOT `isolation:isolate`: the wash below is a `z-index:-1` child, and it has to
   fall behind the doc sidebar too, which lives outside this element. Isolating would trap it in
   `.page-head`'s own stacking context and paint it over the sidebar. */
.page-head{position:relative;
  padding-block:clamp(5.5rem,3.4rem + 8vw,10rem) clamp(1.6rem,0.8rem + 2vw,3rem)}
/* A hairline closing the header off from the body copy below it. */
.page-head::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
  pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--color-line) 20%,var(--color-line) 80%,transparent)}
.page-head h1{font-size:var(--text-display);max-width:16ch;
  letter-spacing:-0.035em;line-height:1.02}
.page-head .lead{max-width:56ch;margin-top:1.2rem}
.page-head .dash-meta{margin-top:1.6rem}
/* Above-the-fold content animates on load, never on scroll: an IntersectionObserver would
   leave the first paint blank for a frame. */
@media (prefers-reduced-motion:no-preference){
  /* Same arrival as the hero: it must finish inside the 400 ms page transition, or the
     transition's frozen snapshot hands over to a page that is still moving. */
  html.js-reveal .page-head .wrap>*{animation:hero-rise var(--dur-settle) var(--ease-settle) both}
  html.js-reveal .page-head .wrap>*:nth-child(1){animation-delay:0ms}
  html.js-reveal .page-head .wrap>*:nth-child(2){animation-delay:70ms}
  html.js-reveal .page-head .wrap>*:nth-child(3){animation-delay:140ms}
  html.js-reveal .page-head .wrap>*:nth-child(n+4){animation-delay:210ms}
}

/* ── Figures / diagrams ───────────────────────────────────────────────────── */
.flow{width:100%;height:auto;display:block;overflow:visible}
.figure-card{background:var(--color-surface);border-radius:var(--radius-none);
  padding:clamp(1.4rem,1rem + 1.4vw,2.4rem);box-shadow:var(--shadow-1)}
.figure-card figcaption{color:var(--color-text-muted);font-size:var(--text-small);margin-top:1.2rem;
  text-align:center;max-width:52ch;margin-inline:auto}

"""
