"""Content components: bento grid, cards, pills, carousel, drawings, steps, spec rows, tables, callouts, team, chips."""

CSS = """/* ── Grid / bento ─────────────────────────────────────────────────────────── */
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:clamp(1rem,0.5rem + 1.6vw,1.8rem)}
.bento>*{grid-column:span 6}
@media(min-width:721px){
  .col-2{grid-column:span 2}.col-3{grid-column:span 3}.col-4{grid-column:span 4}
}
.card-glyph{width:34px;height:34px;color:var(--color-accent);margin-bottom:1.1rem}
.feature-plain h3{margin-bottom:0.4rem}
.feature-plain p{color:var(--color-text-muted);margin-bottom:0}
.feature-plain .card-glyph{margin-bottom:0.9rem}
.feature-plain .kicker{font-size:var(--text-micro);letter-spacing:var(--track-micro);
  text-transform:uppercase;color:var(--color-text-subtle);font-weight:500;margin-bottom:0.5rem}
/* Sticky split - a heading column that holds still beside a column that scrolls past it.
   Home "What it measures", Technology "The subsystems", Science "Listening to the reef".
   The heading is only sticky on wide screens; below the breakpoint
   the two columns collapse into one ordinary stack, heading first. Layout only, no motion:
   nothing here is scroll-driven, so every entry is visible without JavaScript. */
.sticky-split{display:grid;gap:clamp(2rem,1.4rem + 2vw,3.2rem)}
/* The grid column sets the heading's width; .head-block's own 56ch cap would fight it, and a
   `ch` cap here resolves against the block's 1rem font, not the h2's, so it lands far too narrow. */
.sticky-split-head .head-block{max-width:none}
.sticky-split-head .lead{max-width:30rem}
.sticky-split-body>*+*{margin-top:clamp(2.2rem,1.5rem + 2.2vw,3.8rem);
  padding-top:clamp(2.2rem,1.5rem + 2.2vw,3.8rem);border-top:1px solid var(--color-line)}
.sticky-split-body p{max-width:54ch}
.sticky-split-body .textlink{margin-top:1.1rem}
@media(min-width:1000px){
  .sticky-split{grid-template-columns:repeat(2,minmax(0,1fr));
    gap:clamp(2.4rem,0.5rem + 5vw,6rem);align-items:start}
  /* 68px is .nav's min-height, i.e. the sticky header this must clear. */
  .sticky-split-head{position:sticky;top:calc(68px + clamp(1.4rem,4vh,3rem))}
}
.card-ink{background:var(--color-text);color:var(--color-canvas);box-shadow:none}
.card-ink h2,.card-ink h3{color:var(--color-canvas)}
.card-ink p{color:color-mix(in srgb,var(--color-canvas) 78%,transparent)}
.card-ink .kicker{color:color-mix(in srgb,var(--color-canvas) 66%,transparent)}
.card-ink .btn{border-color:color-mix(in srgb,var(--color-canvas) 34%,transparent);color:var(--color-canvas)}
.card-ink .btn:hover{background:var(--color-canvas);color:var(--color-text);border-color:var(--color-canvas)}
.card-ink .btn-primary{background:var(--color-canvas);color:var(--color-text)}
.card-ink .stat{background:color-mix(in srgb,var(--color-canvas) 8%,transparent);box-shadow:none;
  border:1px solid color-mix(in srgb,var(--color-canvas) 16%,transparent)}
.card-ink .stat .stat-label{color:color-mix(in srgb,var(--color-canvas) 62%,transparent)}
.card-ink .stat .stat-value{color:var(--color-canvas)}

/* ── Pill image cards ─────────────────────────────────────────────────────── */
/* Four pills across, on the standard content width so the section lines up with the ones above
   and below. Explicit 4-up (not auto-fit, which spawned a phantom 5th column) with a tight gap. */
.pill{position:relative;width:100%;border-radius:var(--radius-none);overflow:hidden;isolation:isolate;
  aspect-ratio:6/8;background:var(--color-canvas-sunken);box-shadow:var(--shadow-1);
  transition:transform var(--dur-settle) var(--ease-settle),box-shadow var(--dur-settle) var(--ease-settle)}
.pill.wide{aspect-ratio:1/1}
.pill:hover{transform:translateY(-5px);box-shadow:var(--shadow-2)}
.pill img,.pill svg.atmos{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  z-index:0;transition:transform var(--dur-settle) var(--ease-settle)}
.pill:hover img,.pill:hover svg.atmos{transform:scale(1.06)}
.pill-scrim{position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg,transparent 45%,rgba(20,16,12,0.62))}
.pill-cap{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.2rem 1.3rem;color:#f6f2ec;
  text-shadow:0 1px 6px rgba(15,12,8,0.45)}
.pill-cap b{display:block;font-weight:600;font-size:1.05rem}
.pill-cap span{display:block;font-size:var(--text-micro);color:rgba(246,242,236,0.8);
  margin-top:0.25rem;letter-spacing:0.02em}
.pill-credit{position:absolute;top:0.8rem;right:1rem;z-index:2;font-size:0.75rem;
  color:rgba(246,242,236,0.9);text-align:right;max-width:72%;letter-spacing:0.02em;
  text-shadow:0 1px 4px rgba(15,12,8,0.6)}
.pill-credit a{color:inherit;text-decoration:underline;text-underline-offset:2px}
/* Carousel (Home "The nearshore zone") — native scroll-snap; each .pill is a slide.
   Without JS the track is still a scrollable, snapping strip; carousel.js adds arrows + dots. */
.carousel-viewport{position:relative}
.carousel-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;
  scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;padding:6px 2px}
.carousel-track::-webkit-scrollbar{display:none}
.carousel-track>.pill{flex:0 0 82%;scroll-snap-align:center}
@media(min-width:721px){.carousel-track>.pill{flex-basis:calc(50% - 6px)}}
@media(min-width:1000px){.carousel-track>.pill{flex-basis:calc(33.333% - 8px)}}
.carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;
  width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;color:var(--color-text);
  background:color-mix(in srgb,var(--color-surface) 86%,transparent);box-shadow:var(--shadow-1);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:grid;place-items:center;
  transition:opacity var(--dur-quick) var(--ease-standard),transform var(--dur-settle) var(--ease-settle)}
.carousel-prev{left:-10px}.carousel-next{right:-10px}
.carousel-arrow:hover{transform:translateY(-50%) scale(1.06)}
.carousel-arrow svg{width:20px;height:20px}
.carousel-arrow[disabled]{opacity:0;pointer-events:none}
/* Each dot is a 24 × 24 target (WCAG 2.5.8) drawing an 8 px dot, edged at 3:1 so an unselected
   dot is still visible against the sand. */
.carousel-dots{display:flex;justify-content:center;gap:0;margin-top:1.3rem}
.carousel-dot{width:24px;height:24px;padding:0;border:none;background:none;cursor:pointer;
  display:grid;place-items:center}
.carousel-dot::before{content:"";width:8px;height:8px;border-radius:50%;
  background:var(--color-line-strong);
  transition:background var(--dur-quick) var(--ease-standard),transform var(--dur-settle) var(--ease-settle)}
.carousel-dot[aria-current="true"]::before{background:var(--color-accent);transform:scale(1.3)}
@media(prefers-reduced-motion:reduce){.carousel-track{scroll-behavior:auto}}
/* Full-bleed variant: spans the page width; slides get edge padding, arrows inset. */
.carousel-full{margin-block:2.8rem clamp(3rem,2rem + 4vw,5.5rem)}
.carousel-full .carousel-track{padding-inline:clamp(1rem,4vw,4rem)}
.carousel-full .carousel-prev{left:clamp(10px,2.5vw,32px)}
.carousel-full .carousel-next{right:clamp(10px,2.5vw,32px)}

/* ── Mechanical drawings gallery (home) — John's CAD prints, framed on the sand ─── */
.drawings{margin-top:clamp(2.2rem,1.6rem + 2vw,3.6rem)}
.drawings-head{margin-bottom:1.6rem}
.drawings-head h3{margin-top:0.4rem}
.drawings-sub{color:var(--color-text-muted);font-size:0.98rem;margin:0.5rem 0 0;max-width:58ch}
.drawings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(1rem,0.6rem + 1vw,1.6rem)}
@media(max-width:560px){.drawings-grid{grid-template-columns:1fr}}
/* Single-item variant (Rev A electrical schematic) — one large card, not the two-up grid. */
.drawings-grid.single{grid-template-columns:1fr}
/* .drawing is a <figure>; its UA margin is handled by the scoped `main figure{margin:0}` reset. */
.drawing{background:#fff;border-radius:var(--radius-none);overflow:hidden;
  box-shadow:var(--shadow-1);transition:transform var(--dur-settle) var(--ease-settle),box-shadow var(--dur-settle) var(--ease-settle)}
.drawing:hover{transform:translateY(-4px);box-shadow:var(--shadow-2)}
.drawing img{width:100%;height:auto;display:block}
.drawing figcaption{padding:0.85rem 1.1rem 1rem;border-top:1px solid var(--color-line);
  color:var(--color-text);font-weight:500;font-size:0.98rem}

/* ── Steps ────────────────────────────────────────────────────────────────── */
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:clamp(1.4rem,0.8rem + 1.6vw,2.6rem);counter-reset:step}
.step{position:relative;padding-top:3rem}
.step::before{counter-increment:step;content:"0" counter(step);position:absolute;top:0;left:0;
  font-size:0.85rem;font-weight:500;letter-spacing:var(--track-micro);color:var(--color-accent);
  font-variant-numeric:tabular-nums}
.step h3{font-size:1.12rem;margin-bottom:0.5rem}
.step p{color:var(--color-text-muted);margin:0}

/* ── Spec / definition rows ───────────────────────────────────────────────── */
.spec{border-top:1px solid var(--color-line);margin:0}
.spec-row{display:grid;grid-template-columns:minmax(9rem,14rem) 1fr;gap:0.4rem 1.8rem;
  padding:1.1rem 0;border-bottom:1px solid var(--color-line);align-items:baseline}
.spec-row dt{font-weight:500;color:var(--color-text)}
.spec-row dd{margin:0;color:var(--color-text-muted)}
@media(max-width:560px){.spec-row{grid-template-columns:1fr;gap:0.2rem}}

/* ── Data table ───────────────────────────────────────────────────────────── */

/* ── Quote / callout ──────────────────────────────────────────────────────── */
.callout{border-left:2px solid var(--color-accent);padding:0.2rem 0 0.2rem 1.4rem;color:var(--color-text-muted)}
.quote{font-weight:400;font-size:clamp(1.5rem,1.1rem + 1.8vw,2.4rem);line-height:1.28;
  color:var(--color-text);letter-spacing:-0.02em;max-width:20ch;margin:0}
/* ── Team ─────────────────────────────────────────────────────────────────── */
.team{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.6rem}
/* Card is a link; on hover an accent outline draws clockwise around the rounded card
   (conic mask over a border, angle animated via @property). No dim, no lift. */
@property --edge-angle{syntax:"<angle>";inherits:true;initial-value:0deg}
.member{display:block;color:inherit;text-decoration:none;background:var(--color-surface);
  border-radius:var(--radius-none);position:relative;--edge-angle:0deg;
  padding:clamp(1.6rem,1.2rem + 1vw,2.1rem);box-shadow:var(--shadow-1);
  transition:--edge-angle var(--dur-settle) var(--ease-settle)}
.member::after{content:"";position:absolute;inset:0;border-radius:inherit;
  border:2px solid var(--color-accent);pointer-events:none;
  -webkit-mask:conic-gradient(from -90deg,#000 var(--edge-angle),#0000 0);
          mask:conic-gradient(from -90deg,#000 var(--edge-angle),#0000 0)}
.member:hover{opacity:1;--edge-angle:360deg}
.member:focus-visible{outline:2px solid var(--color-accent);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.member{transition:none}}
.member-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.3rem}
.member .avatar{width:60px;height:60px;border-radius:50%;margin:0;object-fit:cover;display:block}
.member-linkedin{color:var(--color-text-subtle);display:inline-flex;margin-top:0.2rem;
  transition:color var(--dur-quick) var(--ease-standard)}
.member:hover .member-linkedin,.member:focus-visible .member-linkedin{color:var(--color-accent)}
.member-linkedin svg{width:19px;height:19px}
.member h3{font-size:1.22rem;margin-bottom:0.2rem}
.member .role{color:var(--color-accent);font-size:0.9rem;font-weight:500;margin-bottom:1rem}
.member .disc{display:inline-block;font-size:0.75rem;letter-spacing:var(--track-micro);
  text-transform:uppercase;color:var(--color-text-subtle);border:1px solid var(--color-line);
  border-radius:var(--radius-pill);padding:0.25rem 0.75rem;margin-bottom:1rem}
.member p{color:var(--color-text-muted);font-size:0.96rem;line-height:1.6;margin:0}
/* Footer email icon */
.footer-social{display:flex;gap:1rem;margin-top:1.4rem}
.footer-social a{color:var(--color-text-subtle);display:inline-flex;transition:color var(--dur-quick) var(--ease-standard)}
.footer-social a:hover{color:var(--color-accent);opacity:1}
.footer-social svg{width:20px;height:20px}

/* ── Chips ────────────────────────────────────────────────────────────────── */
.chip{display:inline-flex;align-items:center;gap:0.45rem;font-size:var(--text-micro);
  font-weight:500;letter-spacing:0.02em;padding:0.3rem 0.8rem;border-radius:var(--radius-pill);
  color:var(--color-text-subtle);background:color-mix(in srgb,currentColor 12%,var(--color-surface))}
.chip::before{content:"";width:0.5rem;height:0.5rem;border-radius:50%;background:currentColor}
.chip.ok{color:var(--alert-nostress-text)}.chip.info{color:var(--color-accent)}

"""
