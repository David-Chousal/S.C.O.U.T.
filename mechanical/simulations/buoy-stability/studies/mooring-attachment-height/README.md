# Mooring Attachment Height Study (2026-10-08)

> **Summary** — Quasi-static check of how far the buoy heels, and how much sustained horizontal
> mooring force knocks it down, when the mooring line attaches at four heights on the arm. Result:
> the righting moment barely changes (about 21–22 N·m) but the heeling lever does, so attaching at
> the bottom of the stem is knocked down by about 34–48 N, while the base of the stem (a collar
> 2.5 in below the keel) needs about 215 N. **Static hydrostatics only.**
>
> Part of [`buoy-stability`](../../README.md). Decision context:
> [Ballast Arm and Mount](../../../../../docs/engineering/buoy-structural/ballast-arm-and-mount.md),
> [SCO-125](https://linear.app/scout1/issue/SCO-125).

---

## What was run

`mooring_height_study.py` reuses `buoy_stability.py` (v6 1.5 in caps, 2.6 kg lead at 24 in) and
moves the 220 g of mooring hardware to each attachment height. It then balances the righting moment
against a heeling couple: the sustained horizontal mooring force H times the vertical distance
between the attachment and the centre of drag, times cos(heel).

```bash
.venv/bin/python mooring_height_study.py
```

(about 30 s; writes the files below next to the script)

| File | What it is |
|---|---|
| `heel-vs-attachment.png` | Left: righting moment against heeling moment at 20, 100 and 330 N. Right: equilibrium heel against sustained force; a line ends where the buoy is knocked down |
| `heel-vs-attachment.csv` | Heel and knockdown force for every attachment, drag-centre assumption and force |
| `summary.json` | Steady-current drag, drag centres, peak righting moment, GM and roll period per attachment |

## Results

Peak righting moment is about **21–22 N·m at roughly 63° heel** for every attachment height.
Knockdown = sustained horizontal force at which the heeling moment passes that peak, with the drag
centre at the waterline (conservative):

| Attachment | Arm to drag centre | Knockdown force | Heel at 20 N |
|---|---|---|---|
| Keel pad-eye (z = 0) | 1.4 in | about 606 N | 1.2° |
| Collar 2.5 in below keel | 3.9 in | about 215 N | 3.3° |
| Mid-stem (z = -12 in) | 13.4 in | about 64 N | 11° |
| Stem bottom, at the lead (z = -24 in) | 25.4 in | about 34 N (about 48 N with the steady-current drag centre) | 20° (15° at the steady centre) |

Steady current at 0.8 m/s gives about **21 N** total drag (hull strip, arm, pod, lead). Rigid roll
period is about **3.4 s** at every attachment height (no added mass, which would lengthen it).

## Limits

- **Static only.** Waves, line dynamics, snap loads and sway are not modelled. The 100–330 N
  cases are transient peaks, so they overstate the real heel.
- **Drag areas, coefficients and drag centres are first-pass estimates** `[A]` (Cd 1.0–1.2).
- No vertical line pull and no wind.
- Roll period ignores added mass; whether it resonates with Kāneʻohe Bay chop was not checked.
- Rough pipe-stress scaling (not in the CSV): a 24 in lever at 330 N is about 200 N·m at the root
  against about 90 N·m for the collar, near the pipe's yield (about 170 MPa by scaling the repo's
  52 MPa at 60 N·m).
