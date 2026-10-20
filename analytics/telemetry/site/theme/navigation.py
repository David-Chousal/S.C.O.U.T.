"""The site header, the transparent-over-hero state, and the doc sidebar."""

CSS = """/* ── Header / nav ─────────────────────────────────────────────────────────── */
.site-header{position:sticky;top:0;z-index:50;
  background:color-mix(in srgb,var(--bg) 67%,transparent);
  backdrop-filter:saturate(1.3) blur(16px);-webkit-backdrop-filter:saturate(1.3) blur(16px)}
/* Over the home hero the header floats on the photograph: no sand bar cutting the top of the
   frame. `html.at-top` is seeded by the inline head script before first paint (no sand flash
   on load), then kept by reveal.js from a sentinel spanning the hero, so the header fades to
   its normal sand only once it has scrolled past the photograph. Scoped to `.page-home` — every other page has a light ground under
   the header and must keep its dark type. */
.page-home .site-header{transition:background var(--dur) var(--ease),
  backdrop-filter var(--dur) var(--ease)}
html.at-top .page-home .site-header{background:transparent;backdrop-filter:none;
  -webkit-backdrop-filter:none}
html.at-top .page-home .site-header .brand,
html.at-top .page-home .site-header .nav-links a[aria-current=page]{color:#fbf8f4}
/* The brand mark is black raster artwork, so `color` cannot reach it — it stayed dark against
   the photograph while every other header element inverted. Same whitening filter the chat
   avatar uses on the same asset. Transitioned so it changes with the header, not after it. */
.brand .mark{transition:filter var(--dur) var(--ease)}
html.at-top .page-home .site-header .brand .mark{filter:brightness(0) invert(1)}
html.at-top .page-home .site-header .nav-links a,
html.at-top .page-home .site-header .nav-social a,
html.at-top .page-home .site-header .nav-chat{color:rgba(251,248,244,0.92)}
html.at-top .page-home .site-header .nav-links a:hover,
html.at-top .page-home .site-header .nav-social a:hover,
html.at-top .page-home .site-header .nav-chat:hover{color:#fff}
html.at-top .page-home .site-header .nav-burger span,
html.at-top .page-home .site-header .nav-burger span::before,
html.at-top .page-home .site-header .nav-burger span::after{background:#fbf8f4}
/* The sentinel is a zero-height marker, never a visible element. */
/* Spans the hero minus one header height, so it stays on screen exactly while the header is
   still over the photograph — not just for the first pixel of scroll. */
.hero-sentinel{position:absolute;top:0;bottom:var(--nav-h);left:0;width:1px;pointer-events:none}
/* Three-column header: brand left, nav menu centred, social icons right. */
.nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.4rem;min-height:68px}
.brand{display:inline-flex;align-items:center;gap:0.7rem;color:var(--ink);justify-self:start}
.brand:hover{opacity:1}
.brand .mark{width:26px;height:26px;flex:none}
.brand-txt{display:flex;flex-direction:column;line-height:1.1}
.brand-txt b{font-weight:700;letter-spacing:0.02em;font-size:0.85rem}
.brand-txt span{font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);
  margin-top:2px}
/* Centred by the header grid's `1fr auto 1fr` columns — no justify-self needed (and it would
   wrongly shrink-to-fit the absolutely-positioned mobile dropdown). */
.nav-links{display:flex;align-items:center;gap:clamp(1rem,0.4rem + 1.6vw,2.2rem);
  list-style:none;margin:0;padding:0}
.nav-links a{color:var(--muted);font-size:0.75rem;font-weight:500;
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
  text-transform:uppercase;color:var(--color-text-subtle);margin:0 0 1rem}
.doc-nav-list{list-style:none;margin:0;padding:0;position:relative}
.doc-nav-list::before{content:"";position:absolute;left:3px;top:0.9rem;bottom:0.9rem;width:1px;
  background:var(--line)}
.doc-nav-link{display:flex;align-items:center;gap:0.8rem;padding:0.42rem 0;
  font-family:var(--font-mono);font-size:var(--text-micro);letter-spacing:0.02em;
  color:var(--color-text-subtle);transition:color var(--dur) var(--ease)}
.doc-nav-link:hover{color:var(--muted);opacity:1}
.doc-nav-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--bg);
  box-shadow:0 0 0 1px var(--line-2);position:relative;z-index:1;
  transition:background 0.2s var(--ease),box-shadow 0.2s var(--ease)}
.doc-nav-link.is-active{color:var(--ink)}
.doc-nav-link.is-active .doc-nav-dot{background:var(--accent);box-shadow:0 0 0 1px var(--accent)}

"""
