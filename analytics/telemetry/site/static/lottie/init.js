/* Ambient Lottie animations, self-hosted, on every page.
   1. Fixed animations: any element with a data-lottie path (hero fish, footer seaweed).
   2. Roaming fish: at a regular interval a fish swims across a random spot in the viewport,
      then removes itself.
   Respects prefers-reduced-motion, and no-ops if the runtime is unavailable. */
(function () {
  if (typeof lottie === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. Fixed, looping animations declared in the markup.
  var nodes = document.querySelectorAll('[data-lottie]');
  for (var i = 0; i < nodes.length; i++) {
    lottie.loadAnimation({
      container: nodes[i], renderer: 'svg', loop: true, autoplay: true,
      path: nodes[i].getAttribute('data-lottie'),
      rendererSettings: { progressiveLoad: true }
    });
  }

  // 2. Roaming fish.
  var base = document.body.getAttribute('data-lottie-base') || 'assets/lottie/';
  var fishPath = base + 'fish2.json';
  var INTERVAL = 15000;   // a fish roughly every 15s
  var LIFE = 8000;        // one pass of the animation (240 frames @ 30fps)

  function spawnFish() {
    if (document.hidden) return;
    var el = document.createElement('div');
    el.className = 'roaming-fish';
    var w = 420 + Math.random() * 320;                 // 420–740px band; the fish inside is small
    var flip = Math.random() < 0.5;                    // swim either direction
    el.style.width = w + 'px';
    el.style.left = Math.random() * Math.max(0, window.innerWidth - w) + 'px';
    el.style.top = (8 + Math.random() * 74) + 'vh';
    if (flip) el.style.setProperty('--flip', '-1');
    document.body.appendChild(el);
    var anim = lottie.loadAnimation({
      container: el, renderer: 'svg', loop: false, autoplay: true,
      path: fishPath, rendererSettings: { progressiveLoad: true }
    });
    var done = function () { try { anim.destroy(); } catch (e) {} if (el.parentNode) el.remove(); };
    anim.addEventListener('complete', done);
    setTimeout(done, LIFE + 1500);                     // safety net
  }

  setTimeout(spawnFish, 4000);
  setInterval(spawnFish, INTERVAL);
})();
