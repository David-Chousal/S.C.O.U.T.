/* S.C.O.U.T. stability stage: wiring. Picks a design, keeps the 3D model, the numbers and the righting-lever curve
   on the same design, payload and tilt, and runs "Let go". Needs explorer.js loaded first. */
(function () {
  'use strict';
  var X = window.ScoutExplorer;
  if (!X) return;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function niceStep(span) {
    var steps = [0.25, 0.5, 1, 2, 5, 10, 20];
    for (var i = 0; i < steps.length; i++) if (span / steps[i] <= 4) return steps[i];
    return steps[steps.length - 1];
  }
  function whenNear(node, fn) {
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: '600px 0px' });
    io.observe(node);
  }
  // Same rule "Let go" animates: the lever turns the hull toward where it is zero and righting on both sides.
  function rate(gz, deg, maxAbs) { return -160 * X.gzAt(gz, deg) / maxAbs; }
  function settle(gz, deg) {
    var maxAbs = Math.max.apply(null, gz.map(Math.abs)) || 1;
    for (var t = 0; t < 2000; t++) deg = Math.max(0, Math.min(180, deg + rate(gz, deg, maxAbs) * 0.01));
    return deg;
  }

  function mount(host) {
    var base = host.dataset.base || './', solo = !!host.closest('.xp-solo');
    var ui = X.skeleton(host);
    var st = { data: null, i: 0, deg: 0, payload: 0, r: null, top: 0, stage: null, models: new Map(), anim: 0, token: 0, chart: null };
    var d = function () { return st.data.designs[st.i]; };

    /* -- picker ------------------------------------------------------------------------------------------- */
    function buildChips() {
      st.chips = st.data.designs.map(function (x, i) {
        var b = X.el('button', 'xp-chip');
        b.type = 'button'; b.title = x.name; b.setAttribute('role', 'radio');
        b.append(X.el('span', 'xp-chip-i', String(i + 1).padStart(2, '0')), X.el('span', 'xp-chip-t', x.short),
                 X.el('span', 'xp-chip-d', x.date));
        b.addEventListener('click', function () { pick(i, true); });
        ui.strip.appendChild(b);
        return b;
      });
      ui.strip.addEventListener('keydown', function (e) {
        var n = st.chips.length, to = { ArrowLeft: st.i - 1, ArrowUp: st.i - 1, ArrowRight: st.i + 1, ArrowDown: st.i + 1,
                                        Home: 0, End: n - 1 }[e.key];
        if (to == null) return;
        e.preventDefault(); pick(Math.max(0, Math.min(n - 1, to)), true);
      });
    }
    function pick(i, byUser) {
      stopAnim();
      st.i = i;
      var x = d(), c = st.chips[i];
      st.chips.forEach(function (b, k) { b.setAttribute('aria-checked', k === i); b.tabIndex = k === i ? 0 : -1; });
      markPinned();
      ui.strip.scrollTo({ left: c.offsetLeft - (ui.strip.clientWidth - c.offsetWidth) / 2,
                          behavior: byUser && !X.still.matches ? 'smooth' : 'auto' });
      if (byUser) c.focus({ preventScroll: true });
      ui.count.textContent = (i + 1) + ' of ' + st.chips.length;
      ui.name.textContent = x.name; ui.when.textContent = x.when;
      ui.note.textContent = x.note; ui.method.textContent = x.hydro ? X.method(x) : '';
      if (solo) try { history.replaceState(null, '', '#' + x.id); } catch (err) { /* file:// pages refuse it; harmless */ }
      setupControls(x);
      recompute();
      showModel();
    }
    function setupControls(x) {
      var h = x.hydro;
      ui.payload.hidden = !h || !!h.fixed;
      ui.ballast.hidden = !h || !!h.kind;
      if (!h) return;
      var pr = X.payloadRange(st.data, x);
      ui.pay.max = pr.max;
      st.payload = Math.min(pr.start, pr.max);
      ui.pay.value = st.payload;
      if (!h.kind) ui.balText.textContent = '24 in ballast stem with ' + st.data.lead_kg[h.cap] + ' kg of lead';
    }

    /* -- numbers ------------------------------------------------------------------------------------------ */
    function recompute() {
      var x = d();
      if (!x.hydro) { st.r = null; showNoResult(); return; }
      st.r = X.interp(X.seriesFor(st.data, x, ui.bal.checked), st.payload);
      st.top = X.topIn(st.data, x);
      ui.payVal.textContent = Math.round(st.payload) + ' g';
      var v = X.verdictOf(st.r, st.top);
      ui.verdict.className = 'xp-verdict xp-' + v.cls;
      ui.verdict.firstChild.textContent = v.head; ui.verdict.lastChild.textContent = v.sub;
      stats();
      compare();
      drawChart();
      if (st.stage) st.stage.float(st.r.T);
      applyTilt();
    }
    function showNoResult() {
      ui.verdict.className = 'xp-verdict xp-na';
      ui.verdict.firstChild.textContent = 'No stability result for this design';
      ui.verdict.lastChild.textContent = 'No mass budget is on record for it yet.';
      ui.stats.textContent = ''; ui.chart.textContent = ''; st.chart = null;
      applyTilt();
    }
    function stats() {
      var r = st.r, vv = X.vanishing(r.gz), pk = X.peak(r.gz), mm = function (inch) { return Math.round(inch * X.MM) + ' mm'; };
      var rows = [
        ['Total mass', 'what it weighs', r.M.toFixed(2) + ' kg', ''],
        ['Draft', 'how deep it sits', r.T.toFixed(2) + ' in', mm(r.T)],
        ['Freeboard', 'height above water', (st.top - r.T).toFixed(2) + ' in', mm(st.top - r.T)],
        ['GM', 'stiffness, higher is better', r.GM.toFixed(2) + ' in', mm(r.GM)],
        ['Max righting', 'strongest push upright', pk.gz > 0 ? X.moment(r.W, pk.gz).toFixed(1) + ' N·m' : 'none', pk.gz > 0 ? 'at ' + pk.deg + '°' : ''],
        // No crossing on an unstable hull means the lever is negative from the start: it tips at 0 degrees.
        ['Tips over at', 'point of no return', vv !== null ? Math.round(vv) + '°' : r.GM <= 0 ? '0°' : 'never', ''],
      ];
      ui.stats.textContent = '';
      rows.forEach(function (row) {
        var cell = X.el('div', 'xp-stat'), dt = X.el('dt', null, row[0]);
        dt.appendChild(X.el('span', null, row[1]));
        var dd = X.el('dd', null, row[2]);
        if (row[3]) dd.appendChild(X.el('small', null, row[3]));
        cell.append(dt, dd); ui.stats.appendChild(cell);
      });
    }

    /* -- compare: pin one design's curve and numbers, then pick another ------------------------------------ */
    function keyNumbers(r, top) {
      var vv = X.vanishing(r.gz);
      return [['Draft', r.T.toFixed(2) + ' in'], ['Freeboard', (top - r.T).toFixed(2) + ' in'], ['GM', r.GM.toFixed(2) + ' in'],
              ['Max righting', X.moment(r.W, X.peak(r.gz).gz).toFixed(1) + ' N\u00b7m'],
              ['Tips over at', vv === null ? 'never' : Math.round(vv) + '\u00b0']];
    }
    function label(x, payload) { return x.short + (x.hydro && !x.hydro.fixed ? ' \u00b7 ' + Math.round(payload) + ' g' : ''); }
    function togglePin() {
      if (st.pin) { st.pin = null; }
      else if (st.r) {
        st.pin = { id: d().id, label: label(d(), st.payload), gz: st.r.gz.slice(), nums: keyNumbers(st.r, st.top) };
      }
      markPinned(); compare(); drawChart(); applyTilt();
    }
    function markPinned() {
      st.chips.forEach(function (b, k) { b.classList.toggle('xp-chip-pinned', !!st.pin && st.data.designs[k].id === st.pin.id); });
      ui.pin.textContent = st.pin ? 'Unpin ' + st.pin.label : 'Pin this curve to compare';
      ui.pin.setAttribute('aria-pressed', !!st.pin);
    }
    function compare() {
      var on = !!(st.pin && st.r);
      ui.pinKey.hidden = ui.vs.hidden = !on;
      if (!on) return;
      var now = label(d(), st.payload), mine = keyNumbers(st.r, st.top);
      ui.keyNow.textContent = now; ui.keyPin.textContent = st.pin.label + ' (pinned)';
      ui.vsNow.textContent = now; ui.vsPin.textContent = st.pin.label;
      ui.vsBody.textContent = '';
      mine.forEach(function (row, k) {
        var tr = X.el('tr');
        tr.append(X.el('th', null, row[0]), X.el('td', null, row[1]), X.el('td', null, st.pin.nums[k][1]));
        tr.firstChild.scope = 'row';
        ui.vsBody.appendChild(tr);
      });
    }

    /* -- the curve ---------------------------------------------------------------------------------------- */
    function drawChart() {
      var gz = st.r.gz, svgEl = ui.chart, W = Math.max(svgEl.clientWidth, 280), H = W < 480 ? 210 : 240;
      var m = { l: 56, r: 14, t: 18, b: 40 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
      var all = st.pin ? gz.concat(st.pin.gz) : gz;
      var top = Math.max.apply(null, all.map(Math.abs)) * 1.2 || 1, step = niceStep(top), lim = Math.ceil(top / step) * step;
      var X_ = function (deg) { return m.l + deg / 180 * pw; }, Y_ = function (g) { return m.t + (lim - g) / (2 * lim) * ph; };
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svgEl.style.height = H + 'px';
      svgEl.textContent = '';
      for (var g = -lim; g <= lim + 1e-9; g += step) {
        svgEl.append(svg('line', { x1: m.l, x2: W - m.r, y1: Y_(g), y2: Y_(g), class: Math.abs(g) < 1e-9 ? 'xp-zero' : 'xp-grid' }),
                     svg('text', { x: m.l - 8, y: Y_(g) + 4, 'text-anchor': 'end', class: 'xp-tick' }, (+g.toFixed(2)).toString()));
      }
      for (var a = 0; a <= 180; a += 30) {
        svgEl.append(svg('text', { x: X_(a), y: H - m.b + 18, 'text-anchor': 'middle', class: 'xp-tick' }, a + '°'));
      }
      svgEl.append(svg('text', { x: m.l + pw / 2, y: H - 4, 'text-anchor': 'middle', class: 'xp-axis' }, 'Tilt'),
                   svg('text', { x: 12, y: m.t + ph / 2, 'text-anchor': 'middle', class: 'xp-axis',
                                 transform: 'rotate(-90 12 ' + (m.t + ph / 2) + ')' }, 'Lever, in'));
      areas(svgEl, gz, X_, Y_);
      if (st.pin) svgEl.append(svg('polyline', { class: 'xp-line-pin', points: st.pin.gz.map(function (v, k) { return X_(k * X.STEP) + ',' + Y_(v); }).join(' ') }));
      svgEl.append(svg('polyline', { class: 'xp-line', points: gz.map(function (v, k) { return X_(k * X.STEP) + ',' + Y_(v); }).join(' ') }));
      marks(svgEl, gz, X_, Y_, W);
      var cursor = svg('g', { class: 'xp-cursor' });
      cursor.append(svg('line', { y1: m.t, y2: m.t + ph }), svg('circle', { r: 6 }));
      svgEl.append(cursor);
      st.chart = { X: X_, Y: Y_, cursor: cursor, m: m, pw: pw };
      var pk = X.peak(gz), vv = X.vanishing(gz);
      svgEl.setAttribute('aria-label', 'Righting lever against tilt. ' + (pk.gz > 0 ? 'Peaks at ' + pk.gz.toFixed(2) + ' inches at ' + pk.deg +
        ' degrees; ' : '') + (vv !== null ? 'past ' + Math.round(vv) + ' degrees it tips further over.'
          : st.r.GM <= 0 ? 'Unstable upright: it tips further over from any tilt.' : 'it pushes back upright at every tilt.'));
    }
    // Green where the lever pushes back upright, red where it tips the hull further; split exactly at each zero.
    function areas(svgEl, gz, X_, Y_) {
      var pos = [], neg = [];
      gz.forEach(function (v, k) {
        if (k > 0 && (v > 0) !== (gz[k - 1] > 0)) {
          var z = (k - 1 + gz[k - 1] / (gz[k - 1] - v)) * X.STEP;
          pos.push([z, 0]); neg.push([z, 0]);
        }
        pos.push([k * X.STEP, Math.max(v, 0)]); neg.push([k * X.STEP, Math.min(v, 0)]);
      });
      [[pos, 'xp-pos'], [neg, 'xp-neg']].forEach(function (p) {
        var pts = [[0, 0]].concat(p[0], [[180, 0]]).map(function (q) { return X_(q[0]) + ',' + Y_(q[1]); }).join(' ');
        svgEl.append(svg('polygon', { points: pts, class: p[1] }));
      });
    }
    function marks(svgEl, gz, X_, Y_, W) {
      var pk = X.peak(gz), vv = X.vanishing(gz);
      var px = X_(pk.deg), anchor = px > W - 150 ? 'end' : 'start';
      if (pk.gz <= 0) return; // never rights itself: no strongest push and no crossing to mark
      svgEl.append(svg('circle', { cx: px, cy: Y_(pk.gz), r: 3.5, class: 'xp-mark' }),
                   svg('text', { x: px + (anchor === 'end' ? -8 : 8), y: Y_(pk.gz) - 8, 'text-anchor': anchor, class: 'xp-label' },
                       'strongest ' + pk.gz.toFixed(2) + ' in at ' + pk.deg + '°'));
      if (vv === null) return;
      var vx = X_(vv);
      svgEl.append(svg('circle', { cx: vx, cy: Y_(0), r: 3.5, class: 'xp-mark xp-mark-bad' }),
                   svg('text', { x: vx + 8, y: Y_(0) + 16, class: 'xp-label xp-label-bad' }, 'tips past ' + Math.round(vv) + '°'));
    }
    function chartDrag() {
      var dragging = false;
      function at(e) {
        if (!st.chart) return;
        var box = ui.chart.getBoundingClientRect(), vb = ui.chart.viewBox.baseVal, x = (e.clientX - box.left) * vb.width / box.width;
        stopAnim(); setDeg((x - st.chart.m.l) / st.chart.pw * 180);
      }
      ui.chart.addEventListener('pointerdown', function (e) { dragging = true; ui.chart.setPointerCapture(e.pointerId); at(e); });
      ui.chart.addEventListener('pointermove', function (e) { if (dragging) at(e); });
      ['pointerup', 'pointercancel'].forEach(function (t) { ui.chart.addEventListener(t, function () { dragging = false; }); });
    }

    /* -- tilt and "Let go" -------------------------------------------------------------------------------- */
    function setDeg(deg) { st.deg = Math.max(0, Math.min(180, deg)); applyTilt(); }
    function applyTilt() {
      var deg = st.deg, r = st.r;
      ui.tilt.value = Math.round(deg); ui.tiltVal.textContent = Math.round(deg) + '°';
      if (!r) { if (st.stage) st.stage.tilt(deg, 0, null); return; }
      var g = X.gzAt(r.gz, deg);
      if (st.chart) {
        st.chart.cursor.setAttribute('transform', 'translate(' + st.chart.X(deg) + ',0)');
        st.chart.cursor.lastChild.setAttribute('cy', st.chart.Y(g));
        st.chart.cursor.setAttribute('class', 'xp-cursor ' + (g >= 0 ? 'xp-up' : 'xp-down'));
      }
      if (!st.anim) ui.at.textContent = describe(deg, g, r);
      if (st.stage) st.stage.tilt(deg, g, r.KG, r.KB, r.T);
    }
    function describe(deg, g, r) {
      var a = Math.round(deg) + '°';
      if (deg < 0.5) return 'Upright. Tilt it to see the push back.';
      if (g > 0.005) return 'At ' + a + ' it pushes back upright: ' + g.toFixed(2) + ' in of lever, ' + X.moment(r.W, g).toFixed(1) + ' N·m.';
      if (g < -0.005) return 'At ' + a + ' it tips further over: ' + (-g).toFixed(2) + ' in of lever the wrong way.';
      return 'At ' + a + ' it balances: no push either way.';
    }
    function stopAnim() { if (st.anim) { cancelAnimationFrame(st.anim); st.anim = 0; } }
    function finish() {
      st.anim = 0; applyTilt();
      var a = Math.round(st.deg) + '°';
      ui.at.textContent = st.deg < 1 ? 'Back upright.'
        : st.deg > 135 ? 'Rolled past the point of no return: it comes to rest at ' + a + ', nearly upside down.'
        : 'Comes to rest at ' + a + '.';
    }
    function letGo() {
      stopAnim();
      if (!st.r) return;
      if (st.deg < 1) { ui.at.textContent = 'Tilt it first, with the slider or along the curve.'; return; }
      var gz = st.r.gz, maxAbs = Math.max.apply(null, gz.map(Math.abs)) || 1;
      if (X.still.matches) { setDeg(settle(gz, st.deg)); finish(); return; }
      var target = settle(gz, st.deg), last = performance.now(), t0 = last;
      ui.at.textContent = 'Letting go…';
      function step(now) {
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        st.deg = Math.max(0, Math.min(180, st.deg + rate(gz, st.deg, maxAbs) * dt));
        applyTilt();
        if (Math.abs(st.deg - target) < 0.3 || now - t0 > 8000) { st.deg = target; finish(); return; }
        st.anim = requestAnimationFrame(step);
      }
      st.anim = requestAnimationFrame(step);
    }

    /* -- 3D ----------------------------------------------------------------------------------------------- */
    function load3d() {
      ui.status.textContent = 'Loading the 3D model…';
      var chain = window.THREE ? Promise.resolve()
        : X.script(base + 'vendor/three.min.js').then(function () { return X.script(base + 'vendor/orbit-controls.js'); });
      chain.then(function () { return window.ScoutStage ? null : X.script(base + 'stage3d.js'); })
        .then(function () {
          try { st.stage = window.ScoutStage(ui.stage); } catch (err) { throw new Error('this browser has no WebGL'); }
          showModel();
        })
        .catch(function (err) {
          ui.stage.classList.add('xp-no3d');
          ui.status.textContent = 'The 3D view could not start (' + err.message + '). The numbers and the curve still work.';
        });
    }
    function showModel() {
      if (!st.stage) return;
      var x = d(), token = ++st.token, cached = st.models.get(x.id);
      ui.status.textContent = cached ? '' : 'Loading the 3D model…';
      // Never show the last design's hull at this design's waterline while the new one loads (or if it fails).
      if (!cached) st.stage.hide();
      (cached ? Promise.resolve(cached) : X.json(base + 'models/' + x.id + '.json')).then(function (model) {
        st.models.set(x.id, model);
        if (token !== st.token) return;
        st.stage.show(model, x.keel_mm, st.r ? st.r.T : 0);
        if (ui.cut.getAttribute('aria-pressed') === 'true') st.stage.cut(true);
        if (ui.spread.getAttribute('aria-pressed') === 'true') st.stage.spread(1, 0);
        intro();
        ui.status.textContent = '';
        applyTilt();
      }).catch(function (err) {
        if (token === st.token) ui.status.textContent = 'This model could not load (' + err.message + ').';
      });
    }

    // Once, the first time the stage is half on screen: the parts come together, so the reader sees what the float
    // is made of before it is tilted. Triggered by scrolling, never driving it; skipped under reduced motion.
    function intro() {
      if (st.introDone || X.still.matches) return;
      st.stage.spread(1, 0);
      if (st.introWatch) return;
      st.introWatch = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting || e[0].intersectionRatio < 0.5) return;
        st.introWatch.disconnect(); st.introDone = true;
        if (ui.spread.getAttribute('aria-pressed') !== 'true') st.stage.spread(0, 1400);
      }, { threshold: 0.5 });
      st.introWatch.observe(ui.stage);
    }

    /* -- start -------------------------------------------------------------------------------------------- */
    ui.tilt.addEventListener('input', function () { stopAnim(); setDeg(+ui.tilt.value); });
    ui.go.addEventListener('click', letGo);
    ui.pin.addEventListener('click', togglePin);
    ui.spread.addEventListener('click', function () {
      var on = ui.spread.getAttribute('aria-pressed') !== 'true';
      ui.spread.setAttribute('aria-pressed', on);
      st.introDone = true;
      if (st.stage) st.stage.spread(on ? 1 : 0, X.still.matches ? 0 : 700);
    });
    // A new payload or ballast is a new curve: a running "Let go" would settle on the old one.
    ui.pay.addEventListener('input', function () { stopAnim(); st.payload = +ui.pay.value; recompute(); });
    ui.bal.addEventListener('change', function () { stopAnim(); recompute(); });
    ui.cut.addEventListener('click', function () {
      var on = ui.cut.getAttribute('aria-pressed') !== 'true';
      ui.cut.setAttribute('aria-pressed', on);
      if (st.stage) st.stage.cut(on);
    });
    ui.reset.addEventListener('click', function () { if (st.stage) st.stage.reset(); });
    chartDrag();
    new ResizeObserver(function () { if (st.r) { drawChart(); applyTilt(); } }).observe(ui.chart.parentNode);

    X.json(base + 'data.json').then(function (data) {
      st.data = data;
      buildChips();
      var k = solo ? data.designs.findIndex(function (x) { return x.id === location.hash.slice(1); }) : -1;
      pick(k >= 0 ? k : data.designs.length - 1, false);
      whenNear(ui.stage, load3d);
    }).catch(function (err) {
      host.textContent = 'The stability stage could not load its data (' + err.message + ').';
    });
  }

  document.querySelectorAll('[data-explorer]').forEach(function (host, n) { host.dataset.n = n; mount(host); });
})();
