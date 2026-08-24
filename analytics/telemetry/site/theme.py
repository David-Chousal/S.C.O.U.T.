"""The S.C.O.U.T. design system — tokens, CSS, and inline-SVG brand assets.

Direction: *warm zen · beachy · oceanic minimalism* — a pale-sand canvas, warm ink, enormous
whitespace, one clean geometric sans (DM Sans, self-hosted), and micro-labels set in uppercase
with wide tracking. Chrome stays quiet and warm-neutral; colour comes from the reef imagery and
the data. Cards are softly rounded and lifted by a soft, eased-back shadow — no outline
(only the buoy render-slot keeps a hairline ring).

Everything is emitted as a string into each page. There are **no external requests**: the fonts
are self-hosted (same-origin, with a graceful system fallback), colours are warm tokens, and
every graphic is inline SVG. The site is deliberately **light-only** (one sandy, beige canvas
regardless of the OS colour-scheme). Navigation between pages uses the CSS cross-document View
Transitions API for a left-to-right slide-and-fade, with no JavaScript; browsers without it
navigate normally. Motion is never scroll-dependent, so content is always visible.
"""

from __future__ import annotations

# ── Favicon — the S.C.O.U.T. buoy mark on sand (base64 so the page carries no literal "http";
# the sand backdrop keeps it visible on dark browser tab bars) ────────────────────────────────
FAVICON = (
    "data:image/svg+xml;base64,"
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ij"
    "AgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOSIgZmls"
    "bD0iI2VmZWFlMiIvPjxwYXRoIGQ9Ik0xNiA2LjggVjE1LjMiIGZpbGw9Im5vbmUiIH"
    "N0cm9rZT0iIzJhMjUyMCIgc3Ryb2tlLXdpZHRoPSIyLjEiIHN0cm9rZS1saW5lY2Fw"
    "PSJyb3VuZCIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYuNyIgcj0iMi41IiBmaWxsPS"
    "IjMmEyNTIwIi8+PGVsbGlwc2UgY3g9IjE2IiBjeT0iMjAuOCIgcng9IjguNyIgcnk9"
    "IjIuMzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJhMjUyMCIgc3Ryb2tlLXdpZHRoPS"
    "IxLjQiLz48ZWxsaXBzZSBjeD0iMTYiIGN5PSIyMC44IiByeD0iNC4zIiByeT0iMS4x"
    "IiBmaWxsPSJub25lIiBzdHJva2U9IiMyYTI1MjAiIHN0cm9rZS13aWR0aD0iMS4yNS"
    "IvPjwvc3ZnPg=="
)

SERIES = {
    "temp": "Daily mean temperature",
    "dhw": "Degree Heating Weeks",
    "turb": "Turbidity (relative)",
    "batt": "Battery minimum",
}


def styles(*, base: str = "", fonts_present: bool = False) -> str:
    """Return the full design-system CSS, with self-hosted DM Sans when available."""
    face = ""
    if fonts_present:
        face = (
            "@font-face{font-family:'DM Sans';font-style:normal;font-weight:300 700;"
            "font-display:swap;"
            f"src:url('{base}assets/fonts/dmsans-latin.woff2') format('woff2');"
            "unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
            "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
            "U+FEFF,U+FFFD;}"
            "@font-face{font-family:'DM Sans';font-style:normal;font-weight:300 700;"
            "font-display:swap;"
            f"src:url('{base}assets/fonts/dmsans-latin-ext.woff2') format('woff2');"
            "unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,"
            "U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,"
            "U+2113,U+2C60-2C7F,U+A720-A7FF;}"
        )
    return face + _CSS


_CSS = """
:root{
  color-scheme:light only;
  /* Warm sand and ink, the reference palette. The site is deliberately light-only:
     a single sandy, beige canvas regardless of the OS colour-scheme preference. */
  --sand:#f8f4f1;
  --bg:#f8f4f1;
  --bg-2:#f3efe9;
  --surface:#fcfaf8;
  --surface-2:#f4f1eb;
  --ink:#2a2520;
  --text:#2a2520;
  --muted:#6f675e;
  --faint:#9c948a;
  --line:rgba(42,37,32,0.10);
  --line-2:rgba(42,37,32,0.16);
  --accent:#1f6f6a;            /* calm deep-sea teal, for links, focus, the one accent */
  --accent-soft:#dfeae6;
  --coral:#c76b52;
  --on-accent:#fbf9f5;
  --ring:0 0 0 1px rgba(42,37,32,0.06);   /* kept only for the buoy render-slot */
  /* No hairline ring on cards: differentiation comes from the lighter surface + a soft,
     eased-back drop shadow. */
  --shadow-1:0 12px 32px -22px rgba(42,37,32,0.18);
  --shadow-2:0 22px 52px -30px rgba(42,37,32,0.26);

  /* Chart + alert semantics (light) */
  --c-temp:#c26647;
  --c-dhw:#c58a3a;
  --c-turb:#2b7d84;
  --c-batt:#5a8f66;
  --a-nostress:#3f8f78;
  --a-watch:#c39a3a;
  --a-warning:#c9752f;
  --a-alert1:#c1503f;
  --a-alert2:#9a5b8e;

  --font:'DM Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  --font-mono:ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;

  --text-hero:clamp(3rem,1.6rem + 6vw,6.4rem);
  --text-display:clamp(2rem,1.3rem + 2.8vw,3.4rem);
  --text-h2:clamp(1.6rem,1.2rem + 1.5vw,2.3rem);
  --text-h3:clamp(1.15rem,1rem + 0.6vw,1.4rem);
  --text-lead:clamp(1.12rem,1.02rem + 0.5vw,1.4rem);
  --text-body:clamp(1rem,0.97rem + 0.16vw,1.08rem);
  --text-small:0.9rem;
  --text-micro:0.75rem;

  --measure:64ch;
  --gutter:clamp(1.4rem,0.8rem + 3vw,4rem);
  --section:clamp(5rem,3.4rem + 8vw,11rem);
  --radius:16px;
  --radius-lg:0;      /* card surfaces are square (cards, team cards, panels, reef photos, render slot) */
  --radius-pill:999px;
  --track:0.18em;
  --ease:cubic-bezier(0.22,1,0.36,1);
  --dur:600ms;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;background:var(--bg);color:var(--text);
  font-family:var(--font);font-size:var(--text-body);line-height:1.7;font-weight:400;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden;
  font-feature-settings:"ss01";
}
/* Page-to-page transitions: the main content slides left-to-right with a fade while the header
   holds fixed, and the active-nav underline slides from the old item to the new one. Pure CSS,
   script-free, same-origin only. Naming the header pulls it out of the animated root snapshot so
   it stays put; naming the underline lets it morph between pages. The timing is kept short so
   rapid navigation stays responsive. Browsers without it navigate normally. */
@view-transition{navigation:auto}
.site-header{view-transition-name:site-header}
@media (prefers-reduced-motion:no-preference){
  .nav-links .nav-mark{view-transition-name:nav-underline}
  ::view-transition-group(site-header){animation-duration:0s}
  ::view-transition-group(nav-underline){animation-duration:400ms;
    animation-timing-function:var(--ease)}
  ::view-transition-old(root){animation:page-out 280ms var(--ease) both}
  ::view-transition-new(root){animation:page-in 400ms var(--ease) both}
  @keyframes page-out{to{opacity:0;transform:translateX(-4%)}}
  @keyframes page-in{from{opacity:0;transform:translateX(4%)}}
}
h1,h2,h3,h4{font-family:var(--font);font-weight:520;line-height:1.1;
  letter-spacing:-0.02em;color:var(--ink);margin:0}
h1{font-weight:500}
h2{font-size:var(--text-h2)}
h3{font-size:var(--text-h3);letter-spacing:-0.01em;font-weight:560}
p{margin:0 0 1.15em}
a{color:var(--accent);text-decoration:none;transition:color var(--dur) var(--ease),
  opacity var(--dur) var(--ease)}
a:hover{opacity:0.7}
strong{font-weight:600;color:var(--ink)}
em{font-style:italic}
code{font-family:var(--font-mono);font-size:0.9em;background:var(--surface-2);
  padding:0.1em 0.4em;border-radius:6px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
img{max-width:100%;height:auto;display:block}
/* Reset the browser default figure margin (margin:1em 40px), scoped to page content only —
   never the header or footer, so their layout is untouched. */
main figure{margin:0}
::selection{background:var(--accent);color:var(--on-accent)}
.skip{position:absolute;left:-999px;top:0;z-index:100;padding:0.6rem 1rem;background:var(--ink);
  color:var(--bg);border-radius:0 0 10px 0;font-weight:500}
.skip:focus{left:0}

.wrap{width:100%;max-width:1140px;margin-inline:auto;padding-inline:var(--gutter)}
.wrap-wide{max-width:1460px}
.narrow{max-width:940px}
.prose{max-width:var(--measure)}
.prose p,.prose li{color:var(--muted)}
.prose strong{color:var(--ink)}

/* The signature micro-label */
.eyebrow{font-size:var(--text-micro);font-weight:500;letter-spacing:var(--track);
  text-transform:uppercase;color:var(--muted);margin:0 0 1.4rem}
.lead{font-size:var(--text-lead);line-height:1.55;color:var(--muted);font-weight:400}
.section{padding-block:var(--section)}
.section-sm{padding-block:clamp(3.4rem,2.4rem + 4vw,6rem)}
.divider{height:1px;background:var(--line)}
.center{text-align:center}
.center .lead{margin-inline:auto}

/* ── Header / nav ─────────────────────────────────────────────────────────── */
.site-header{position:sticky;top:0;z-index:50;
  background:color-mix(in srgb,var(--bg) 67%,transparent);
  backdrop-filter:saturate(1.3) blur(16px);-webkit-backdrop-filter:saturate(1.3) blur(16px)}
/* Three-column header: brand left, nav menu centred, social icons right. */
.nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.4rem;min-height:68px}
.brand{display:inline-flex;align-items:center;gap:0.7rem;color:var(--ink);justify-self:start}
.brand:hover{opacity:1}
.brand .mark{width:26px;height:26px;flex:none}
.brand-txt{display:flex;flex-direction:column;line-height:1.1}
.brand-txt b{font-weight:700;letter-spacing:0.02em;font-size:0.85rem}
.brand-txt span{font-size:0.52rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);
  margin-top:2px}
/* Centred by the header grid's `1fr auto 1fr` columns — no justify-self needed (and it would
   wrongly shrink-to-fit the absolutely-positioned mobile dropdown). */
.nav-links{display:flex;align-items:center;gap:clamp(1rem,0.4rem + 1.6vw,2.2rem);
  list-style:none;margin:0;padding:0}
.nav-links a{color:var(--muted);font-size:0.64rem;font-weight:500;
  letter-spacing:var(--track);text-transform:uppercase;padding:0.4rem 0;position:relative}
.nav-links a:hover{color:var(--ink);opacity:1}
.nav-links a[aria-current=page]{color:var(--ink)}
.nav-links .nav-mark{position:absolute;left:0;right:0;bottom:-4px;height:1.5px;border-radius:2px;
  background:var(--accent)}
.nav-social{display:flex;align-items:center;justify-self:end;gap:1.1rem}
.nav-social a{color:var(--muted);display:inline-flex;transition:color var(--dur) var(--ease)}
.nav-social a:hover{color:var(--accent);opacity:1}
.nav-social svg{width:15px;height:15px}
/* Mobile nav toggle — hidden on desktop, where the links show inline. */
.nav-toggle,.nav-burger{display:none}
@media(max-width:720px){
  .nav{display:flex;justify-content:space-between;gap:0.8rem;min-height:56px}
  /* Hamburger button (a <label> driving the hidden checkbox). */
  .nav-burger{display:inline-flex;position:relative;width:30px;height:30px;cursor:pointer;z-index:2}
  .nav-burger span{position:absolute;left:5px;right:5px;top:50%;height:2px;margin-top:-1px;
    background:var(--ink);border-radius:2px;transition:background 0.15s var(--ease)}
  .nav-burger span::before,.nav-burger span::after{content:"";position:absolute;left:0;right:0;
    height:2px;background:var(--ink);border-radius:2px;
    transition:transform var(--dur) var(--ease),top var(--dur) var(--ease)}
  .nav-burger span::before{top:-7px}
  .nav-burger span::after{top:7px}
  .nav-toggle:checked ~ .nav-burger span{background:transparent}
  .nav-toggle:checked ~ .nav-burger span::before{top:0;transform:rotate(45deg)}
  .nav-toggle:checked ~ .nav-burger span::after{top:0;transform:rotate(-45deg)}
  /* Full-width panel with every link (opt items included), anchored to the sticky header.
     It fades and slides (no max-height animation, which bumped at the end against short
     content). Absolute, so it never pushes the page. */
  .nav-links{position:absolute;left:0;right:0;top:100%;z-index:1;flex-direction:column;
    align-items:stretch;gap:0;padding:0.3rem 0 0.6rem;background:var(--bg);
    border-bottom:1px solid var(--line);box-shadow:var(--shadow-1);
    opacity:0;visibility:hidden;transform:translateY(-8px);
    transition:opacity 0.24s var(--ease),transform 0.24s var(--ease),visibility 0.24s}
  .nav-toggle:checked ~ .nav-links{opacity:1;visibility:visible;transform:translateY(0)}
  .nav-links li{width:100%}
  .nav-links .opt{display:block}
  .nav-links a{display:block;text-align:center;padding:0.9rem 1rem;font-size:0.8rem}
  .nav-links a[aria-current=page]{background:var(--surface-2)}
  .nav-links .nav-mark{display:none}
  .nav-social{display:none}
}

/* ── Doc layout: a sticky left section sidebar for the long content pages ─────── */
/* Below the two-column breakpoint the doc is a normal centred page. */
.doc{max-width:1140px;margin-inline:auto;padding-inline:var(--gutter)}
/* The per-section .wrap is neutralised inside .doc so the grid (not a second centred column)
   controls width; the .doc container supplies the gutter. */
.doc-body .wrap{max-width:none;margin-inline:0;padding-inline:0}
.doc-body [id]{scroll-margin-top:84px}
.doc-nav{display:none}
@media(min-width:1000px){
  /* The sidebar is a deliberate exception to the centred content margin: the whole doc is
     left-aligned so the menu lives in the far-left margin, with content flowing to its right. */
  .doc{max-width:1340px;margin-inline:0 auto;
    padding-inline:clamp(1.1rem,1.6vw,2.4rem) var(--gutter);
    display:grid;grid-template-columns:168px minmax(0,1fr);gap:clamp(1.75rem,1rem + 2.5vw,4rem);
    align-items:start}
  .doc-body{min-width:0}
  /* No overflow clip here: overflow-y:auto would force overflow-x to clip and shave the dots'
     left edge, since they sit at the container's far-left. The section lists are short. */
  .doc-nav{display:block;position:sticky;top:84px;align-self:start}
}
.doc-nav-title{font-family:var(--font-mono);font-size:var(--text-micro);letter-spacing:var(--track);
  text-transform:uppercase;color:var(--faint);margin:0 0 1rem}
.doc-nav-list{list-style:none;margin:0;padding:0;position:relative}
.doc-nav-list::before{content:"";position:absolute;left:3px;top:0.9rem;bottom:0.9rem;width:1px;
  background:var(--line)}
.doc-nav-link{display:flex;align-items:center;gap:0.8rem;padding:0.42rem 0;
  font-family:var(--font-mono);font-size:var(--text-micro);letter-spacing:0.02em;
  color:var(--faint);transition:color var(--dur) var(--ease)}
.doc-nav-link:hover{color:var(--muted);opacity:1}
.doc-nav-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--bg);
  box-shadow:0 0 0 1px var(--line-2);position:relative;z-index:1;
  transition:background 0.2s var(--ease),box-shadow 0.2s var(--ease)}
.doc-nav-link.is-active{color:var(--ink)}
.doc-nav-link.is-active .doc-nav-dot{background:var(--accent);box-shadow:0 0 0 1px var(--accent)}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:0.55rem;padding:0.8rem 1.5rem;
  border-radius:var(--radius);font-weight:500;font-size:0.95rem;letter-spacing:0.01em;
  border:1px solid var(--line-2);color:var(--ink);background:transparent;cursor:pointer;
  transition:transform var(--dur) var(--ease),background var(--dur) var(--ease),
    border-color var(--dur) var(--ease),color var(--dur) var(--ease)}
.btn:hover{transform:translateY(-2px);border-color:var(--ink);opacity:1}
.btn-primary{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.btn-primary:hover{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.btn svg{width:1.05em;height:1.05em}
.btn-row{display:flex;flex-wrap:wrap;gap:0.9rem;align-items:center}
.center .btn-row{justify-content:center}
.textlink{display:inline-flex;align-items:center;gap:0.4rem;font-weight:500;color:var(--ink)}
.textlink svg{width:0.9em;height:0.9em;transition:transform var(--dur) var(--ease)}
.textlink:hover{opacity:1;color:var(--accent)}
.textlink:hover svg{transform:translateX(3px)}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.hero{position:relative;isolation:isolate;padding-block:0;text-align:center}
/* The hero text fills the first screen so the full-bleed banner below always starts under the
   fold — no image peeking at the very top of the page. */
.hero>.wrap{position:relative;z-index:1;min-height:calc(100vh - 56px);
  min-height:calc(100svh - 56px);display:flex;flex-direction:column;justify-content:center;
  padding-block:clamp(2.5rem,6vh,5rem)}
.hero .eyebrow{margin-bottom:2rem}
.hero .btn-row{justify-content:center;margin-top:clamp(2rem,1.4rem + 1.6vw,2.6rem)}
.hero-title{font-size:var(--text-hero);letter-spacing:0.06em;font-weight:500;color:var(--ink);
  margin:0}
.hero-expand{font-size:clamp(0.75rem,0.65rem + 0.5vw,0.95rem);letter-spacing:0.24em;
  text-transform:uppercase;color:var(--muted);margin:1.2rem 0 0;font-weight:500}
/* Home hero image is a full-bleed banner: it lives outside .wrap, so it spans the whole
   page width and sits flush against the next section. */
.hero-figure{margin-top:0;overflow:hidden;
  height:clamp(420px,66vh,820px);position:relative;background:var(--surface-2)}
.hero-figure img,.hero-figure .atmos{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover}
.hero-figure figcaption{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.4rem 1.6rem;
  text-align:left;color:#f6f2ec;font-size:var(--text-small);
  background:linear-gradient(180deg,transparent,rgba(20,16,12,0.5))}

/* ── Signals strip ────────────────────────────────────────────────────────── */
.signals{display:flex;flex-wrap:wrap;justify-content:center;gap:0.6rem 2rem;align-items:baseline;
  margin-top:2.6rem}
.signal{font-size:0.98rem;color:var(--ink);font-weight:500}
.signal.soon{color:var(--faint);font-weight:400}
.signal.soon::after{content:" · soon";color:var(--faint);font-weight:400}

/* ── Section heading block ────────────────────────────────────────────────── */
.head-block{max-width:56ch}
.head-block.center{margin-inline:auto}
.head-block h2{margin-bottom:0.8rem}
.head-block .lead{margin-top:0.6rem}

/* ── Grid / bento ─────────────────────────────────────────────────────────── */
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:clamp(1rem,0.5rem + 1.6vw,1.8rem)}
.bento>*{grid-column:span 6}
@media(min-width:760px){
  .col-2{grid-column:span 2}.col-3{grid-column:span 3}.col-4{grid-column:span 4}
  .col-6{grid-column:span 6}.row-2{grid-row:span 2}
}
.card{height:100%;background:var(--surface);border-radius:var(--radius-lg);
  padding:clamp(1.5rem,1.1rem + 1.2vw,2.2rem);box-shadow:var(--shadow-1);
  transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.card.hoverable:hover{transform:translateY(-4px);box-shadow:var(--shadow-2)}
.card h3{margin-bottom:0.5rem}
.card p{color:var(--muted);margin-bottom:0}
.card .kicker{font-size:var(--text-micro);letter-spacing:var(--track);text-transform:uppercase;
  color:var(--muted);font-weight:500;margin-bottom:1.1rem}
.card-glyph{width:34px;height:34px;color:var(--accent);margin-bottom:1.1rem}
.subsystem-grid{display:grid;gap:clamp(1.6rem,1rem + 2vw,2.8rem);margin-top:2.8rem;
  grid-template-columns:repeat(3,1fr)}
@media(max-width:900px){.subsystem-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.subsystem-grid{grid-template-columns:1fr}}
.feature-plain h3{margin-bottom:0.4rem}
.feature-plain p{color:var(--muted);margin-bottom:0}
.feature-plain .card-glyph{margin-bottom:0.9rem}
.feature-plain .kicker{font-size:var(--text-micro);letter-spacing:var(--track);
  text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:0.5rem}
/* Sticky split - a heading column that holds still beside a column that scrolls past it.
   Home "What it measures". The heading is only sticky on wide screens; below the breakpoint
   the two columns collapse into one ordinary stack, heading first. Layout only, no motion:
   nothing here is scroll-driven, so every entry is visible without JavaScript. */
.sticky-split{display:grid;gap:clamp(2rem,1.4rem + 2vw,3.2rem)}
/* The grid column sets the heading's width; .head-block's own 56ch cap would fight it, and a
   `ch` cap here resolves against the block's 1rem font, not the h2's, so it lands far too narrow. */
.sticky-split-head .head-block{max-width:none}
.sticky-split-head .lead{max-width:30rem}
.sticky-split-body>*+*{margin-top:clamp(2.2rem,1.5rem + 2.2vw,3.8rem);
  padding-top:clamp(2.2rem,1.5rem + 2.2vw,3.8rem);border-top:1px solid var(--line)}
.sticky-split-body p{max-width:54ch}
.sticky-split-body .textlink{margin-top:1.1rem}
@media(min-width:880px){
  .sticky-split{grid-template-columns:repeat(2,minmax(0,1fr));
    gap:clamp(2.4rem,0.5rem + 5vw,6rem);align-items:start}
  /* 68px is .nav's min-height, i.e. the sticky header this must clear. */
  .sticky-split-head{position:sticky;top:calc(68px + clamp(1.4rem,4vh,3rem))}
}
/* The Technology "The subsystems" grid uses the same white square cards. */
.subsystem-grid .feature-plain{background:var(--surface);border-radius:var(--radius-lg);
  padding:clamp(1.5rem,1.1rem + 1.2vw,2.2rem);box-shadow:var(--shadow-1);
  transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.subsystem-grid .feature-plain:hover{transform:translateY(-4px);box-shadow:var(--shadow-2)}
.big{font-weight:500;font-size:clamp(2.4rem,1.6rem + 2.4vw,3.4rem);line-height:1;
  letter-spacing:-0.03em;color:var(--ink)}
.big-unit{font-size:0.85rem;color:var(--muted);font-weight:500;letter-spacing:0.04em}

/* accent (soft, warm) card for CTAs & the live band */
.card-accent{background:var(--accent-soft);box-shadow:var(--shadow-1)}
.card-ink{background:var(--ink);color:var(--bg);box-shadow:none}
.card-ink h2,.card-ink h3{color:var(--bg)}
.card-ink p{color:color-mix(in srgb,var(--bg) 78%,transparent)}
.card-ink .kicker{color:color-mix(in srgb,var(--bg) 66%,transparent)}
.card-ink .btn{border-color:color-mix(in srgb,var(--bg) 34%,transparent);color:var(--bg)}
.card-ink .btn:hover{background:var(--bg);color:var(--ink);border-color:var(--bg)}
.card-ink .btn-primary{background:var(--bg);color:var(--ink)}
.card-ink .stat{background:color-mix(in srgb,var(--bg) 8%,transparent);box-shadow:none;
  border:1px solid color-mix(in srgb,var(--bg) 16%,transparent)}
.card-ink .stat .stat-label{color:color-mix(in srgb,var(--bg) 62%,transparent)}
.card-ink .stat .stat-value{color:var(--bg)}

/* ── Pill image cards ─────────────────────────────────────────────────────── */
/* Four pills across, on the standard content width so the section lines up with the ones above
   and below. Explicit 4-up (not auto-fit, which spawned a phantom 5th column) with a tight gap. */
.pill{position:relative;width:100%;border-radius:var(--radius-lg);overflow:hidden;isolation:isolate;
  aspect-ratio:6/8;background:var(--surface-2);box-shadow:var(--shadow-1);
  transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.pill.wide{aspect-ratio:1/1}
.pill:hover{transform:translateY(-5px);box-shadow:var(--shadow-2)}
.pill img,.pill svg.atmos{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  z-index:0;transition:transform 1.4s var(--ease)}
.pill:hover img,.pill:hover svg.atmos{transform:scale(1.06)}
.pill-scrim{position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg,transparent 45%,rgba(20,16,12,0.62))}
.pill-cap{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.2rem 1.3rem;color:#f6f2ec;
  text-shadow:0 1px 6px rgba(15,12,8,0.45)}
.pill-cap b{display:block;font-weight:600;font-size:1.05rem}
.pill-cap span{display:block;font-size:var(--text-micro);color:rgba(246,242,236,0.8);
  margin-top:0.25rem;letter-spacing:0.02em}
.pill-credit{position:absolute;top:0.8rem;right:1rem;z-index:2;font-size:0.6rem;
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
@media(min-width:1024px){.carousel-track>.pill{flex-basis:calc(33.333% - 8px)}}
.carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;
  width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;color:var(--ink);
  background:color-mix(in srgb,var(--surface) 86%,transparent);box-shadow:var(--shadow-1);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:grid;place-items:center;
  transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
.carousel-prev{left:-10px}.carousel-next{right:-10px}
.carousel-arrow:hover{transform:translateY(-50%) scale(1.06)}
.carousel-arrow svg{width:20px;height:20px}
.carousel-arrow[disabled]{opacity:0;pointer-events:none}
.carousel-dots{display:flex;justify-content:center;gap:8px;margin-top:1.3rem}
.carousel-dot{width:8px;height:8px;padding:0;border:none;border-radius:50%;cursor:pointer;
  background:var(--line-2);transition:background var(--dur) var(--ease),transform var(--dur) var(--ease)}
.carousel-dot[aria-selected="true"]{background:var(--accent);transform:scale(1.3)}
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
.drawings-sub{color:var(--muted);font-size:0.98rem;margin:0.5rem 0 0;max-width:58ch}
.drawings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(1rem,0.6rem + 1vw,1.6rem)}
@media(max-width:600px){.drawings-grid{grid-template-columns:1fr}}
/* .drawing is a <figure>; its UA margin is handled by the scoped `main figure{margin:0}` reset. */
.drawing{background:#fff;border-radius:var(--radius);overflow:hidden;
  box-shadow:var(--shadow-1);transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.drawing:hover{transform:translateY(-4px);box-shadow:var(--shadow-2)}
.drawing img{width:100%;height:auto;display:block}
.drawing figcaption{padding:0.85rem 1.1rem 1rem;border-top:1px solid var(--line);
  color:var(--ink);font-weight:560;font-size:0.98rem}

/* ── Render slot (buoy wall-art, coming soon) ─────────────────────────────── */
.render-slot{position:relative;border-radius:var(--radius-lg);overflow:hidden;
  min-height:clamp(260px,32vw,440px);display:grid;place-items:center;
  box-shadow:var(--ring);background:var(--surface)}
.render-slot .rs-svg{position:absolute;inset:0;width:100%;height:100%;opacity:0.85}
.render-slot .rs-label{position:relative;z-index:2;text-align:center;padding:1.8rem}
.render-slot .rs-label .tag{display:inline-block;font-size:var(--text-micro);font-weight:500;
  letter-spacing:var(--track);text-transform:uppercase;color:var(--muted);
  border:1px solid var(--line-2);border-radius:var(--radius-pill);padding:0.35rem 0.95rem;
  margin-bottom:1.1rem;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.render-slot .rs-label b{display:block;font-size:1.35rem;color:var(--ink);font-weight:560;
  margin-bottom:0.3rem}
.render-slot .rs-label span{color:var(--muted);font-size:0.95rem}

/* ── Steps ────────────────────────────────────────────────────────────────── */
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:clamp(1.4rem,0.8rem + 1.6vw,2.6rem);counter-reset:step}
.step{position:relative;padding-top:3rem}
.step::before{counter-increment:step;content:"0" counter(step);position:absolute;top:0;left:0;
  font-size:0.85rem;font-weight:500;letter-spacing:var(--track);color:var(--accent);
  font-variant-numeric:tabular-nums}
.step h3{font-size:1.12rem;margin-bottom:0.5rem}
.step p{color:var(--muted);margin:0}

/* ── Spec / definition rows ───────────────────────────────────────────────── */
.spec{border-top:1px solid var(--line);margin:0}
.spec-row{display:grid;grid-template-columns:minmax(9rem,14rem) 1fr;gap:0.4rem 1.8rem;
  padding:1.1rem 0;border-bottom:1px solid var(--line);align-items:baseline}
.spec-row dt{font-weight:560;color:var(--ink)}
.spec-row dd{margin:0;color:var(--muted)}
@media(max-width:560px){.spec-row{grid-template-columns:1fr;gap:0.2rem}}

/* ── Data table ───────────────────────────────────────────────────────────── */
.table-scroll{overflow-x:auto;border-radius:0;box-shadow:var(--shadow-1);
  background:var(--surface);-webkit-overflow-scrolling:touch}
table.data{border-collapse:collapse;width:100%;min-width:520px;font-size:0.94rem}
table.data caption{text-align:left;padding:1rem 1.2rem 0;color:var(--muted);
  font-size:var(--text-small)}
table.data th,table.data td{padding:0.8rem 1.2rem;text-align:left;border-bottom:1px solid var(--line)}
table.data thead th{color:var(--muted);font-weight:500;font-size:var(--text-micro);
  letter-spacing:0.08em;text-transform:uppercase}
table.data tbody tr:last-child td{border-bottom:0}
table.data .lvl{font-weight:560;color:var(--ink)}

/* ── Quote / callout ──────────────────────────────────────────────────────── */
.callout{border-left:2px solid var(--accent);padding:0.2rem 0 0.2rem 1.4rem;color:var(--muted)}
.quote{font-weight:400;font-size:clamp(1.5rem,1.1rem + 1.8vw,2.4rem);line-height:1.28;
  color:var(--ink);letter-spacing:-0.02em;max-width:20ch;margin:0}
.quote-cite{display:block;font-size:var(--text-micro);letter-spacing:var(--track);
  text-transform:uppercase;color:var(--muted);margin-top:1.4rem}

/* ── Team ─────────────────────────────────────────────────────────────────── */
.team{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.6rem}
/* Card is a link; on hover an accent outline draws clockwise around the rounded card
   (conic mask over a border, angle animated via @property). No dim, no lift. */
@property --edge-angle{syntax:"<angle>";inherits:true;initial-value:0deg}
.member{display:block;color:inherit;text-decoration:none;background:var(--surface);
  border-radius:var(--radius-lg);position:relative;--edge-angle:0deg;
  padding:clamp(1.6rem,1.2rem + 1vw,2.1rem);box-shadow:var(--shadow-1);
  transition:--edge-angle 0.7s var(--ease)}
.member::after{content:"";position:absolute;inset:0;border-radius:inherit;
  border:2px solid var(--accent);pointer-events:none;
  -webkit-mask:conic-gradient(from -90deg,#000 var(--edge-angle),#0000 0);
          mask:conic-gradient(from -90deg,#000 var(--edge-angle),#0000 0)}
.member:hover{opacity:1;--edge-angle:360deg}
.member:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.member{transition:none}}
.member-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.3rem}
.member .avatar{width:60px;height:60px;border-radius:50%;margin:0;object-fit:cover;display:block}
.member-linkedin{color:var(--faint);display:inline-flex;margin-top:0.2rem;
  transition:color var(--dur) var(--ease)}
.member:hover .member-linkedin,.member:focus-visible .member-linkedin{color:var(--accent)}
.member-linkedin svg{width:19px;height:19px}
.member h3{font-size:1.22rem;margin-bottom:0.2rem}
.member .role{color:var(--accent);font-size:0.9rem;font-weight:500;margin-bottom:1rem}
.member .disc{display:inline-block;font-size:0.6rem;letter-spacing:var(--track);
  text-transform:uppercase;color:var(--muted);border:1px solid var(--line-2);
  border-radius:var(--radius-pill);padding:0.25rem 0.75rem;margin-bottom:1rem}
.member p{color:var(--muted);font-size:0.96rem;line-height:1.6;margin:0}
/* Footer email icon */
.footer-social{display:flex;gap:1rem;margin-top:1.4rem}
.footer-social a{color:var(--muted);display:inline-flex;transition:color var(--dur) var(--ease)}
.footer-social a:hover{color:var(--accent);opacity:1}
.footer-social svg{width:20px;height:20px}

/* ── Chips ────────────────────────────────────────────────────────────────── */
.chip{display:inline-flex;align-items:center;gap:0.45rem;font-size:var(--text-micro);
  font-weight:500;letter-spacing:0.02em;padding:0.3rem 0.8rem;border-radius:var(--radius-pill);
  color:var(--muted);background:color-mix(in srgb,currentColor 12%,var(--surface))}
.chip::before{content:"";width:0.5rem;height:0.5rem;border-radius:50%;background:currentColor}
.chip.ok{color:var(--a-nostress)}.chip.info{color:var(--accent)}

/* ── Footer ───────────────────────────────────────────────────────────────── */
.site-footer{position:relative;isolation:isolate;overflow:hidden;
  border-top:1px solid var(--line);margin-top:var(--section);
  padding-top:clamp(3.4rem,2.4rem + 3vw,5rem);padding-bottom:clamp(1.5rem,1rem + 1vw,2.25rem)}
/* Footer sits flush at the very bottom: the copyright is near the edge and the seaweed reaches
   the edge too, its base fading into it so it never looks sliced. No sand band beneath. */
.footer-seaweed{position:absolute;left:0;right:0;bottom:0;height:200px;
  z-index:0;max-width:1200px;margin-inline:auto;pointer-events:none}
.footer-seaweed .weed{position:absolute;bottom:0;aspect-ratio:144/402;
  -webkit-mask-image:linear-gradient(to top,transparent 0,#000 20%);
  mask-image:linear-gradient(to top,transparent 0,#000 20%)}
.footer-seaweed .weed svg{width:100%;height:100%;display:block}
.weed-a{left:clamp(1rem,2vw,3.5rem);height:172px;opacity:0.5}
.weed-b{right:clamp(1rem,2vw,3.5rem);height:146px;opacity:0.44}
.weed-c{left:44%;height:132px;opacity:0.4}
@media (max-width:640px){.weed-c{display:none}}
@media (prefers-reduced-motion:reduce){.footer-seaweed{display:none}}
/* Ambient footer critters — one submarine, crab, and starfish, spread around the footer and
   sitting behind the text (z-index 0, below the footer-grid). */
.footer-critters{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.footer-critters .critter{position:absolute}
.footer-critters .critter svg{width:100%;height:100%;display:block}
.critter-sub{top:9%;right:6%;width:clamp(72px,7vw,108px);aspect-ratio:512/512;opacity:0.5}
.critter-crab{bottom:8px;left:11%;width:clamp(46px,5vw,70px);aspect-ratio:1/1;opacity:0.62}
.critter-star{bottom:20px;right:17%;width:clamp(38px,4vw,56px);aspect-ratio:63/66;opacity:0.58}
.critter-jelly{top:clamp(3rem,9%,6rem);left:clamp(1rem,3.5vw,4rem);
  width:clamp(88px,9vw,128px);aspect-ratio:1080/1080;opacity:0.92}
@media (max-width:640px){.critter-sub,.critter-jelly{display:none}}
@media (prefers-reduced-motion:reduce){.footer-critters{display:none}}
/* A single ambient critter fixed in a page's side margin — only where real margin exists. */
.side-critter{position:fixed;top:calc(50% + 130px);transform:translateY(-50%);z-index:2;pointer-events:none;
  width:clamp(110px,9vw,168px);opacity:0.72}
.side-critter svg{width:100%;height:100%;display:block}
.side-right{right:clamp(0.5rem,1.6vw,2rem)}
.side-left{left:clamp(0.5rem,1.6vw,2rem)}
@media (max-width:1439px){.side-critter{display:none}}
@media (prefers-reduced-motion:reduce){.side-critter{display:none}}
.footer-grid{position:relative;z-index:1;display:grid;grid-template-columns:2fr 1fr 1fr;gap:2.4rem}
@media(max-width:640px){.footer-grid{grid-template-columns:1fr 1fr}}
.footer-brand{grid-column:1/-1;max-width:38ch}
@media(min-width:641px){.footer-brand{grid-column:auto}}
.footer-brand .brand{margin-bottom:1.1rem}
.footer-brand p{color:var(--muted);font-size:0.94rem;margin:0}
.footer-col h4{font-size:var(--text-micro);letter-spacing:var(--track);text-transform:uppercase;
  color:var(--faint);font-weight:500;margin:0 0 1.1rem}
.footer-col ul{list-style:none;margin:0;padding:0;display:grid;gap:0.6rem}
.footer-col a{color:var(--muted);font-size:0.94rem}
.footer-col a:hover{color:var(--ink);opacity:1}
.footer-base{display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.6rem;
  margin-top:2.8rem;padding-top:1.6rem;border-top:1px solid var(--line);
  color:var(--faint);font-size:var(--text-small)}
@media(max-width:560px){.footer-base{flex-direction:column;align-items:flex-start;gap:0.35rem}}

/* ── Sample-data banner (Analytics) ───────────────────────────────────────── */
.banner{max-width:1140px;margin:1.6rem auto 0;padding:0.9rem 1.3rem;border-radius:var(--radius);
  background:var(--surface);box-shadow:var(--shadow-1);color:var(--muted);font-size:var(--text-small)}
.banner b{color:var(--coral)}

/* ── Page header (inner pages) ────────────────────────────────────────────── */
.page-head{padding-block:clamp(4rem,2.6rem + 5vw,7rem) clamp(1rem,0.5rem + 1vw,2rem)}
.page-head h1{font-size:var(--text-display);max-width:16ch}
.page-head .lead{max-width:56ch;margin-top:1.2rem}
.page-head .dash-meta{margin-top:1.6rem}

/* ── Figures / diagrams ───────────────────────────────────────────────────── */
.flow{width:100%;height:auto;display:block;overflow:visible}
.figure-card{background:var(--surface);border-radius:var(--radius-lg);
  padding:clamp(1.4rem,1rem + 1.4vw,2.4rem);box-shadow:var(--shadow-1)}
.figure-card figcaption{color:var(--muted);font-size:var(--text-small);margin-top:1.2rem;
  text-align:center;max-width:52ch;margin-inline:auto}

/* ══ Analytics dashboard ═══════════════════════════════════════════════════ */
.dash-meta{color:var(--muted);font-size:var(--text-small);display:flex;flex-wrap:wrap;
  gap:0.4rem 1.6rem;font-variant-numeric:tabular-nums}
.dash-meta .k{color:var(--faint);text-transform:uppercase;letter-spacing:0.1em;
  font-size:var(--text-micro);margin-right:0.4rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));
  gap:clamp(0.8rem,0.4rem + 0.8vw,1.2rem);margin:0 0 2.4rem}
.stat{background:var(--surface);border-radius:0;padding:1.1rem 1.25rem;
  box-shadow:var(--shadow-1)}
.stat .stat-label{color:var(--faint);font-size:var(--text-micro);letter-spacing:0.08em;
  text-transform:uppercase;font-weight:500}
.stat .stat-value{font-size:1.55rem;font-weight:560;margin:0.4rem 0 0;line-height:1.1;
  letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.stat .stat-sub{color:var(--muted);font-size:var(--text-micro);margin:0.25rem 0 0}
.panels{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,0.6rem + 1vw,1.6rem)}
@media(max-width:760px){.panels{grid-template-columns:1fr}}
.panel{background:var(--surface);border-radius:var(--radius-lg);padding:1.4rem 1.5rem 1.2rem;
  box-shadow:var(--shadow-1);overflow:hidden}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:0.6rem;
  margin-bottom:0.9rem}
.panel-head h3{font-size:1rem;font-weight:560}
.panel-head .unit{color:var(--faint);font-size:var(--text-micro);letter-spacing:0.03em}
.chart{width:100%;height:auto;display:block;overflow:visible}
.chart .ax{fill:var(--faint);font-size:9px;font-family:var(--font)}
.chart .grid{stroke:var(--line-2);stroke-width:1}
.s-temp{stroke:var(--c-temp)}.f-temp{fill:var(--c-temp)}
.s-dhw{stroke:var(--c-dhw)}.f-dhw{fill:var(--c-dhw)}
.s-turb{stroke:var(--c-turb)}.f-turb{fill:var(--c-turb)}
.s-batt{stroke:var(--c-batt)}.f-batt{fill:var(--c-batt)}
.rl-mmm{stroke:var(--faint)}.tx-mmm{fill:var(--faint)}
.rl-threshold{stroke:var(--a-alert1)}.tx-threshold{fill:var(--a-alert1)}
.rl-a1{stroke:var(--a-alert1)}.tx-a1{fill:var(--a-alert1)}
.rl-a2{stroke:var(--a-alert2)}.tx-a2{fill:var(--a-alert2)}
.mk-event{fill:var(--coral)}
.panel-note{margin:0.8rem 0 0;font-size:var(--text-micro);color:var(--muted);line-height:1.5}
.panel-note .pn-verdict{font-weight:600}
.legend{display:flex;flex-wrap:wrap;gap:0.4rem 1.1rem;margin-top:0.8rem;
  font-size:var(--text-micro);color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:0.4rem}
.legend i{width:0.85rem;height:0.2rem;border-radius:2px;display:inline-block}
.a-nostress{color:var(--a-nostress)}.a-watch{color:var(--a-watch)}
.a-warning{color:var(--a-warning)}.a-alert1{color:var(--a-alert1)}.a-alert2{color:var(--a-alert2)}
.data-links{color:var(--muted);font-size:var(--text-small);margin-top:1.8rem}
.data-links a{font-weight:500}

/* Fleet overview — the network view (telemetry.fleet_web) */
.fleet-strip{margin-bottom:clamp(1.6rem,1rem + 2vw,2.6rem)}
.fleet-grid{display:grid;gap:clamp(1rem,0.6rem + 1vw,1.6rem);
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.buoy-tile{display:flex;flex-direction:column;gap:1.1rem;color:inherit}
.buoy-tile:hover{opacity:1}
.buoy-head{display:flex;align-items:center;justify-content:space-between;gap:0.8rem}
.buoy-head h3{font-size:1.15rem;font-weight:560;letter-spacing:-0.01em;color:var(--ink)}
.alert-badge{font-size:var(--text-micro);font-weight:560;letter-spacing:0.05em;
  text-transform:uppercase;white-space:nowrap;padding:0.3rem 0.72rem;border-radius:var(--radius-pill);
  background:color-mix(in srgb,currentColor 12%,var(--surface))}
.spark{width:100%;height:56px;display:block}
.spark-empty{height:56px;border-radius:var(--radius);background:var(--surface-2)}
.tile-stats{display:grid;grid-template-columns:1fr 1fr;gap:0.7rem 1rem;margin:0}
.tile-stats div{display:flex;flex-direction:column;gap:0.15rem}
.tile-stats dt{color:var(--faint);font-size:var(--text-micro);letter-spacing:0.06em;
  text-transform:uppercase}
.tile-stats dd{margin:0;color:var(--ink);font-weight:560;font-size:0.98rem}
.tile-more{margin-top:auto;color:var(--accent);font-size:var(--text-small);font-weight:500}
.buoy-tile:hover .tile-more{color:var(--accent)}

@media print{.site-header,.site-footer{display:none}}

/* ── Ask Fred — centred frosted-glass chat (Fin-style) ───────────────────────── */
.chat{z-index:60}
.chat-toggle{border:none;background:none;cursor:pointer;color:inherit;padding:0;font:inherit}
/* Navbar launcher (desktop) — matches the GitHub/LinkedIn icons in .nav-social. */
.nav-chat{display:inline-flex;color:var(--muted);transition:color var(--dur) var(--ease)}
.nav-chat:hover,.chat.chat-open .nav-chat{color:var(--accent)}
.nav-chat svg{width:15px;height:15px}
/* Floating launcher — shown only on mobile, where .nav-social is hidden. */
.chat-fab{position:fixed;right:clamp(1rem,2vw,1.6rem);bottom:clamp(1rem,2vw,1.6rem);z-index:60;
  width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--on-accent);
  display:none;place-items:center;box-shadow:var(--shadow-2);
  transition:transform var(--dur) var(--ease),opacity var(--dur) var(--ease)}
.chat-fab:hover{transform:translateY(-2px) scale(1.04)}
.chat-fab svg{width:24px;height:24px}
@media(max-width:720px){.chat-fab{display:grid}}
.chat.chat-open .chat-fab{opacity:0;pointer-events:none}
/* The widget: a centred column holding the frosted conversation card and, detached below it,
   the input pill. The column is click-through (pointer-events:none) so the page stays fully
   usable around and between its pieces — only the card and pill capture clicks. Never dims the
   page; closes only via the header chevron or Escape. */
.chat-panel{position:fixed;left:50%;bottom:clamp(1rem,2vw,1.4rem);z-index:60;pointer-events:none;
  width:min(442px,calc(100vw - 2rem));max-height:calc(100dvh - 2.5rem);
  display:flex;flex-direction:column;gap:0.7rem;
  transform:translateX(-50%) translateY(14px);opacity:0;visibility:hidden;
  transition:opacity .26s ease,transform .3s var(--ease),visibility 0s .3s}
.chat.chat-open .chat-panel{opacity:1;visibility:visible;transform:translateX(-50%);
  transition:opacity .26s ease,transform .32s var(--ease),visibility 0s}
/* Frosted conversation card — smoked deep-ocean glass; the page shows through, blurred. */
.chat-glass{pointer-events:auto;display:flex;flex-direction:column;overflow:hidden;
  height:min(364px,calc(100dvh - 9rem));border-radius:22px;color:#fff;
  background:linear-gradient(155deg,rgba(38,64,68,.62),rgba(15,32,36,.74));
  backdrop-filter:blur(22px) saturate(1.2);-webkit-backdrop-filter:blur(22px) saturate(1.2);
  border:1px solid rgba(255,255,255,.14);box-shadow:0 34px 90px -34px rgba(8,22,26,.65)}
/* Header on the glass. */
.chat-head{display:flex;align-items:center;gap:0.7rem;padding:0.95rem 1.1rem;
  border-bottom:1px solid rgba(255,255,255,.12)}
.chat-avatar{flex:none;width:34px;height:34px;border-radius:50%;background:var(--accent);
  display:grid;place-items:center;overflow:hidden}
.chat-avatar img{width:22px;height:22px;object-fit:contain;display:block;filter:brightness(0) invert(1)}
.chat-id{min-width:0;line-height:1.25}
.chat-id b{display:block;font-size:0.98rem;color:#fff}
.chat-id span{display:block;font-size:var(--text-micro);color:rgba(255,255,255,.62)}
.chat-close{margin-left:auto;border:none;background:none;color:rgba(255,255,255,.72);cursor:pointer;
  padding:0.3rem;display:grid;place-items:center;border-radius:50%}
.chat-close svg{width:20px;height:20px;display:block}
.chat-close:hover{color:#fff;background:rgba(255,255,255,.14)}
/* Messages — bot text plain on the glass, user in a subtle translucent bubble. */
.chat-log{flex:1;min-height:0;overflow-y:auto;padding:1.1rem;display:flex;flex-direction:column;gap:0.95rem}
.chat-row{display:flex;flex-direction:column;max-width:88%}
.chat-row-user{align-self:flex-end;align-items:flex-end}
.chat-row-bot{align-self:flex-start;align-items:flex-start;max-width:94%}
.chat-msg{font-size:0.95rem;line-height:1.55}
.chat-bot{color:rgba(255,255,255,.92)}
.chat-user{padding:0.55rem 0.85rem;border-radius:16px;border-bottom-right-radius:5px;
  background:rgba(255,255,255,.16);color:#fff}
.chat-meta{margin-top:0.32rem;font-size:var(--text-micro);color:rgba(255,255,255,.5)}
.chat-typing{color:rgba(255,255,255,.55);letter-spacing:0.18em}
/* Starter-question chips shown with the greeting — translucent light chips on the glass. */
.chat-chips{display:flex;flex-wrap:wrap;gap:0.45rem;margin-top:0.15rem}
.chat-chip{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.07);color:#fff;
  border-radius:999px;padding:0.42rem 0.85rem;font:inherit;font-size:0.83rem;cursor:pointer;
  transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}
.chat-chip:hover{background:rgba(255,255,255,.17);border-color:rgba(255,255,255,.42)}
/* Composer — a detached solid pill floating below the glass. */
.chat-form{pointer-events:auto;display:flex;flex-direction:column}
.chat-field{display:flex;align-items:center;gap:0.5rem;background:var(--surface);
  border:1px solid var(--line);border-radius:999px;padding:0.35rem 0.35rem 0.35rem 1.15rem;
  box-shadow:0 18px 44px -22px rgba(8,22,26,.5);transition:border-color var(--dur) var(--ease)}
.chat-field:focus-within{border-color:var(--accent)}
.chat-input{flex:1;min-width:0;border:none;background:none;padding:0.5rem 0;font:inherit;
  font-size:0.95rem;color:var(--ink)}
.chat-input::placeholder{color:var(--muted)}
.chat-input:focus{outline:none}
.chat-send{flex:none;width:40px;height:40px;border:none;border-radius:50%;background:var(--accent);
  color:var(--on-accent);display:grid;place-items:center;cursor:pointer;
  transition:filter var(--dur) var(--ease)}
.chat-send:hover{filter:brightness(1.08)}
.chat-send svg{width:18px;height:18px}
@media(max-width:720px){
  .chat-panel{width:calc(100vw - 1.4rem);max-height:calc(100dvh - 1.4rem)}
  .chat-glass{height:calc(100dvh - 8rem)}}
@media (prefers-reduced-motion:reduce){
  .chat-fab,.chat.chat-open .chat-fab,.chat-panel,.chat.chat-open .chat-panel{transition:none}}
"""
