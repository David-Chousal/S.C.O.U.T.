# Test Plan — Raw PETG Water Absorption Soak (Fresh, then Salt)

> **Summary** — Does raw, uncoated PETG take up a measurable mass of water over 24 hours?
> Weigh a raw printed article dry, soak it fully submerged for 24 hr in fresh water, weigh it
> again by a fixed routine, then repeat in ~35 ppt salt water. The result says whether the
> printed buoy needs a coating or sealant for absorption alone, and feeds the mass and
> freeboard budget. **Not yet run.** Register row **RR-19**,
> [SCO-219](https://linear.app/scout1/issue/SCO-219).
>
> Part of [`mechanical/test/`](README.md). Plan written 2026-10-21 at John Ryan's request.
> Owner: John Ryan Myrdal (GENG).

---

## Why this test

Every leak test so far asks whether water gets *in* to a cavity. This one asks a different
question: does water get *into the plastic and its layer lines*, adding mass with no leak at
all? A gain matters in three places:

- **Freeboard.** Added mass sits the buoy lower. The model assumes dry printed parts
  ([mass and buoyancy budget](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md)).
- **Coating decision.** If the gain is measurable, a coating or sealant is justified for
  absorption alone ([SCO-78](https://linear.app/scout1/issue/SCO-78) covers coating adhesion).
- **Reading other tests.** A small damp patch on a paper towel could be absorbed or wicked
  water, not a seal failure. Knowing the baseline separates the two.

**Fresh before salt** isolates the plastic's own behaviour from any effect of salt. Salt
water is what the buoy sees, so it is the result that counts.

## What is tested

Two articles, run together so they see the same water, temperature and timing.

| Article | What it is | Why |
|---|---|---|
| **A: the raw PETG buoy** (or the closest raw printed section) | Printed PETG, **no** coating, epoxy, J-B Weld or sealant on any surface | The thing the question is about |
| **B: raw PETG coupons** (3, printed with the same settings and filament) | Small solid or open-top pieces, one with the buoy's wall count | Cheap control: a solid piece cannot flood, so any gain is absorption |

**The flooding trap.** A hollow buoy with a slow leak gains mass from water *inside* the
cavity, which is not absorption. Pick one before the run and write it in the log:

- Run A with its cavities **open and drained** (a hole or an unsealed lid), so water goes in
  and out freely and only the plastic's own uptake is left, **or**
- Run A **sealed** and treat any gain as leak plus absorption, with coupon B as the
  absorption-only reading.

Recommended: both A (sealed, as built) and B. If A gains more than B scaled by surface area,
the difference is ingress.

Record for each article: print date, filament brand and colour, print settings (walls, infill,
layer height), and any post-processing. Sanding or heat-set inserts count as processing.

## Equipment

| Item | Spec | Notes |
|---|---|---|
| Scale | Resolution **≤ 0.1 g** for coupons; **≤ 1 g** for the buoy | Record capacity and resolution. Check it with a known mass before each weigh-in |
| Tubs | Large enough to submerge A fully, plus a second for the coupons | Same tub for fresh and salt is fine if rinsed |
| Hold-down | Non-absorbing weights or a plastic grid | PETG floats. Use stainless or glass, not wood or foam |
| Fresh water | Tap, room temperature | Record temperature |
| Salt water | ~35 ppt, Instant Ocean | Needs [SCO-168](https://linear.app/scout1/issue/SCO-168) (salt and a salinity meter) |
| Salinity meter | Refractometer or hydrometer | Verify 35 ppt before the salt run |
| Thermometer, timer | | Record water and room temperature |
| Lint-free towels | Same type every time | For the fixed blot |
| Drying rack | Open air, out of sun | |
| Camera | | Photo of each article and the scale reading |

## Procedure

Use the same steps for both articles in each run.

### 0. Baseline dry mass

1. Let the articles sit in the lab at room conditions for **at least 24 hr** so they start from
   a settled, dry state. Do **not** oven-dry a printed buoy; it can warp.
2. Weigh each article three times and record all three. Use the average as **m₀**. If the
   three readings differ by more than the scale resolution, wait and repeat.
3. Log room temperature, humidity if known, and the scale check.

### 1. Fresh-water soak

1. Fill the tubs with room-temperature fresh water. Record the temperature and the start time.
2. Submerge the articles fully using the hold-down. No part may float above the surface.
   Shake out trapped air bubbles.
3. Leave for **24 hr**. Keep the tub covered so water level and temperature stay steady.
4. *Optional intermediate readings* at 1 hr and 4 hr, using the same weigh routine, show
   whether uptake is fast then plateaus or keeps rising. Skip these if they would disturb the
   24 hr result; record that you skipped them.

### 2. The weigh routine (fixed, every time)

Water clinging to the surface and in layer-line gaps is the biggest source of error, so the
routine must be identical for every weigh-in:

1. Lift the article out and let it **drain for 30 s** in the same orientation each time.
2. **Blot with a lint-free towel for 60 s**, same pressure, covering all faces. Do not rub.
3. **Weigh within 2 min of leaving the water.** Record the mass and the time.
4. Weigh again at **+10 min**. If the mass is still falling, the first reading included
   surface water. Record both.

Use the settled reading as **m₁**.

### 3. Dry-back

1. Leave the articles on the rack in the lab for **48 hr**.
2. Weigh them again, recording the mass as **m₂**.
3. **Return to baseline** means m₂ is within the scale resolution of m₀. If it is not, the
   plastic is still holding water or something was left in the layer lines. Record this; it is
   a result.

### 4. Salt-water soak

Only start this once the articles are back at baseline.

1. If an article did not return to baseline, use **fresh coupons** for the salt run instead of
   reusing it.
2. Mix salt water to ~35 ppt, verify with the meter, and record the temperature.
3. Repeat step 1 (soak, 24 hr) and the weigh routine (step 2).
4. Salt left on the surface adds mass as it dries. After the salt weigh-in, **dip-rinse in
   fresh water for 5 s**, blot as above, and weigh again. Record both readings, with and
   without the rinse.
5. Dry-back for 48 hr as in step 3.

## Calculation

For each article and each run:

- **Mass gain (g)** = m₁ − m₀
- **Mass gain (%)** = (m₁ − m₀) ÷ m₀ × 100
- **Retained after dry-back (g)** = m₂ − m₀
- **Gain per surface area (g/cm²)** for article A against coupon B, to separate absorption
  from ingress. Use the CAD surface area for A and the measured one for B.

Record the scale resolution next to every result. A gain at or below the resolution is
reported as "not detected at this resolution", not as zero.

## Pass benchmark (provisional)

Per the register's rule, a benchmark is written *before* the run. These are placeholders
until the team agrees them, in line with
[SCO-139](https://linear.app/scout1/issue/SCO-139).

| Outcome | Reading | What it means |
|---|---|---|
| **No concern** | Gain ≤ scale resolution on both articles, fresh and salt | No coating needed for absorption alone |
| **Note and budget** | Measurable gain, returns to baseline on dry-back | Add the gain to the mass budget as a wet-mass allowance |
| **Act** | Gain on A well above B scaled by area, or gain that does not return | Suspect ingress or trapped water in layer lines; coat or seal, then rerun |

The threshold between "note" and "act" is **open**. Suggested starting point, to be confirmed:
a gain that would move the waterline by more than the ±0.5 in freeboard tolerance used in
[RR-17](risk-reduction-register.md).

## Error sources to control

| Source | Control |
|---|---|
| Surface water read as absorption | Fixed drain and blot routine, second weigh at +10 min |
| Evaporation during the soak | Cover the tub |
| Scale drift | Check with a known mass each session; same scale, same surface |
| Temperature change | Record water and room temperature; keep them within a few degrees |
| Salt crystals adding mass | Dip-rinse step, both readings recorded |
| Air trapped in a hollow article | Shake out bubbles; note any article that floats back up |
| Different print settings between A and B | Print B from the same filament and walls as A |

## Data sheet

Copy this table into the result record and fill it in.

| Article | Run | m₀ (g) | Water temp (°C) | Start | End | m₁ (g) | m₁ at +10 min (g) | m₂ after dry-back (g) | Gain (g) | Gain (%) |
|---|---|---|---|---|---|---|---|---|---|---|
| A | Fresh | | | | | | | | | |
| B1 | Fresh | | | | | | | | | |
| B2 | Fresh | | | | | | | | | |
| B3 | Fresh | | | | | | | | | |
| A | Salt | | | | | | | | | |
| B1 | Salt | | | | | | | | | |
| B2 | Salt | | | | | | | | | |
| B3 | Salt | | | | | | | | | |

Scale: make and model ______ , capacity ______ , resolution ______ . Filament: brand
______ , colour ______ . Salinity reading: ______ ppt.

## Safety

No electronics are powered. Wet floors are the main hazard: place the tubs on a
spill-contained surface, wipe drips at once, and lift a full tub only with two people or after
draining. Salt water in a lab sink follows the lab's rules for drains. This work falls under
the hazard form's boxes for water near electronics and heavy lifting.

## Where the result goes

1. Fill in the data sheet and save the record as
   `mechanical/test/petg-water-absorption-soak-<date>.md`.
2. Update row **RR-19** in the [register](risk-reduction-register.md) with the result.
3. If a gain is measurable, add it to the mass and freeboard budget and note the change in
   [`design-notes.md`](../../docs/hub/design-notes.md).
4. Close [SCO-219](https://linear.app/scout1/issue/SCO-219).

## Open decisions

1. **Which article is A?** The full raw buoy, a raw section, or only coupons. Sealed or
   open-cavity.
2. **The "act" threshold.** A mass gain that matters for freeboard is not yet defined.
3. **Intermediate readings.** Whether to take the 1 hr and 4 hr weights.
4. **Scale.** The lab scale's resolution is not recorded in the repo.
