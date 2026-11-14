/* S.C.O.U.T. stability stage: pick a design, see it float, tilt it, read whether it comes back.

   Mounts into every [data-explorer] element; data-base is the folder holding data.json, models/ and vendor/.
   All numbers come from data.json, written by analytics/telemetry/site/design_explorer.py from the stability
   simulator's own output, and are interpolated exactly as the simulator's explorer does.

   This file holds the read-outs and the markup; explorer-ui.js (loaded after it) wires them up. The 3D half
   (stage3d.js and three.js) loads only when the stage scrolls near the screen. */
(function () {
  'use strict';
  var STEP = 5, N_ANGLES = 37, G0 = 9.81, IN_M = 0.0254, MM = 25.4;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function script(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { fail(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function json(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' answered ' + r.status);
      return r.json();
    });
  }

  /* ---- physics read-outs, as the simulator's explorer computes them ---------------------------------------- */
  // Rows are [payload g, mass kg, draft, KG, KB, KM, GM (in), weight kg, GZ every 5 degrees (in)].
  function interp(rows, payload) {
    var i = 0;
    while (i < rows.length - 2 && payload >= rows[i + 1][0]) i++;
    var a = rows[i], b = rows[i + 1] || a, t = b === a ? 0 : (payload - a[0]) / (b[0] - a[0]);
    var L = function (p, q) { return p + (q - p) * t; };
    return { M: L(a[1], b[1]), T: L(a[2], b[2]), KG: L(a[3], b[3]), KB: L(a[4], b[4]), KM: L(a[5], b[5]),
             GM: L(a[6], b[6]), W: L(a[7], b[7]), gz: a[8].map(function (v, k) { return L(v, b[8][k]); }) };
  }
  function gzAt(gz, deg) {
    var x = Math.max(0, Math.min(180, deg)) / STEP, k = Math.min(Math.floor(x), N_ANGLES - 2);
    return gz[k] + (gz[k + 1] - gz[k]) * (x - k);
  }
  // First angle past the start where the lever turns from righting to capsizing; null if it never does.
  function vanishing(gz) {
    for (var k = 2; k < N_ANGLES - 1; k++) {
      if (gz[k] < 0 && gz[k - 1] >= 0) return (k - 1) * STEP + STEP * gz[k - 1] / (gz[k - 1] - gz[k]);
    }
    return null;
  }
  function peak(gz) {
    var mi = 0;
    gz.forEach(function (g, k) { if (g > gz[mi]) mi = k; });
    return { deg: mi * STEP, gz: gz[mi] };
  }
  function moment(W, gzIn) { return W * G0 * gzIn * IN_M; }

  /* ---- design state ----------------------------------------------------------------------------------------- */
  function seriesFor(data, d, ballast) {
    var h = d.hydro;
    return data.series[h.cap + '_' + (ballast && !h.kind ? 1 : 0)];
  }
  function payloadRange(data, d) {
    var rows = data.series[d.hydro.cap + '_0'];
    // The last row is the heaviest payload the simulator solved; past it the read-outs would be extrapolated.
    return { max: rows[rows.length - 1][0], start: d.hydro.housing_g || 770 };
  }
  function topIn(data, d) { return d.hydro.kind ? d.hydro.top_in : data.cap_top_in[d.hydro.cap]; }
  function method(d) {
    var h = d.hydro;
    if (h.fixed) return 'Hull: the float outline from this design’s CAD (fins and loops left out). Mass ' +
      (h.fixed.mass_g / 1000).toFixed(3) + ' kg and centre of gravity ' + h.fixed.kg_mm +
      ' mm above the keel are the CFD set-up values, not a weighed budget.';
    if (h.kind === 'assembly') return 'Hull: a 3D voxel hull of this design’s CAD parts, placed as in the CAD, with ' +
      'estimated masses and the current payload. Tilted toward a wedge and toward a gap; the worse is shown.';
    if (h.kind === 'printed') return 'Hull: the printed float outline from this design’s CAD, no foam, no ballast. ' +
      'The payload slider is the battery, boards and housing.';
    return 'Hull: the ' + h.cap + ' in wedge-bottom caps from this design’s CAD, with the current mass budget.';
  }
  function verdictOf(r, top) {
    var fb = top - r.T, v = vanishing(r.gz), sub = 'Sits ' + r.T.toFixed(2) + ' in deep with ' + fb.toFixed(2) + ' in above the water.';
    if (r.GM <= 0) return { cls: 'bad', head: 'Unstable: it flips over on its own', sub: sub };
    if (fb <= 0) return { cls: 'bad', head: 'Sinks: the top is under water', sub: sub };
    if (v === null) return { cls: 'good', head: 'Stays upright. It rights itself from any tilt.', sub: sub };
    return { cls: 'warn', head: 'Stable, but flips if tilted past ' + Math.round(v) + '°', sub: sub };
  }

  /* ---- markup ----------------------------------------------------------------------------------------------- */
  function skeleton(host) {
    host.innerHTML =
      '<div class="xp-pick">' +
        '<div class="xp-pick-head"><p class="xp-micro">Design <span class="xp-count"></span></p>' +
        '<p class="xp-hint">Pick a design, then tilt it and let go.</p></div>' +
        '<div class="xp-strip" role="radiogroup" aria-label="Design, oldest to newest"></div>' +
        '<div class="xp-now" aria-live="polite"><h3 class="xp-name"></h3><p class="xp-when"></p></div>' +
      '</div>' +
      '<div class="xp-body">' +
        '<div class="xp-stage" role="group" aria-label="3D model of the selected design floating at its waterline">' +
          '<p class="xp-tilt-big"><span class="xp-micro">Tilt</span> <b class="xp-tilt-val">0°</b></p>' +
          '<div class="xp-tools"><button type="button" class="xp-btn xp-spread" aria-pressed="false">Spread parts</button>' +
          '<button type="button" class="xp-btn xp-cut" aria-pressed="false">Cut in half</button>' +
          '<button type="button" class="xp-btn xp-reset">Reset view</button></div>' +
          '<p class="xp-legend"><span><i class="xp-dot-g"></i>G weight</span><span><i class="xp-dot-b"></i>B buoyancy</span>' +
          '<span>Drag to turn · scroll to zoom</span></p>' +
          '<p class="xp-status" role="status"></p>' +
        '</div>' +
        '<div class="xp-curve">' +
          '<div class="xp-curve-head"><h4>Push back upright, by tilt</h4><p class="xp-at" aria-live="polite"></p></div>' +
          '<div class="xp-compare"><button type="button" class="xp-btn xp-pin">Pin this curve to compare</button>' +
          '<p class="xp-pin-key" hidden><span class="xp-key-now"></span><span class="xp-key-pin"></span></p></div>' +
          '<svg class="xp-chart" role="img"></svg>' +
          '<div class="xp-tilt-row"><label for="xp-tilt-' + host.dataset.n + '">Tilt</label>' +
          '<input type="range" class="xp-tilt" id="xp-tilt-' + host.dataset.n + '" min="0" max="180" step="1" value="0">' +
          '<button type="button" class="xp-btn xp-solid xp-go">Let go</button></div>' +
          '<p class="xp-fine">Drag along the curve or the slider to tilt the model. Let go shows which way it turns, not how ' +
          'fast: the motion is not to time scale.</p>' +
        '</div>' +
        '<div class="xp-right">' +
          '<div class="xp-verdict" role="status"><b></b><span></span></div>' +
          '<dl class="xp-stats"></dl>' +
          '<table class="xp-vs" hidden><caption>Side by side</caption><thead><tr><th scope="col"></th>' +
          '<th scope="col" class="xp-vs-now"></th><th scope="col" class="xp-vs-pin"></th></tr></thead><tbody></tbody></table>' +
          '<div class="xp-controls">' +
            '<div class="xp-ctl xp-payload"><label for="xp-pay-' + host.dataset.n + '">Electronics payload</label>' +
            '<output class="xp-pay-val"></output><input type="range" id="xp-pay-' + host.dataset.n + '" min="0" step="50"></div>' +
            '<label class="xp-ctl xp-ballast"><input type="checkbox" checked> <span></span></label>' +
          '</div>' +
          '<details class="xp-how"><summary>How this design was modelled</summary><p class="xp-note"></p><p class="xp-method"></p></details>' +
        '</div>' +
      '</div>';
    var q = function (s) { return host.querySelector(s); };
    return { strip: q('.xp-strip'), count: q('.xp-count'), name: q('.xp-name'), when: q('.xp-when'),
             stage: q('.xp-stage'), status: q('.xp-status'), tiltVal: q('.xp-tilt-val'), cut: q('.xp-cut'),
             reset: q('.xp-reset'), chart: q('.xp-chart'), at: q('.xp-at'), tilt: q('.xp-tilt'), go: q('.xp-go'),
             verdict: q('.xp-verdict'), stats: q('.xp-stats'), payload: q('.xp-payload'), pay: q('.xp-payload input'),
             payVal: q('.xp-pay-val'), ballast: q('.xp-ballast'), bal: q('.xp-ballast input'), balText: q('.xp-ballast span'),
             note: q('.xp-note'), method: q('.xp-method'), legend: q('.xp-legend'), spread: q('.xp-spread'),
             pin: q('.xp-pin'), pinKey: q('.xp-pin-key'), keyNow: q('.xp-key-now'), keyPin: q('.xp-key-pin'),
             vs: q('.xp-vs'), vsNow: q('.xp-vs-now'), vsPin: q('.xp-vs-pin'), vsBody: q('.xp-vs tbody') };
  }

  window.ScoutExplorer = { interp: interp, gzAt: gzAt, vanishing: vanishing, peak: peak, moment: moment,
                           verdictOf: verdictOf, el: el, script: script, json: json, skeleton: skeleton,
                           seriesFor: seriesFor, payloadRange: payloadRange, topIn: topIn, method: method,
                           still: still, MM: MM, STEP: STEP };
})();
