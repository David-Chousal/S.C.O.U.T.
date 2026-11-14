/* S.C.O.U.T. stability stage: the 3D half. One buoy design floating at its computed waterline, tilted about the
   waterline centre, with the two forces that decide whether it comes back: weight down through G, buoyancy up
   through the centre of the displaced water. The horizontal gap between their lines is the righting lever GZ.

   Loaded on demand by explorer.js after three.min.js and orbit-controls.js. Heights arrive in inches above the
   keel, as the stability simulator reports them; the CAD is in millimetres. */
(function () {
  'use strict';
  var IN = 25.4;
  var PALETTE = ['#1f6763', '#867f78', '#8a5e3a', '#4a9c97', '#b15f82', '#534c45', '#b0dbd7', '#b7b0a9'];
  var G_COLOR = 0xba7517, B_COLOR = 0x185fa5, WATER = 0x378add;

  function b64(s, T) {
    var bin = atob(s), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new T(u.buffer);
  }
  function baseName(n) { return n.replace(/ \(\d+\)$/, '').replace(/:\d+$/, ''); }
  function overlay(cls, text) {
    var el = document.createElement('span');
    el.className = 'xp-tag ' + cls; el.textContent = text; el.hidden = true;
    return el;
  }
  // Forces are drawn on top of the hull (no depth test), so G stays visible inside the float.
  function onTop(obj) {
    obj.renderOrder = 10;
    obj.traverse(function (o) { if (o.material) { o.material.depthTest = false; o.material.transparent = true; } });
    return obj;
  }
  function line(color, dashed) {
    var mat = dashed ? new THREE.LineDashedMaterial({ color: color, dashSize: 6, gapSize: 5, opacity: .7 })
                     : new THREE.LineBasicMaterial({ color: color, opacity: .9 });
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), mat);
    return onTop(l);
  }
  function setLine(l, a, b) {
    l.geometry.setFromPoints([a, b]);
    if (l.material.isLineDashedMaterial) l.computeLineDistances();
  }

  function buildScene(el) {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    el.insertBefore(renderer.domElement, el.firstChild);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 1, 50000);
    camera.up.set(0, 0, 1);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7f75, 0.8));
    var key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(900, -500, 900); scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(-500, 400, -300); scene.add(fill);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    return { renderer: renderer, scene: scene, camera: camera, controls: controls };
  }

  function buildWater(scene) {
    var surface = new THREE.Mesh(new THREE.CircleGeometry(1, 96),
      new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }));
    var volume = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
      new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: .08, depthWrite: false, side: THREE.BackSide }));
    volume.rotation.x = Math.PI / 2;
    surface.renderOrder = volume.renderOrder = 5;
    scene.add(surface, volume);
    return { surface: surface, volume: volume };
  }

  function buildForces(scene) {
    var f = {
      g: onTop(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: G_COLOR }))),
      b: onTop(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: B_COLOR }))),
      weight: onTop(new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 1, G_COLOR)),
      lift: onTop(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, B_COLOR)),
      gLine: line(G_COLOR, true), bLine: line(B_COLOR, true), lever: line(0x2b2520, false),
    };
    scene.add(f.g, f.b, f.weight, f.lift, f.gLine, f.bLine, f.lever);
    return f;
  }

  function makeMeshes(model, keelMm, clip) {
    var byKey = new Map(), meshes = [];
    model.parts.forEach(function (p) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(b64(p.verts, Float32Array), 3));
      g.setIndex(new THREE.BufferAttribute(b64(p.tris, Uint32Array), 1));
      g.translate(0, 0, -keelMm);
      g.computeVertexNormals();
      var k = baseName(p.name) + '|' + p.volume_cm3;
      if (!byKey.has(k)) byKey.set(k, p.volume_cm3);
      meshes.push({ geometry: g, key: k });
    });
    // Colour by part size, as the standalone viewer does, so float, housing and hardware read apart.
    var order = Array.from(byKey.entries()).sort(function (a, b) { return b[1] - a[1]; }).map(function (e) { return e[0]; });
    return meshes.map(function (m) {
      return new THREE.Mesh(m.geometry, new THREE.MeshStandardMaterial({
        color: PALETTE[order.indexOf(m.key) % PALETTE.length], roughness: .55, metalness: .08,
        side: THREE.DoubleSide, clippingPlanes: [clip],
      }));
    });
  }

  window.ScoutStage = function (el) {
    var s3 = buildScene(el), water = buildWater(s3.scene), forces = buildForces(s3.scene);
    var heel = new THREE.Group(), body = new THREE.Group();
    heel.add(body); s3.scene.add(heel);
    var clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e9);
    var tags = { g: overlay('xp-tag-g', 'G'), b: overlay('xp-tag-b', 'B'), gz: overlay('xp-tag-gz', '') };
    Object.keys(tags).forEach(function (k) { el.appendChild(tags[k]); });
    var cur = null, size = 1, home = null, visible = true, hasForces = false, lever = 0, spreadNow = 0, spreadAnim = 0;

    function placeParts(t) {
      spreadNow = t;
      body.children.forEach(function (m) { if (m.userData.spread) m.position.copy(m.userData.spread).multiplyScalar(t); });
    }
    function frame() {
      var c = new THREE.Vector3(0, 0, cur.midZ);
      s3.controls.target.copy(c);
      s3.camera.position.set(size * 2.3, -size * 0.7, cur.midZ + size * 0.38);
      s3.camera.near = size / 100; s3.camera.far = size * 40; s3.camera.updateProjectionMatrix();
      s3.controls.minDistance = size * 0.8; s3.controls.maxDistance = size * 8;
      s3.controls.update();
      home = { p: s3.camera.position.clone(), t: c.clone() };
    }
    function project(v, tag) {
      var p = v.clone().project(s3.camera), w = el.clientWidth, h = el.clientHeight;
      tag.style.transform = 'translate(' + ((p.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - p.y) / 2 * h).toFixed(1) + 'px)';
    }
    function placeTags() {
      Object.keys(tags).forEach(function (k) { tags[k].hidden = !hasForces; });
      tags.gz.hidden = !hasForces || Math.abs(lever) < 0.005;
      forces.lever.visible = !tags.gz.hidden;
      if (!hasForces) return;
      project(forces.g.position, tags.g);
      project(forces.b.position, tags.b);
      project(forces.lever.userData.mid, tags.gz);
    }
    function resize() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      s3.renderer.setSize(w, h, false); s3.camera.aspect = w / h; s3.camera.updateProjectionMatrix();
    }
    function loop() {
      if (visible) { s3.controls.update(); s3.renderer.render(s3.scene, s3.camera); placeTags(); }
      requestAnimationFrame(loop);
    }
    new ResizeObserver(resize).observe(el);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(el);
    resize(); requestAnimationFrame(loop);

    return {
      /* model: {bbox_mm, parts}; keelMm: keel height in the model frame; draftIn: waterline height above the keel. */
      show: function (model, keelMm, draftIn) {
        body.children.slice().forEach(function (m) { body.remove(m); m.geometry.dispose(); m.material.dispose(); });
        makeMeshes(model, keelMm, clip).forEach(function (m) { body.add(m); });
        var lo = model.bbox_mm[0], hi = model.bbox_mm[1];
        // Spread each part away from the model centre in proportion to its distance from it, as the standalone
        // viewer does, so stacked parts separate; vertical gaps count double.
        var centre = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2 - keelMm);
        body.children.forEach(function (m) {
          m.geometry.computeBoundingBox();
          var off = m.geometry.boundingBox.getCenter(new THREE.Vector3()).sub(centre); off.z *= 2;
          m.userData.spread = off.multiplyScalar(0.4);
        });
        cancelAnimationFrame(spreadAnim); placeParts(spreadNow);
        size = new THREE.Vector3(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]).length();
        cur = { lowZ: lo[2] - keelMm, highZ: hi[2] - keelMm, midZ: 0 };
        this.float(draftIn);
        cur.midZ = (cur.lowZ + cur.highZ) / 2 - draftIn * IN;
        var r = size * 4, depth = Math.max(draftIn * IN - cur.lowZ, 0) + size * 0.35;
        water.surface.scale.set(r, r, 1);
        water.volume.scale.set(r, depth, r); water.volume.position.z = -depth / 2;
        [forces.g, forces.b].forEach(function (m) { m.scale.setScalar(size * 0.016); });
        frame();
      },
      // A new draft (payload or ballast changed) sinks or lifts the same hull without moving the camera.
      float: function (draftIn) { body.position.z = -draftIn * IN; },
      /* deg: tilt; gzIn: righting lever at that tilt (in), positive = pushes back upright; kgIn, kbIn, draftIn: inches
         above the keel. The hull turns about the waterline centre; the true heave and sideways drift at large tilt
         are not modelled, so the forces are drawn where the simulator's lever puts them, not tracked in 3D. */
      tilt: function (deg, gzIn, kgIn, kbIn, draftIn) {
        heel.rotation.x = deg * Math.PI / 180;
        heel.updateMatrixWorld(true);
        hasForces = kgIn != null; lever = gzIn;
        [forces.g, forces.b, forces.weight, forces.lift, forces.gLine, forces.bLine, forces.lever]
          .forEach(function (o) { o.visible = hasForces; });
        if (!hasForces) return;
        var g = body.localToWorld(new THREE.Vector3(0, 0, kgIn * IN));
        var by = g.y - gzIn * IN, bz = Math.min((kbIn - draftIn) * IN, -size * 0.02);
        var L = size * 0.28, span = size * 0.55;
        forces.g.position.copy(g);
        forces.b.position.set(0, by, bz);
        forces.weight.position.copy(g); forces.weight.setLength(L, L * 0.22, L * 0.14);
        forces.lift.position.set(0, by, bz); forces.lift.setLength(L, L * 0.22, L * 0.14);
        setLine(forces.gLine, new THREE.Vector3(0, g.y, g.z - span), new THREE.Vector3(0, g.y, g.z + span * 0.6));
        setLine(forces.bLine, new THREE.Vector3(0, by, bz - span * 0.6), new THREE.Vector3(0, by, bz + span));
        var lz = Math.max(g.z, bz) + span * 0.45, a = new THREE.Vector3(0, g.y, lz), b = new THREE.Vector3(0, by, lz);
        setLine(forces.lever, a, b);
        forces.lever.userData.mid = a.clone().add(b).multiplyScalar(0.5);
        tags.gz.textContent = 'GZ ' + Math.abs(gzIn).toFixed(2) + ' in';
      },
      cut: function (on) { clip.constant = on ? 0 : 1e9; },
      /* to: 0 assembled, 1 fully spread; ms: 0 to jump there. */
      spread: function (to, ms) {
        cancelAnimationFrame(spreadAnim);
        if (!ms) { placeParts(to); return; }
        var from = spreadNow, t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
          placeParts(from + (to - from) * e);
          if (k < 1) spreadAnim = requestAnimationFrame(step);
        })(t0);
      },
      reset: function () { if (!home) return; s3.camera.position.copy(home.p); s3.controls.target.copy(home.t); s3.controls.update(); },
    };
  };
})();
