/* Ambient Lottie animations, self-hosted, on every page.
   Fixed animations only: any element with a data-lottie path (hero fish, footer seaweed and
   critters). Respects prefers-reduced-motion, and no-ops if the runtime is unavailable. */
(function () {
  if (typeof lottie === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Fixed, looping animations declared in the markup.
  var nodes = document.querySelectorAll('[data-lottie]');
  for (var i = 0; i < nodes.length; i++) {
    lottie.loadAnimation({
      container: nodes[i], renderer: 'svg', loop: true, autoplay: true,
      path: nodes[i].getAttribute('data-lottie'),
      rendererSettings: { progressiveLoad: true }
    });
  }
})();

/* Same-page link guard. Clicking a nav item (or the logo) for the page you are already on
   should stay put — not reload or run the cross-document page transition. In-page #anchor
   links (e.g. the section sidebar) and links to other pages are left to behave normally. */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (url.origin === location.origin && url.pathname === location.pathname && !url.hash) {
      e.preventDefault();
    }
  });
})();
