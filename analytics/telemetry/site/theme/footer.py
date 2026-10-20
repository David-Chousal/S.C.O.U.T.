"""The footer and its ambient critters, the sample-data banner, inner page headers, figures."""

CSS = """/* ── Footer ───────────────────────────────────────────────────────────────── */
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
  background:linear-gradient(90deg,transparent,var(--line-2) 20%,var(--line-2) 80%,transparent)}
.page-head h1{font-size:clamp(2.4rem,1.4rem + 4.2vw,4.6rem);max-width:16ch;
  letter-spacing:-0.035em;line-height:1.02}
.page-head .lead{max-width:56ch;margin-top:1.2rem}
.page-head .dash-meta{margin-top:1.6rem}
/* Above-the-fold content animates on load, never on scroll: an IntersectionObserver would
   leave the first paint blank for a frame. */
@media (prefers-reduced-motion:no-preference){
  html.js-reveal .page-head .wrap>*{animation:hero-rise 900ms var(--ease) both}
  html.js-reveal .page-head .wrap>*:nth-child(1){animation-delay:80ms}
  html.js-reveal .page-head .wrap>*:nth-child(2){animation-delay:190ms}
  html.js-reveal .page-head .wrap>*:nth-child(3){animation-delay:300ms}
  html.js-reveal .page-head .wrap>*:nth-child(n+4){animation-delay:400ms}
}

/* ── Figures / diagrams ───────────────────────────────────────────────────── */
.flow{width:100%;height:auto;display:block;overflow:visible}
.figure-card{background:var(--surface);border-radius:var(--radius-lg);
  padding:clamp(1.4rem,1rem + 1.4vw,2.4rem);box-shadow:var(--shadow-1)}
.figure-card figcaption{color:var(--muted);font-size:var(--text-small);margin-top:1.2rem;
  text-align:center;max-width:52ch;margin-inline:auto}

"""
