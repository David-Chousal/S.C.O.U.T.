# Ballast Arm and Mount

> **Summary** — Hardware for the self-righting ballast: a 24 in 316 stainless pipe hanging below
> the chassis, carrying ~2.6 kg of encapsulated lead near its end and the sensor pod at 13.5 in.
> It is joined to the chassis floor by a slip-on 316 rail mount through-bolted to an internal
> backing plate. Records the design loads, the options compared (with McMaster part numbers and
> prices as listed 2026-09-29), and what is still open. Why the ballast exists and how the depth
> was chosen: [Stability Analysis §12](stability-analysis.md#12-large-angle-stability-capsize-and-self-righting-ballast--2026-09-29).
> Tracked on [SCO-125](https://linear.app/scout1/issue/SCO-125).
>
> Part of the [Knowledge Hub](../../hub/README.md) supporting engineering docs.

---

## Decided

| Item | Choice | Record |
|---|---|---|
| Arm length / ballast depth | **24 in (2 ft)** below the keel | [SCO-129](https://linear.app/scout1/issue/SCO-129) |
| Arm material | **316 stainless, 3/4 in Sch 40 pipe, 24 in, threaded both ends: McMaster 4816K51 ($64.74)**. OD 1.05 in, ID 0.824 in, ~1.05 kg | [SCO-131](https://linear.app/scout1/issue/SCO-131) |
| Arm-to-chassis joint | **316 slip-on rail mount, McMaster 6040T57** ($23.03; rectangular 3 1/4 × 1 7/8 in, 4 × 1/4 in holes), or **6040T56** ($23.03; round Ø2 3/4 in, 3 holes; this one is modelled in the v6 assembly). Through-bolted with 1/4-20 316 bolts into a **316 backing plate** (~4 × 4 × 1/8–3/16 in) inside the chassis, bonded sealing washers under the nuts, set screws **plus a 1/4 in 316 cross-bolt** through the socket and pipe (below the pipe threads) | [SCO-132](https://linear.app/scout1/issue/SCO-132) |
| No printed bracket | A steel backing plate spreads the load better than a printed/generative spacer; plastic under bolt clamp creeps | [SCO-132](https://linear.app/scout1/issue/SCO-132) |
| Chassis floor under the mount | 25% gyroid (not 100%). Protect the bolt holes with 316 compression sleeves or ~4 extra perimeters; 6–8 skin layers | [print-settings](print-settings.md) |

## Design loads at the arm root (first-pass estimates)

Self-righting fixes **lead × arm ≈ 60–70 kg·in**, so the ballast's moment at the joint is roughly
the same at any arm length. A shorter arm needs more lead and doesn't make the joint easier.

| Case | Root moment | Equivalent tip force at 24 in |
|---|---|---|
| Wave-following, every wave (~14,000 cycles/day) | 2–3 N·m | ~5 N |
| Current drag on arm + lead, 0.8 m/s | ~3 N·m | — |
| 90° knockdown (the self-righting moment) | ~15 N·m | ~25 N |
| Carried horizontally, dry, 2× jolt | ~40 N·m | ~65 N |
| **LC9 mooring snap** (buoy jerked ~2.8 g, lead lags) | **~60 N·m** | **~100 N**, plus ~50 N axial |
| Mooring on a collar ~2 in below the floor (LC9, 583 N) | +~30 N·m → **~90 N·m combined** | — |

Pipe stress at 60 N·m ≈ 52 MPa (≈4× below 316 yield). Mount bolts at 90 N·m ≈ 2.2 kN each on
1/4-20 316 (proof ~9 kN). A printed PETG stem reaches SF ~1 at the root with the stress running
across layers, so it is ruled out. Assumed: Cd ≈ 1.2, arm Ø1.05 in, snap acceleration from the
LC9 horizontal load (371 N) on a ~10.4 kg buoy.

## Options compared

| Option | Part | Price | Verdict |
|---|---|---|---|
| **Slip-on rail mount + backing plate** | 6040T57 / 6040T56 | $23 | ✅ Chosen: cheap, flat, compact, bolts straight through |
| Class 150 threaded flange (forged) | 44695K12, 3/4 NPT, Ø3 7/8 in, 4 × 1/2 in bolts on a 2 3/4 in circle | $54.09 | Works; bulky and heavy |
| Bulkhead (through-wall) connector | 6696K61, 3/4 NPT F, Ø1 5/8 in hole, max wall 3/4 in, EPDM | $165.27 | Works and seals by design; too expensive with no cable passing through |
| Tie-rod through the pipe clamping it to the floor | 1/2-13 316 rod | ~$40–60 | Rejected: harder to understand and assemble |
| Printed / generative bracket | — | — | Rejected as a structural part |
| 304 versions (4813K51 pipe, 44685K12 flange) | — | cheaper | Rejected: corrode in seawater |
| PVC, aluminium, galvanized, printed PETG arm | — | — | Rejected: strength, creep, corrosion, or zinc in the reef |

## Mooring attachment (recommended, not decided)

A 316 clamp collar with an eye on the pipe **just below the mount** (e.g. a 316 U-bolt around the
pipe clamping a drilled 316 plate, with a rubber liner for hydrophone noise isolation), then a 316
swivel, rope or a soft shackle for the first few feet, and a snubber. Keeps the load path in
steel with a short lever. Attaching at the lead instead was rejected: ~7× more heel under current,
the whole arm in the mooring load path, and line noise next to the hydrophone. Part numbers to
confirm: [SCO-137](https://linear.app/scout1/issue/SCO-137). LC7 re-run for the moved attachment:
[SCO-135](https://linear.app/scout1/issue/SCO-135).

### Mooring attachment, 2026-10-08 (John Ryan, still open on hardware)

**Decided direction:** the rope connects **around the base of the stem, at the top of the arm just
below the chassis**. The exact hardware is not chosen. A backup path is wanted.

| Concept | Verdict | Why |
|---|---|---|
| Attach at the bottom of the stem (lead end) | **Rejected** | Stability study: knocked down by about 34–48 N sustained (heel about 15–20° at 20 N current); the arm becomes a 24 in lever |
| Cross-bolt / clevis through the pipe | **Rejected by John** | A hole in the highest-stress zone of the arm |
| Rope straight through a hole in the pipe | **Rejected by John** | Same hole concern, plus chafe |
| Swivel | **Dropped** | One more part to seize over a year; twist is accepted and will be tested |
| Printed bracket / printed stop as the main load path | **Dropped** | The existing "No printed bracket" decision stands; a printed part is fine only as a non-load guard |
| Friction-only clamp or U-bolt | **Doubtful** | The whole mooring would hang on friction; needs a positive stop if used |
| Rope loop free to rotate around the stem, held by a stop | Considered, not chosen | Chafe and fouling risk; the stop still has to be positive |
| **Backup path** | **Wanted** | A second, slack line from a through-bolted pad-eye on the chassis bottom, so one failure leaves the buoy moored |

**What the stability check says** ([study](../../../mechanical/simulations/buoy-stability/studies/mooring-attachment-height/README.md)):
attachment height barely changes the righting moment (about 21–22 N·m) but sets the heeling lever.
Sustained horizontal force that knocks the buoy down, with drag at the waterline:

| Attachment | Knockdown force | Heel at 20 N |
|---|---|---|
| Keel (z = 0) | about 606 N | 1.2° |
| **Collar 2.5 in below keel** (base of the stem) | **about 215 N** | **3.3°** |
| Mid-stem (z = -12 in) | about 64 N | 11° |
| Stem bottom (z = -24 in) | about 34 N | 20° |

Attaching at the base of the stem keeps the heel small. Static hydrostatics only: waves, line
dynamics and sway are not modelled (rigid roll period about 3.4 s at every height).

## Assembly notes

- Anti-seize on all stainless threads (galling). Seize shackle pins with wire.
- Lead: **encapsulate in epoxy** (galvanic couple with 316; reef exposure). Whether lead is acceptable under the permit: [SCO-136](https://linear.app/scout1/issue/SCO-136). Steel ballast would need ~40% more volume.
- 316 threaded cap (3/4 NPT) on the pipe bottom retains the lead.
- The pipe floods. Rinse it after recovery.
- Detachable in principle: remove the cross-bolt and set screws to transport the buoy without the arm.
- The v6 assembly ([`full-buoy-assembly-v6.step`](../../../mechanical/cad/full-buoy-assembly-v6.step)) shows the pipe top 0.06 in proud of the mount into the chassis floor. Check for interference.

## Sources

McMaster-Carr catalog, listings as of 2026-09-29 (`mcmaster-catalog-2026-09` in the
[Research Library](../../hub/research/sources.md)); `roark-8e` for the bending checks;
`crc-handbook` for the lead density.
