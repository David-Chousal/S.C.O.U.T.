"""Tokens on :root, the reset, view transitions, type, links and layout primitives."""

CSS = """
:root{
  color-scheme:light only;
  /* The site is deliberately light-only: one sandy canvas regardless of the OS colour scheme.
     Colours, space, z-index and motion live in theme/tokens.py; this block holds the type
     scale, layout measures and the two shadows. */
  --shadow-1:0 12px 32px -22px rgba(42,37,32,0.18);
  --shadow-2:0 22px 52px -30px rgba(42,37,32,0.26);
  --font-sans:'DM Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace;

  --text-hero:clamp(3rem,1.6rem + 6vw,6.4rem);
  --text-display:clamp(2.4rem,1.4rem + 4.2vw,4.6rem);
  --text-h2:clamp(1.6rem,1.2rem + 1.5vw,2.3rem);
  --text-h3:clamp(1.15rem,1rem + 0.6vw,1.4rem);
  --text-lead:clamp(1.125rem,1.02rem + 0.5vw,1.375rem);
  --text-body:clamp(1rem,0.97rem + 0.16vw,1.0625rem);
  --text-small:0.875rem;
  --text-micro:0.75rem;
  --track-micro:0.14em;

  --measure:64ch;
  --space-gutter:clamp(1.4rem,0.8rem + 3vw,4rem);
  --space-stack:clamp(2.2rem,1.5rem + 2.2vw,3.8rem);
  --space-section:clamp(5rem,3.4rem + 8vw,11rem);
  --radius-pill:999px;
  --nav-h:68px;       /* .nav min-height; the hero pulls up by exactly this */
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;background:var(--color-canvas);color:var(--color-text);
  font-family:var(--font-sans);font-size:var(--text-body);line-height:1.7;font-weight:400;
  font-optical-sizing:auto;
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
    animation-timing-function:var(--ease-settle)}
  ::view-transition-old(root){animation:page-out 280ms var(--ease-settle) both}
  ::view-transition-new(root){animation:page-in 400ms var(--ease-settle) both}
  @keyframes page-out{to{opacity:0;transform:translateX(-4%)}}
  @keyframes page-in{from{opacity:0;transform:translateX(4%)}}
}
h1,h2,h3,h4{font-family:var(--font-sans);font-weight:500;line-height:1.1;
  letter-spacing:-0.02em;color:var(--color-text);margin:0}
h1{font-weight:500}
h2{font-size:var(--text-h2)}
h3{font-size:var(--text-h3);letter-spacing:-0.01em;font-weight:500}
p{margin:0 0 1.15em}
a{color:var(--color-accent);text-decoration:none;transition:color var(--dur-quick) var(--ease-standard),
  opacity var(--dur-quick) var(--ease-standard)}
a:hover{opacity:0.7}
/* Links inside running text carry an underline: their colour alone is only 2.3:1 against the
   body text around them (WCAG 1.4.1). Classed links — buttons, nav, cards — are recognisable
   by form and position. */
main :where(p,li,dd,td) a:not([class]){text-decoration:underline;text-decoration-thickness:1px;
  text-underline-offset:0.2em}
main :where(p,li,dd,td) a:not([class]):hover{opacity:1;text-decoration-thickness:2px}
strong{font-weight:600;color:var(--color-text)}
em{font-style:italic}
code{font-family:var(--font-mono);font-size:0.9em;background:var(--color-canvas-sunken);
  padding:0.1em 0.4em;border-radius:var(--radius-xs)}
:focus-visible{outline:2px solid var(--color-accent);outline-offset:3px;border-radius:4px}
img{max-width:100%;height:auto;display:block}
/* Reset the browser default figure margin (margin:1em 40px), scoped to page content only —
   never the header or footer, so their layout is untouched. */
main figure{margin:0}
::selection{background:var(--color-accent);color:var(--color-on-accent)}
.skip{position:absolute;left:-999px;top:0;z-index:var(--z-skip);padding:0.6rem 1rem;background:var(--color-text);
  color:var(--color-canvas);border-radius:0 0 10px 0;font-weight:500}
.skip:focus{left:0}

.wrap{width:100%;max-width:1140px;margin-inline:auto;padding-inline:var(--space-gutter)}
.narrow{max-width:940px}
.prose{max-width:var(--measure)}
.prose p,.prose li{color:var(--color-text-muted)}
.prose strong{color:var(--color-text)}

/* The instrument face: anything the buoy measured or specifies. */
.mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.micro-mono{font-family:var(--font-mono);font-size:var(--text-micro);letter-spacing:0.08em;
  text-transform:uppercase;color:var(--color-text-subtle)}
.subtle{color:var(--color-text-subtle);font-size:var(--text-small)}
/* The signature micro-label */
.eyebrow{font-size:var(--text-micro);font-weight:500;letter-spacing:var(--track-micro);
  text-transform:uppercase;color:var(--color-text-subtle);margin:0 0 1.4rem}
.lead{font-size:var(--text-lead);line-height:1.55;color:var(--color-text-muted);font-weight:400}
.section{padding-block:var(--space-section)}
.section-sm{padding-block:clamp(3.4rem,2.4rem + 4vw,6rem)}
.divider{height:1px;background:var(--color-line)}
.center{text-align:center}
.center .lead{margin-inline:auto}

"""
