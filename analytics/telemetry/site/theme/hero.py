"""Buttons, text links, the photographic hero, and section heading blocks."""

CSS = """/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:0.55rem;padding:0.8rem 1.5rem;
  border-radius:var(--radius-pill);font-weight:500;font-size:0.95rem;letter-spacing:0.01em;
  white-space:nowrap;max-width:100%;
  border:1px solid var(--color-line-strong);color:var(--color-text);background:transparent;cursor:pointer;
  transition:transform var(--dur-settle) var(--ease-settle),background var(--dur-quick) var(--ease-standard),
    border-color var(--dur-quick) var(--ease-standard),color var(--dur-quick) var(--ease-standard)}
.btn:hover{transform:translateY(-2px);border-color:var(--color-text);opacity:1}
.btn-primary{background:var(--color-text);color:var(--color-canvas);border-color:var(--color-text)}
.btn-primary:hover{background:var(--color-accent);border-color:var(--color-accent);color:var(--color-on-accent)}
.btn svg{width:1.05em;height:1.05em}
.btn-row{display:flex;flex-wrap:wrap;gap:0.9rem;align-items:center}
.center .btn-row{justify-content:center}
.textlink{display:inline-flex;align-items:center;gap:0.4rem;font-weight:500;color:var(--color-text)}
.textlink svg{width:0.9em;height:0.9em;transition:transform var(--dur-settle) var(--ease-settle)}
.textlink:hover{opacity:1;color:var(--color-accent)}
.textlink:hover svg{transform:translateX(3px)}

/* Over the home hero the header floats on the photograph: no sand bar cutting the top of the
   frame. `html.at-top` is seeded by the inline head script before first paint (no sand flash
   on load), then kept by reveal.js from a sentinel spanning the hero, so the header fades to
   its normal sand only once it has scrolled past the photograph. Wide screens only: on a phone
   the header stays the sand bar, so its drop-down menu keeps dark type. Scoped to `.page-home` — every other page has a light ground under
   the header and must keep its dark type. */
@media(min-width:721px){.page-home .site-header{transition:background var(--dur-quick) var(--ease-standard),
  backdrop-filter var(--dur-settle) var(--ease-settle)}
html.at-top .page-home .site-header{background:transparent;backdrop-filter:none;
  -webkit-backdrop-filter:none}
html.at-top .page-home .site-header .brand,
html.at-top .page-home .site-header .nav-links a[aria-current=page]{color:#fbf8f4}
/* The brand mark is black raster artwork, so `color` cannot reach it — it stayed dark against
   the photograph while every other header element inverted. Same whitening filter the chat
   avatar uses on the same asset. Transitioned so it changes with the header, not after it. */
.brand .mark{transition:filter var(--dur-quick) var(--ease-standard)}
html.at-top .page-home .site-header .brand .mark{filter:brightness(0) invert(1)}
html.at-top .page-home .site-header .nav-links a,
html.at-top .page-home .site-header .nav-social a,
html.at-top .page-home .site-header .nav-chat{color:rgba(251,248,244,0.92)}
html.at-top .page-home .site-header .nav-links a:hover,
html.at-top .page-home .site-header .nav-social a:hover,
html.at-top .page-home .site-header .nav-chat:hover{color:#fff}}
/* The sentinel is a zero-height marker, never a visible element. */
/* Spans the hero minus one header height, so it stays on screen exactly while the header is
   still over the photograph — not just for the first pixel of scroll. */
.hero-sentinel{position:absolute;top:0;bottom:var(--nav-h);left:0;width:1px;pointer-events:none}
/* ── Hero ─────────────────────────────────────────────────────────────────── */
/* A full-viewport cinematic stage: the photograph is the backdrop and the type sits over it,
   rather than a text screen stacked above a banner. The whole hero re-points the palette
   tokens to their dark-ground equivalents, so every child (buttons, eyebrow, signals) inverts
   through the cascade instead of needing its own override. */
.hero{
  --color-text:#fbf8f4;             /* h1, .btn text, .btn-primary ground, .textlink */
  --color-canvas:#101d24;           /* .btn-primary label, read against the cream ground */
  --color-text-muted:rgba(251,248,244,0.80);
  --color-text-subtle:rgba(251,248,244,0.80);  /* eyebrow, hero-expand: measured on the scrim */
  --color-line-strong:rgba(251,248,244,0.42);  /* .btn border */
  position:relative;isolation:isolate;padding-block:0;text-align:center;overflow:hidden;
  /* Pulled up under the sticky header so the photograph runs to the very top of the page and
     the first screen is a true full viewport, not a viewport minus the nav. `.hero-body`
     carries the header's height back as padding so the type still optically centres. */
  margin-top:calc(var(--nav-h) * -1);padding-top:var(--nav-h);
  min-height:100vh;min-height:100svh;display:flex;flex-direction:column;
  justify-content:center;background:#0d171d}
/* GENERIC media figure. `.hero-figure` is NOT hero-only — Science's "Bleaching alert levels"
   section reuses the class for its bleaching photograph, so this block must keep describing a
   normal-flow, fixed-height, cover-cropped figure. Every hero-specific change below is scoped
   to `.hero .hero-figure`. Scoping this wrong tears the Science figure out of the document
   flow, which is exactly what happened the first time. */
.hero-figure{margin-top:0;overflow:hidden;height:clamp(420px,66vh,820px);position:relative;
  background:var(--color-canvas-sunken)}
.hero-figure img,.hero-figure .atmos{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover}
.hero-figure figcaption{position:absolute;left:0;right:0;bottom:0;z-index:2;
  padding:1.4rem 1.6rem;text-align:left;color:#f6f2ec;font-size:var(--text-small);
  background:linear-gradient(180deg,transparent,rgba(20,16,12,0.5))}
/* HERO ONLY: the figure stops being a banner and becomes the full-screen backdrop. */
.hero .hero-figure{position:absolute;inset:0;height:auto;z-index:0;margin:0}
/* Layered scrim: darkest through the middle where the title sits (so contrast is carried by
   the gradient, not by luck about how bright the photo is there) and at the very bottom for
   the caption, while the corners stay open so the reef is still legible as a reef. */
/* The radial is sized and stepped to the *type column*, not to taste: each stop was set by
   measuring the worst-case contrast on the real glyph boxes over the real photograph, since
   the hero text is centred and its block boxes run far wider than its letters. Corners stay
   near 0.45 alpha so the reef still reads as a reef. Re-measure if the photo is ever
   replaced — a brighter frame moves every one of these numbers. */
.hero-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:
    radial-gradient(105% 88% at 50% 47%,rgba(4,10,14,0.72) 0%,rgba(4,10,14,0.58) 40%,
      rgba(4,10,14,0.34) 66%,rgba(4,10,14,0.10) 85%,rgba(4,10,14,0) 100%),
    linear-gradient(180deg,rgba(8,16,21,0.62) 0%,rgba(8,16,21,0.44) 38%,
      rgba(8,16,21,0.54) 72%,rgba(6,12,16,0.88) 100%)}
.hero-body{position:relative;z-index:3;width:100%;
  padding-block:clamp(5rem,12vh,9rem) clamp(7rem,16vh,11rem)}
.hero .eyebrow{margin-bottom:2rem}
.hero .btn-row{justify-content:center;margin-top:clamp(2rem,1.4rem + 1.6vw,2.6rem)}
.hero-title{font-size:var(--text-hero);letter-spacing:0.06em;font-weight:500;color:var(--color-text);
  margin:0;text-shadow:0 2px 30px rgba(4,10,14,0.55)}
.hero-expand{font-size:clamp(0.75rem,0.65rem + 0.5vw,0.95rem);letter-spacing:0.24em;
  text-transform:uppercase;color:var(--color-text-subtle);margin:1.2rem 0 0;font-weight:500}
/* The instrument strip: the project's true phase (or live status) in the instrument face. */
.hero-strip{margin:clamp(1.6rem,1.2rem + 1vw,2.2rem) auto 0;font-family:var(--font-mono);
  font-size:var(--text-micro);letter-spacing:0.08em;text-transform:uppercase;
  color:var(--color-text-muted);display:flex;justify-content:center;flex-wrap:wrap;gap:0.4rem 0.8rem}
.hero-strip-live .status{color:var(--color-text-muted)}
.hero-strip-live .status-text{text-transform:none;letter-spacing:0}

/* ── Section heading block ────────────────────────────────────────────────── */
.head-block{max-width:56ch}
.head-block.center{margin-inline:auto}
.head-block h2{margin-bottom:0.8rem}
.head-block .lead{margin-top:0.6rem}

"""
