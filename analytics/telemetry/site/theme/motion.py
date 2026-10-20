"""Scroll reveals, hero arrival and scroll-driven layers, all gated on html.js-reveal."""

CSS = """/* ── Motion: scroll reveals and scroll-driven drama ───────────────────────── */
/* Everything here is opt-in and fails open. The hiding rules are scoped to `html.js-reveal`,
   a class only the inline head script sets, so: no JavaScript -> no class -> nothing is ever
   hidden. Reduced motion is honoured by keeping `.reveal` fully visible rather than by
   speeding the animation up. Only transform and opacity animate, so the work stays off the
   main thread. */
/* A plain fade, and nothing else. Three passes got here: 26px over 900ms stepping to 350ms,
   then 14px over 520ms stepping to 180ms, now no movement and no stagger at all. The travel and
   the stagger were what made the page feel like it was assembling itself in front of the
   reader — distance is what the eye tracks, and a stagger draws attention to the sequence. What
   is left is content arriving at full opacity a beat after it enters view, which reads as the
   page settling rather than as an effect. */
html.js-reveal .reveal{opacity:0;transition:opacity 400ms var(--ease);will-change:opacity}
html.js-reveal .reveal.is-in{opacity:1;will-change:auto}
@media (prefers-reduced-motion:reduce){
  html.js-reveal .reveal{opacity:1;transition:none}
}

/* The hero photograph is STATIC. It used to settle out of an overscale over 1900ms, which was
   wrong for the only way most readers reach this page: a same-site navigation. Page-to-page
   moves use a cross-document view transition whose `page-in` is 400ms, and the browser shows a
   frozen snapshot of the incoming page for that whole window — so the reader saw the hero held
   at scale(1.16), then the live DOM took over only 21% through the zoom and kept moving for
   another 1.5s. That hand-off read as the image snapping into place. A long load-time animation
   cannot coexist with a short navigation transition; the photograph simply rests.

   The 1.06 is a fixed framing, not an animation end-state, and it sits outside the
   reduced-motion query on purpose: it is composition, not motion, so every reader gets the same
   crop — and therefore the same contrast the hero scrim was measured against. */
.hero .hero-figure img,.hero .hero-figure .atmos{transform:scale(1.06)}

/* The type still rises, but inside the transition's window rather than long after it. The last
   element now lands at 630ms against a 400ms transition; it used to land at 1520ms, which is
   the same defect the photograph had. */
@media (prefers-reduced-motion:no-preference){
  /* `both` fill means the resting state before the animation runs is `from` — opacity 0. That
     is a content trap if the animation never starts, so it is gated on the same flag as the
     reveals: no JavaScript, no hiding. */
  html.js-reveal .hero-body>*{animation:hero-rise 420ms var(--ease) both}
  html.js-reveal .hero-body>*:nth-child(1){animation-delay:0ms}
  html.js-reveal .hero-body>*:nth-child(2){animation-delay:70ms}
  html.js-reveal .hero-body>*:nth-child(3){animation-delay:140ms}
  html.js-reveal .hero-body>*:nth-child(n+4){animation-delay:210ms}
  @keyframes hero-rise{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
}

/* Scroll-driven layers. `animation-timeline` runs on the compositor and needs no JavaScript;
   browsers without it simply get the static composition, which is why every `from` state here
   is also a perfectly good resting state. */
@supports (animation-timeline:scroll()){
  @media (prefers-reduced-motion:no-preference){
    /* The hero photograph drifts and deepens as the first screen leaves — the parallax that
       makes the type feel like it is in front of the water rather than on top of it. */
    .hero .hero-figure{animation:hero-parallax linear both;
      animation-timeline:scroll(root);animation-range:0 100vh}
    @keyframes hero-parallax{to{transform:translate3d(0,12%,0) scale(1.10)}}
    /* The type and scrim fade as they pass, so the hand-off to the sand page is a dissolve
       rather than a cut. */
    .hero-body{animation:hero-depart linear both;
      animation-timeline:scroll(root);animation-range:10vh 78vh}
    @keyframes hero-depart{to{opacity:0;transform:translate3d(0,-40px,0)}}
  }
}

@media print{.site-header,.site-footer{display:none}}

"""
