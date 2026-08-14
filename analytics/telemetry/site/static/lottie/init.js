/* Home hero ambient fish. Self-hosted; runs only on the Home page. Respects reduced-motion,
   and no-ops if the runtime or container is missing (so the page degrades to no animation). */
(function () {
  var el = document.getElementById('hero-fish');
  if (!el || typeof lottie === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lottie.loadAnimation({
    container: el,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'assets/lottie/fish.json',
    rendererSettings: { progressiveLoad: true }
  });
})();
