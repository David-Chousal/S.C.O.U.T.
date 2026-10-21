# Test Plan — Raw PETG Water Absorption Soak (Fresh, then Salt)

> **Summary** — Does raw, uncoated PETG take up a measurable mass of water over 24 hours?
> Weigh a raw printed article dry, soak it fully submerged for 24 hr in fresh water, weigh it
> again by a fixed routine, then repeat in ~35 ppt salt water. The result says whether the
> printed buoy needs a coating or sealant for absorption alone, and feeds the mass and
> freeboard budget. **Not yet run.** Register row **RR-19**,
> [SCO-219](https://linear.app/scout1/issue/SCO-219).
>
> Part of [`mechanical/test/`](README.md). Plan written 2026-10-21 at John Ryan's request;
> test piece confirmed the same day as the unsealed full-size raw PETG buoy.
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

Two test pieces, run together so they see the same water, temperature and timing.

| Test piece | What it is | Why |
|---|---|---|
| **A: the unsealed full-size raw PETG buoy** | The complete printed buoy with **no** coating, epoxy, J-B Weld or sealant, and **left unsealed**: lid off or open, no seam closed, so water flows freely in and out of every cavity | The thing the question is about |
| **B: raw PETG coupons** (3, printed with the same filament and settings) | Small solid blocks, one with the buoy's wall count | Control: a solid block has no cavity, so any gain is the plastic itself |

**Why unsealed.** Leaving the buoy open means water cannot be trapped by a leak, so the
mass gain is the plastic taking up water plus any water still clinging in the buoy's pockets
and layer lines after it is lifted out. The second part is the main thing to control: the
fixed drain routine below empties every cavity the same way each time, and coupon B shows
what the plastic alone takes up. If A gains clearly more than B scaled by surface area,
the difference is retained water, not absorption.

Record for each test piece: print date, filament brand and colour, print settings (walls,
infill, layer height), and any post-processing. Sanding or heat-set inserts count as
processing. Photograph every opening on A so the drain positions in step 2 are repeatable.

## Equipment

| Item | Spec | Notes |
|---|---|---|
| Scale | Resolution **≤ 0.1 g** for coupons; for the buoy, the best resolution available at its mass, and capacity above the buoy's wet mass | Record capacity and resolution. Check it with a known mass before each weigh-in. The buoy needs its own, larger scale |
| Tubs | A bin big enough to submerge the whole buoy, plus a small one for the coupons | The 50 gal bin from [SCO-168](https://linear.app/scout1/issue/SCO-168) works. Same bin for fresh and salt is fine if rinsed and dried |
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

1. Lift the buoy out and **drain it in a fixed sequence**: hold it with each opening facing
   down for 30 s, in the same order every time (record the order from the photos). Coupons
   drain for 30 s in one orientation.
2. **Blot with a lint-free towel for 60 s**, same pressure, covering all faces and the inside
   of each cavity you can reach. Do not rub.
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
- **Gain per surface area (g/cm²)** for A against B, to separate the plastic's own uptake
  from water retained in A's pockets. Use the CAD surface area for A and the measured one
  for B.

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
| **Act** | Gain on A well above B scaled by area, or gain that does not return on dry-back | Suspect water held in layer lines and pockets; coat or seal, then rerun |

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
| Air trapped in the buoy's cavities | Tilt and shake out bubbles; note if A floats back up |
| Water left in cavities after lifting | Fixed drain sequence, second weigh at +10 min |
| Different print settings between A and B | Print B from the same filament and walls as A |
| Lifting a full-size wet buoy | Two people, or drain the bin first |

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

1. **The "act" threshold.** A mass gain that matters for freeboard is not yet defined.
2. **Intermediate readings.** Whether to take the 1 hr and 4 hr weights.
3. **Scale.** The lab scale's capacity and resolution are not recorded in the repo, and the
   buoy needs a larger one than the coupons.
