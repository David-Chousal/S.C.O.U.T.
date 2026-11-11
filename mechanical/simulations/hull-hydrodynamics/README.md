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

## Limits

- Fins and lugs are not meshed; potential flow cannot capture fin drag. Next step: an OpenFOAM roll-decay case
  with and without fins, checked against a tub drop test.
- Masses and rigid inertia are estimates; the 1.2 g/cm³ lug and fin density is an assumption.
- The profile came from the Fusion STL of Test Assembly 9; the repo's printed-float v9 file agrees to about 0.04 in.
