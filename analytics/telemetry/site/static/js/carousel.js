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
        d.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + slides.length);
        d.addEventListener('click', function () { scrollToIndex(i); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }

    // Where the track scrolls to centre slide i, clamped to its ends. With several slides on screen the first and
    // last cannot reach the centre, so a dot asked for one of them is remembered while the track stays put.
    var wanted = null;
    function leftFor(i) {
      var s = slides[i], max = track.scrollWidth - track.clientWidth;
      return Math.max(0, Math.min(max, s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2));
    }

    function currentIndex() {
      if (wanted !== null && Math.abs(track.scrollLeft - leftFor(wanted)) < 3) return wanted;
      if (track.scrollLeft <= 2) return 0;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) return slides.length - 1;
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
      wanted = i;
      track.scrollTo({ left: leftFor(i), behavior: 'smooth' });
      update(); // a pick that needs no scroll fires no scroll event
    }

    // Arrows and autoplay skip slides whose position the track is already at, so every step visibly moves.
    function step(dir) {
      var i = currentIndex() + dir;
      while (i > 0 && i < slides.length - 1 && Math.abs(leftFor(i) - track.scrollLeft) < 3) i += dir;
      scrollToIndex(i);
    }

    function update() {
      var idx = currentIndex();
      dots.forEach(function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

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
      var hovered = false, focused = false;
      function atEnd() {
        return track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      }
      setInterval(function () {
        if (hovered || focused || document.hidden) return;
        if (atEnd()) scrollToIndex(0);
        else step(1);
      }, INTERVAL);
      // Hover and focus pause separately: leaving with the pointer must not resume while a link inside has focus.
      root.addEventListener('mouseenter', function () { hovered = true; });
      root.addEventListener('mouseleave', function () { hovered = false; });
      root.addEventListener('focusin', function () { focused = true; });
      root.addEventListener('focusout', function (e) { focused = root.contains(e.relatedTarget); });
    }
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), init);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
