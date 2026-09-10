/* Scroll reveals — the one piece of scroll-dependent motion on the site.
 *
 * Progressive enhancement, three ways, because content must never be trapped invisible:
 *   1. No JavaScript      -> `html.js-reveal` is never set, so the hiding CSS never applies.
 *   2. This file fails to load -> the inline head script's watchdog clears the flag after 4s.
 *   3. No IntersectionObserver -> everything is revealed immediately below.
 * `prefers-reduced-motion: reduce` is handled in CSS, which keeps `.reveal` fully visible.
 *
 * Elements animate transform + opacity only, so the work stays on the compositor.
 */
(function () {
  "use strict";

  var root = document.documentElement;

  function revealAll() {
    var all = document.querySelectorAll(".reveal");
    for (var i = 0; i < all.length; i++) all[i].classList.add("is-in");
  }

  function start() {
    // Cancel the head watchdog: this file is alive, so the CSS may keep hiding until we say so.
    if (window.__scoutRevealWatchdog) {
      clearTimeout(window.__scoutRevealWatchdog);
      window.__scoutRevealWatchdog = null;
    }

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);          // one-shot: never re-hide content the reader has seen
      }
    }, {
      // Fire a little before the element's top edge reaches the viewport bottom, so the motion
      // reads as "arriving" rather than "already there".
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.01
    });

    var nodes = document.querySelectorAll(".reveal");
    for (var i = 0; i < nodes.length; i++) io.observe(nodes[i]);

    headerOverHero();
  }

  /* The home header floats transparent while it is over the hero photograph. Driven by a
   * sentinel at the top of the hero rather than a scroll listener, so there is no per-frame
   * work: the observer fires twice per visit, on the way out and on the way back. */
  function headerOverHero() {
    var sentinel = document.querySelector(".hero-sentinel");
    if (!sentinel || !("IntersectionObserver" in window)) return;
    // Seed from the real scroll position rather than assuming the top: a visit that lands on
    // an in-page anchor starts scrolled, and a transparent header over sand would be unreadable.
    root.classList.toggle("at-top", (window.scrollY || 0) < 10);
    new IntersectionObserver(function (entries) {
      root.classList.toggle("at-top", entries[0].isIntersecting);
    }, { rootMargin: "0px" }).observe(sentinel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
