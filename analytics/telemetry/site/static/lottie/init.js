/* Ambient Lottie animations (hero fish, footer seaweed). Self-hosted; loaded on every page
   except the self-contained Analytics page. Each container carries a data-lottie path. Respects
   reduced-motion, and no-ops if the runtime is unavailable so the page degrades to no animation. */
(function () {
  if (typeof lottie === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var nodes = document.querySelectorAll('[data-lottie]');
  for (var i = 0; i < nodes.length; i++) {
    lottie.loadAnimation({
      container: nodes[i],
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: nodes[i].getAttribute('data-lottie'),
      rendererSettings: { progressiveLoad: true }
    });
  }
})();
