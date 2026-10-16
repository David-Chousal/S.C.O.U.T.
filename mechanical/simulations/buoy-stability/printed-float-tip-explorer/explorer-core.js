// Pure solver shared by the explorer page and the node check. Units: mm, g.
const RHO = 1.025, IN = 25.4, VOX = 4;
function buildHull(D) {
  const Rz = z => z <= D.top ? interp(D.zs, D.R, z) : D.flangeR;
  const topF = D.top + D.flangeH, xs = [];
  for (let x = -128; x <= 128; x += VOX) xs.push(x);
  const Y = [], Z = [];
  for (let z = VOX / 2; z < topF; z += VOX) {
    const R = Rz(z);
    for (const x of xs) for (const y of xs) if (x * x + y * y <= R * R) { Y.push(y); Z.push(z); }
  }
  return { Y: Float32Array.from(Y), Z: Float32Array.from(Z), Rz, dv: VOX ** 3 };
}
function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0]; const n = xs.length; if (x >= xs[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
}
// items: [name, grams, z_mm_above_keel, net_factor]
function items(D, p) {
  const hb = D.floor, T = D.top, pd = p.podDepth * IN;
  return [
    ["Printed float", p.floatG, 0.36 * T, 1],
    ["Housing body", 385, hb + 68, 1],
    ["Battery", p.battG, hb + p.battH, 1],
    ["Boards, wiring, sled", 175.8, hb + 60.8, 1],
    ["Lid glands + bolts", 58, hb + 135, 1],
    ["Antenna", 30, hb + 150, 1],
    ["Epoxy + coating", p.epoxyG, 0.5 * T, 1],
    ["Mooring hardware", 220, 0, 191.7 / 220],
    ["External cabling", 60, -0.5 * IN, 16 / 60],
    ["Sensor pod", p.podG, -pd, 0.30],
    ["Hydrophone element", p.hydroG, -pd, 0.60],
    ["Ballast", p.ballG, p.ballH, 1],
  ];
}
function bulk(D, H, p) {
  const it = items(D, p); let m = 0, w = 0, wz = 0;
  for (const [, g, z, f] of it) { m += g; w += g * f; wz += g * f * z; }
  const Vreq = w / 1000 / RHO * 1e6, KG = wz / w;
  // upright waterline by integrating the revolution profile
  const N = 3000, top = D.top + D.flangeH; let V = 0, M1 = 0, T = 0, dz = top / N, Vt = [];
  for (let i = 0; i < N; i++) { const z = (i + .5) * dz, R = H.Rz(z); V += Math.PI * R * R * dz; M1 += Math.PI * R * R * z * dz; Vt.push([V, M1, z + dz / 2]); }
  if (V < Vreq) return { sinks: true, mass: m / 1000 };
  let k = 0; while (Vt[k][0] < Vreq) k++;
  const [Vk, Mk, zk] = Vt[k]; const T2 = zk; const KB = Mk / Vk, BM = Math.PI * Math.pow(H.Rz(T2), 4) / 4 / Vk;
  return { it, mass: m / 1000, Vreq, KG, draft: T2, KB, BM, GM: KB + BM - KG, freeboard: D.top - T2, n: Math.round(Vreq / H.dv) };
}
function atAngle(H, b, deg) {
  const s = Math.sin(deg * Math.PI / 180), c = Math.cos(deg * Math.PI / 180), N = H.Y.length;
  const zp = new Float32Array(N); for (let i = 0; i < N; i++) zp[i] = H.Y[i] * s + H.Z[i] * c;
  const srt = Float32Array.from(zp).sort(), thr = srt[Math.min(N - 1, b.n - 1)];
  let sy = 0, sz = 0, cnt = 0;
  for (let i = 0; i < N; i++) if (zp[i] <= thr) { sy += H.Y[i] * c - H.Z[i] * s; sz += zp[i]; cnt++; }
  const yB = sy / cnt, zB = sz / cnt, yG = -b.KG * s, zG = b.KG * c;
  return { gz: -(yB - yG), yB, zB, yG, zG, thr, s, c };
}
function curve(H, b, step = 5) { const out = []; for (let a = 0; a <= 180; a += step) out.push([a, atAngle(H, b, a).gz]); return out; }
function summarize(cv) {
  let van = null, mx = [0, -1e9];
  for (let k = 1; k < cv.length; k++) {
    if (cv[k][1] > mx[1]) mx = cv[k];
    if (cv[k][0] <= 175 && cv[k][1] < 0 && cv[k - 1][1] >= 0 && van === null)
      van = cv[k - 1][0] + 5 * cv[k - 1][1] / (cv[k - 1][1] - cv[k][1]);
  }
  const g178 = cv.filter(a => a[0] >= 170).map(a => a[1]);
  return { van, gzMax: mx[1], gzMaxDeg: mx[0], minNearInv: Math.min(...g178.slice(0, -1)) };
}
if (typeof module !== "undefined") module.exports = { buildHull, bulk, atAngle, curve, summarize, items, IN };
