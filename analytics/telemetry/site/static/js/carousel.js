/* Progressive-enhancement carousel for [data-carousel] blocks.
 * Uses native CSS scroll-snap; JS only adds arrows, dots, and end-disabling.
 * Without JS the track is still a horizontally scrollable, snapping strip. */
(function () {
  function init(root) {
    var track = root.querySelector('.carousel-track');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return; // nothing to page through

    var prev = root.querySelector('.carousel-prev');
    var next = root.querySelector('.carousel-next');
    var dotsWrap = root.querySelector('.carousel-dots');

    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'carousel-dot';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        d.addEventListener('click', function () { scrollToIndex(i); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }

    function currentIndex() {
      var center = track.scrollLeft + track.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      slides.forEach(function (s, i) {
        var c = s.offsetLeft + s.offsetWidth / 2;
        var dist = Math.abs(c - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function scrollToIndex(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var s = slides[i];
      track.scrollTo({
        left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2,
        behavior: 'smooth'
      });
    }

    function update() {
      var idx = currentIndex();
      dots.forEach(function (d, i) {
        d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    if (prev) prev.addEventListener('click', function () { scrollToIndex(currentIndex() - 1); });
    if (next) next.addEventListener('click', function () { scrollToIndex(currentIndex() + 1); });

    var raf;
    track.addEventListener('scroll', function () {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);

    update();

    // Autoplay: advance every INTERVAL, loop back at the end. Pauses on hover, keyboard
    // focus, and when the tab is hidden. Disabled entirely under prefers-reduced-motion.
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      var INTERVAL = 5000;
      var paused = false;
      function atEnd() {
        return track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      }
      setInterval(function () {
        if (paused) return;
        if (atEnd()) scrollToIndex(0);
        else scrollToIndex(currentIndex() + 1);
      }, INTERVAL);
      var pause = function () { paused = true; };
      var resume = function () { paused = false; };
      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', resume);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', resume);
      document.addEventListener('visibilitychange', function () { paused = document.hidden; });
    }
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), init);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
