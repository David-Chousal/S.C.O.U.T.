# Test 3c: DS18B20 in water, hot / room / ice steps (2026-11-03)

Raw data: `data/test3c-water-steps.csv` (copied unchanged from the demo page's Download CSV).
Logged with `scout_t3c_water` (12-bit, 1 reading/s) through `demo/scout-live-temp.html` in Edge.
Start 2026-11-03 20:42:49 UTC (12:42 PST). 513 readings over 512 s.

No event marks were entered during the run (hands busy). The event times below are
inferred from the trace and Isabella's description, so each is good to about ±1 s.

## Inferred timeline

| t (s) | Event | Evidence in the trace |
|---|---|---|
| 0–16 | Probe in room air | Flat at 23.69 °C |
| 16.5 | Into hot water | Rise starts between 16 and 17 s |
| ≈ 56 | Out of hot water, held in room air | Peak 43.44 °C at 56 s, then falls |
| 56–271 | Cooling in air, probe wet | Falls to 23.06 °C, below the starting air reading |
| ≈ 271 | Into room-temperature water | Turns up from 23.06 and settles at 23.50 °C |
| ≈ 303–311 | Lifted out / moved to the ice cup | Slow fall 23.44 → 22.94 °C |
| ≈ 311.5 | Into the ice cup | Sharp drop starts at 312 s |
| ≈ 437 | Ice cup stirred (confirmed by Isabella) | Second, smaller drop from 4.5 to 3.0 °C |
| 437–512 | In the ice cup until the end | ≈ 3.0 °C, still drifting down (2.81 °C at 512 s) |

## Results

| Quantity | Value | Notes |
|---|---|---|
| Readings / dropouts | 513 / **0** | No NaN or −127 lines |
| Resolution | All readings on 0.0625 °C steps | 12-bit confirmed again |
| Sample interval | 1.00 s (board) | PC timestamps 0.994–1.005 s apart; board 512 s = PC 511.3 s (board timer ≈ 0.13 % fast) |
| Response, heating step (τ, 63 %) | **≈ 12 s** (11.6–12.1 s) | Final value assumed 43.5–44.0 °C; the probe came out before fully settling |
| Response, cooling step (τ, 63 %) | **≈ 13 s** | To the 4.5 °C plateau at 425–436 s |
| Response in still air, Test 3 (2026-10-29) | 150–170 s | For comparison: water is ≈ 12× faster |
| Cooling in air after the hot dip (τ) | ≈ 48 s | Not comparable to Test 3: the probe was wet (evaporative cooling, which also pulled it to 23.06 °C, below room air) and hand-held |
| Room-temp water, 285–301 s | 23.50 °C, span 0.0625 °C (1 step) | Steady to the last bit |
| Ice cup, 470–492 s | 3.01 °C mean, span 0.125 °C (2 steps) | Steady, but the bath itself was still cooling |

## Ice point: not achieved (OI-06 stays open)

The ice cup used ice with room-temperature water, so the bath had not reached melt
equilibrium. Two signs in the data: the reading stepped down again at ≈ 437 s when the probe
was moved, and it was still falling at the end of the run (3.01 → 2.87 °C over the last 40 s).
The 3 °C plateau is the bath's temperature, not a probe error. A valid ice point needs a cup
packed full of crushed ice with cold water only filling the gaps, stirred, until the reading
stops changing (expected 0.0 ± 0.5 °C).

## Setup

Photo: `test3c-setup-cups.webp`. Three thin clear disposable plastic cups, each about a third
to half full: hot water (left, condensation above the waterline), room-temperature water
(middle), and the ice cup (right), which held a few cubes floating in mostly water rather than
packed ice. That matches the ice-point result above.

- **Immersion:** only the stainless-steel tip was submerged, in every cup.
- **Stirring:** none, except in the ice cup once the reading had settled at about 4.5 °C. That
  stir is the second drop at ≈ 437 s (4.5 → 3.0 °C), confirming the bath was not mixed or at
  equilibrium before it.
- **Water:** all from the tap (hot, room temperature, and the water in the ice cup).
- **Reference thermometer:** none, so absolute accuracy is not checked by this run.
