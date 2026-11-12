# Hull Hydrodynamics (Capytaine)

> **Summary** — First potential-flow (boundary element) study of the printed float, run with
> [Capytaine](https://github.com/capytaine/capytaine) on the wetted hull of Test Assembly 9. It gives
> heave and roll added mass, radiation damping and natural periods. It does **not** model the side
> fins (their drag is viscous). **Unverified** until a tub roll-decay test agrees.
>
> Part of [`simulations`](../README.md). Statics come from the
> [buoy-stability](../buoy-stability/README.md) solver.

---

## Hull mesh check (2026-11-11)

![Capytaine hull mesh: isometric and side view, waterline in red](../../../assets/diagrams/capytaine-hull-mesh.png)

5,760 panels. Body of revolution built from the Fusion STL profile (no fins, no lugs). Draft 2.71 in,
waterline radius 4.65 in, flat bottom radius 3.50 in with the 45 degree bottom cone. Wetted area 123 in²,
waterplane area 68 in².

## Results

Inputs: mass 3.04 kg, GM 1.33 in, KG 2.36 in (repo solver, Test Assembly 9 budget with assumed lug and fin
masses at 1.2 g/cm³), rigid roll inertia 0.0131 kg m² (hand estimate).

| Quantity | Capytaine | Earlier hand estimate |
|---|---|---|
| Heave natural period | 0.67 s | 0.69 s |
| Heave added mass | 2.0 kg | 2.3 kg |
| Heave radiation damping ratio | 0.088 | not estimated |
| Roll natural period | 0.78 s | 0.82 to 1.00 s |
| Roll added inertia | 0.0025 kg m² | 0.008 to 0.023 kg m² |
| Roll radiation damping ratio | 0.010 | assumed 0.05 total |

## Reading it

Waves of 2 s or longer carry the buoy along; only roughly 0.8 s ripples excite roll. Wave-making damping in
roll is very small, so roll damping is mostly viscous, and the fins' drag (estimated at 0.010 to 0.015 of
critical for 8 tabs 1.97 in wide) is comparable to it. That drag estimate is a hand calculation with steady
flat-plate coefficients, not a simulation.

## Run it

```bash
python3 -m venv .venv && .venv/bin/pip install capytaine meshio numpy
.venv/bin/python hull_bem.py float_no_fins.stl
```

Export the STL from Fusion (float body, mm). The STLs are not committed.

## OpenFOAM roll-decay check (2026-11-11)

![OpenFOAM roll decay with and without fins, ParaView renders at 0.05, 0.42, 0.85 and 1.7 s](../../../assets/diagrams/openfoam-roll-decay.png)

OpenFOAM v2606 `interFoam` (two-phase VOF, laminar) with a rigid-body float free to heave and roll, released from a
10 degree tilt, 3 s simulated, 141,338 cells (5 mm at the fins), 2 m tank. Two cases: the hull with 8 fins and the
same hull without. Masses are the repo solver's hull-supported masses (2.7574 kg fins, 2.674 kg no fins), so the
drafts match the statics. Scripts are in [`openfoam/`](openfoam/): `make_hull.py` (watertight STLs),
`make_cases.py` (case folders from the OpenFOAM floating-body tutorial), `analyze_decay.py` (period from the log),
`render_paraview.py` (images).

| Quantity | CFD with fins | CFD no fins | Capytaine |
|---|---|---|---|
| Roll period | 0.825 s | 0.823 s | 0.78 s |
| Swing over 3 s | 18.7 to 18.1 to 18.1 to 18.35 degrees peak to peak | grows from about 20 to about 26 degrees | n/a |

**Result: the period agrees within about 5%, which supports the mass, inertia and draft inputs. Damping is not
resolved.** Neither case decays visibly in 3 s: at a 10 degree tilt the fins move slowly, so their drag is small. The
no-fins swing growing is not physical and points to numerical energy (coarse mesh, laminar flow, motion solver), so the
fins-versus-no-fins comparison is **inconclusive**. Do not cite it as evidence that the fins help.

To redo it properly: a 30 degree or larger start, a finer mesh at the fins, a longer run, and the tub roll-decay test
as the reference. Saved field files contained denormal numbers (for example `-1.6e-312`) that OpenFOAM cannot read
back; zero them before `reconstructPar`.

## Test Assembly 10 multi-night run (set up 2026-11-12, not yet run)

Rerun of the roll-decay CFD above on the [Test Assembly 10](../../cad/floatation/test-assembly-10.md) float, as
[SCO-309](https://linear.app/scout1/issue/SCO-309) asks: a **30 degree** start, a **6 s** run, and a **much finer
fin mesh**. It runs on this Mac only, stopped each morning and resumed each night. **No result yet; the cases are
meshed and the stop and resume logic is tested on a short run, but the real solve has not been started.**

| Item | Test Assembly 9 run | Test Assembly 10 run |
|---|---|---|
| Fin cells | 5 mm (level 3) | **1.25 mm (level 5)**, fins are their own STL region |
| Hull cells | 5 mm | 5 mm |
| Cells with fins / no fins | 141,338 / not recorded | 218,918 / 136,336 (checkMesh OK, max skewness 2.85 / 1.33, max non-orthogonality 64 / 38 degrees) |
| Start tilt, end time | 10 degrees, 3 s | 30 degrees, 6 s |
| Float mass | 2.7574 / 2.674 kg | 2.8202 / 2.7518 kg (set for the Test Assembly 10 draft estimate of 2.93 in) |
| Float geometry | Test Assembly 9 | Test Assembly 10: hull profile and fins read from the Fusion export; tip radius 124.0 mm, fins 26.0 to 44.5 mm above the keel |

Assumptions to check: the centre of gravity is the Test Assembly 9 value (59.9 mm with fins, 60.8 mm without), as
the Test Assembly 10 note says; the rigid-body inertia is unchanged (0.0131, 0.0131, 0.020 kg m^2); the hull is closed
at 158 mm above the keel (loops, lip, bore and lettering are not modelled). With those, the hull geometry gives GM of
1.25 in with fins and 1.27 in without, against the note's hand estimate of 1.30 in. The statics solver has **not**
been re-run on Test Assembly 10.

**Cost.** Timed on a 0.03 s start-up of the fins case on 7 ranks: about 0.85 s per step at a step of about 5e-4 s.
Extrapolated (early steps only, it will change once the float is swinging): roughly 3 to 5 hours per case, perhaps
4 to 7 hours with both cases running together. This replaces the earlier 1 to 2 day guess, which assumed a mesh of
about 1 million cells.

**How to run it** (scripts in [`openfoam/`](openfoam/); working folder `~/scout-cfd`, outside the repo):

```bash
# once: export the Float occurrence of Test Assembly 10 from Fusion as STL (mm, high refinement) to ~/scout-cfd/ta10_float_fins_raw.stl
python make_hull_ta10.py ta10_float_fins_raw.stl .   # watertight hulls, fins as a separate region
python make_cases_ta10.py                             # case folders in ~/scout-cfd/foam
./night.sh prepare                                    # mesh, set fields, decompose (done 2026-11-12)
./night.sh resume                                     # each night: start or continue both cases
./night.sh stop                                       # each morning: write state and stop cleanly
./night.sh status
python analyze_decay.py ~/scout-cfd/foam/ta10-fins ~/scout-cfd/foam/ta10-nofins
```

`resume` refuses to start on battery power (`--force` overrides), zeroes denormal numbers in the newest saved time
(they break a restart; 948 were found in the test), and wraps each solver in `caffeinate -dimsu` so the Mac cannot
sleep while it runs; the hold ends by itself when the solver stops. `resume --until 07:00` also stops both cases
cleanly at that time. A full write is made every 15 minutes of wall time and the last four are kept, so a crash loses
at most 15 minutes. Closing the lid still sleeps the Mac. The OpenFOAM app shell crashes on long `&&` chains and on
`rm -rf` with a glob, so `night.sh` calls it one step at a time and uses `/bin/rm`.

The log reports the rigid-body orientation **relative to the start**, so the absolute tilt is the start tilt plus
that angle; `analyze_decay.py` prints the relative angle.

## Limits

- Fins and lugs are not meshed; potential flow cannot capture fin drag. The first OpenFOAM roll-decay case is
  above and is inconclusive on damping; the tub drop test is still the reference.
- Masses and rigid inertia are estimates; the 1.2 g/cm³ lug and fin density is an assumption.
- The profile came from the Fusion STL of Test Assembly 9; the repo's printed-float v9 file agrees to about 0.04 in.
