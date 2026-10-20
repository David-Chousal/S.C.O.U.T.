"""Tokens on :root, the reset, view transitions, type, links and layout primitives."""

CSS = """
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
  --nav-h:68px;       /* .nav min-height; the hero pulls up by exactly this */
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

"""
