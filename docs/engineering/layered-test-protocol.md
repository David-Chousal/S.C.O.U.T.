# Layered Test Protocol

> **Summary** — The test stages S.C.O.U.T. runs between now and the Hawaii deployment: for each
> stage, what is built, how many units, which benchmark it checks, the Linear issue that tracks
> it, and when it runs. Built for [SCO-140](https://linear.app/scout1/issue/SCO-140) from the
> 2026-09-30 advisor meeting, the
> [Electronics Build and Test Plan](electronics-build-and-test-plan.md), the
> [risk-reduction register](../../mechanical/test/risk-reduction-register.md) and the open
> Linear test issues as of **2026-10-20**.
>
> Owner: John Ryan Myrdal (GENG) for the mechanical and integrated stages; Isabella Rodriguez
> (ECEN) for the electronics stages. **The unit counts and the dates are a proposal** until the
> team confirms them — see [Open decisions](#open-decisions).

---

## How the layers work

Both advisors asked for testing in tiers, each with its own prototype type and its own pass
mark written down **before** the test runs (Jes Kuczenski, 2026-09-30). The prototype types
match the register:

| Type | Meaning | Cost of a failure |
|---|---|---|
| **Coupon** | A small piece that tests one feature (a seal, a wall count, a lid) | Hours of print time |
| **Looks-like** | Right shape and mass, no working electronics | A print and an afternoon |
| **Works-like** | Working electronics inside a sealed buoy | Parts and weeks |
| **Analysis** | Closed-form or FEA, no hardware | None |

Run the cheap layers first. A stage starts only when the layer below it has passed, except
where the table notes a parallel run.

## Units

| Unit | What it is | Used for |
|---|---|---|
| **Coupons** | Printed capsules, sensor-pod coupons, sacrificial rings and wedges | Waterproofing, drop, sealing. Consumed |
| **Buoy A** | The first complete buoy: sealed, tested empty, kept as a spare (decision 2026-10-16) | Mechanical-only tests: float, tilt, drop, saltwater bin. No electronics |
| **Buoy B** | The new smaller single-print buoy with lid and compartmented package | Works-like: electronics, sealed soak, ocean test |
| **Shore station** | ESP32-S3 + LoRa FeatherWing | Receives every link test |

The 2026-09-30 meeting reached consensus on **two complete buoys** (enough to show two buoys
reach one base station) and floated **2–3** for parallel testing. This protocol assumes
**two complete buoys plus coupons**. A third buoy is not planned; see
[Open decisions](#open-decisions).

## Stages

| # | Stage | Prototype | Units | Benchmark (pass mark) | Tracks | When |
|---|---|---|---|---|---|---|
| 1 | Dry bench, per sensor | Works-like, breadboard | 1 Feather set | Temperature within ±0.5 °C of reference; turbidity clear > turbid, 50 readings vary < ~1%; SD log and RTC survive a power cycle | [SCO-157](https://linear.app/scout1/issue/SCO-157) | Phase 1–2 |
| 2 | Dry bench, power and switching | Works-like, breadboard | 1 Feather set | 3.3 V ±3%; sleep ≤ 500 µA; switched sensor off < 1 µA; no MCU reset at switch-on | [SCO-157](https://linear.app/scout1/issue/SCO-157) | Phase 1–2 |
| 3 | Dry bench, radio link | Works-like, breadboard | Buoy set + shore station | 30 B packets with valid CRC, < 1% loss; TX ≤ 100 mA; outdoor range logged (aim ≥ 500 m) | [SCO-24](https://linear.app/scout1/issue/SCO-24) | Phase 2 |
| 4 | Firmware loop and batteries | Works-like, breadboard | 1 Feather set | 48 wakes and 3 transmissions in 24 h; 0 µA into the battery on USB; 7 days on cells extrapolates to ≥ 12 months | [SCO-160](https://linear.app/scout1/issue/SCO-160), [SCO-159](https://linear.app/scout1/issue/SCO-159) | Phase 2 |
| 5 | Saltwater waterproofing, coupons | Coupon | Several, consumed | Dry paper towel after 24 h at ≥ 0.3 m in ~35 ppt, then 1 week. Sensor-pod seal: RR-12 to RR-16. Wall count: 1, 2, 3 layers | [SCO-108](https://linear.app/scout1/issue/SCO-108), [SCO-141](https://linear.app/scout1/issue/SCO-141), [SCO-176](https://linear.app/scout1/issue/SCO-176) (1-week pod soak, due 10/30) | Now to early Nov |
| 6 | Drop and impact | Coupon, looks-like | Sacrificial ring, wedges | No cracks; height, surface and orientation recorded | [SCO-173](https://linear.app/scout1/issue/SCO-173) (due 10/22) | Oct |
| 7 | Float and self-righting, in a bin | Looks-like | Buoy A | Freeboard within ±0.5 in of the model; rights itself unaided from 90° and 180°; waterline shift recorded at ~35 ppt | [SCO-171](https://linear.app/scout1/issue/SCO-171) (10/27), [SCO-172](https://linear.app/scout1/issue/SCO-172) (10/30) | Late Oct |
| 8 | Pressure | Works-like | Sealed housings | Dry at ≥ 8 m equivalent (~0.8 bar) for 24 h | [SCO-177](https://linear.app/scout1/issue/SCO-177) (due 11/9) | Early Nov |
| 9 | Lid, antenna bulkhead and battery bay | Works-like | Buoy B | Lid seals; antenna feed-through stays dry | [SCO-162](https://linear.app/scout1/issue/SCO-162) (due 11/13) | Mid Nov |
| 10 | Long-duration soak, sealed | Works-like | Buoy B (and Buoy A as the empty control) | Internal humidity stable and not rising for 4+ weeks; ≥ 95% of packets received; no resets | [SCO-180](https://linear.app/scout1/issue/SCO-180) (due 11/27), [SCO-161](https://linear.app/scout1/issue/SCO-161) | Start by 10/30 |
| 11 | Integrated MVP | Works-like | Buoy B + shore station | Electronics in the floating buoy, sensors reading, packet received at the shore | [SCO-182](https://linear.app/scout1/issue/SCO-182) (due 12/4) | Early Dec |
| 12 | Real-ocean flotation | Looks-like or works-like | Buoy A or B | Floats at the modelled waterline in open water; self-rights; no leaks | [SCO-183](https://linear.app/scout1/issue/SCO-183) plan (11/20), [SCO-184](https://linear.app/scout1/issue/SCO-184) run (1/29) | Jan 2027 |
| 13 | Integrated waterproof, load and tilt | Works-like | Buoy B | The full-system version of stages 7–8 | [SCO-82](https://linear.app/scout1/issue/SCO-82) (due 2/26) | Phase 4 |
| 14 | Prototype deployment | Works-like | Buoy B + shore station | Daily data for the whole test (2–4 weeks); temperature matches a reference logger; no leaks | [SCO-143](https://linear.app/scout1/issue/SCO-143), [SCO-195](https://linear.app/scout1/issue/SCO-195) | Phase 4 |
| 15 | Hawaii | Works-like | Both buoys + shore station | Per the permit route chosen ([SCO-185](https://linear.app/scout1/issue/SCO-185)) | [SCO-164](https://linear.app/scout1/issue/SCO-164) (window, 11/6) | Phase 5–6 |

Stages 1–4 are the electronics track in
[Electronics Build and Test Plan](electronics-build-and-test-plan.md), which holds the full
benchmark list. The hydrophone stage is left out here because the hydrophone part is still
open ([SCO-8](https://linear.app/scout1/issue/SCO-8)).

**Dropped:** the proof-load of the mooring attachment ([SCO-174](https://linear.app/scout1/issue/SCO-174))
is cancelled. The foam-fill trials and the
foam-filled second buoy ([SCO-76](https://linear.app/scout1/issue/SCO-76),
[SCO-179](https://linear.app/scout1/issue/SCO-179), [SCO-181](https://linear.app/scout1/issue/SCO-181))
are deferred with the printed-infill redesign.

## Does the timeline fit?

Electronics and a mechanical prototype by winter break; winter quarter for integrated testing;
Hawaii over spring break.

| Check | Result |
|---|---|
| Stage 10 needs 4 weeks, due 11/27 | **Tight.** It must start by 10/30, the same day the bin float (stage 7) and the pod soak (stage 5) are due. Any slip in those pushes the soak past 11/27 |
| Stages 8 and 9 depend on the housing design | **At risk.** Per-compartment waterproofing is TBD (2026-10-16), and the pressure test is due 11/9 |
| Stage 11 needs the electronics Stage 8 result | Depends on [SCO-161](https://linear.app/scout1/issue/SCO-161) (sealed run) landing by late Nov |
| Winter quarter integrated testing | Stages 12–14 fit January to February if stages 1–11 close by 12/4 |
| Hawaii live deployment | **Not on the critical path of testing; on the critical path of permits.** NOAA wait is reported as 3 months to 1 year after a full submission |

## Plan B and C

If the schedule or the permit slips:

- **Plan B, local systems test.** Monterey or Santa Cruz host for a weeks-long run
  ([SCO-195](https://linear.app/scout1/issue/SCO-195)), or SCU pool access for float and link
  tests ([SCO-143](https://linear.app/scout1/issue/SCO-143)). Stages 12 and 14 run here first.
- **Plan C, attended or hung configuration.** An attended anchor-free test, a sensor hung from
  a boat in a slip ([SCO-194](https://linear.app/scout1/issue/SCO-194)), or the float-free
  configuration ([SCO-147](https://linear.app/scout1/issue/SCO-147)). Lightest permit load.
- **Cut order if time runs out:** drop stage 13 (repeat of stages 7–8 on the full system)
  before dropping stage 10 (the soak), because slow leaks are the failure that ends a deployment.

## Open decisions

1. **Unit count.** Two complete buoys is the proposal. A third would let the soak (stage 10)
   run while another buoy is open for electronics work. Cost: another print set and filament.
2. **Benchmarks are not all numeric yet.** [SCO-139](https://linear.app/scout1/issue/SCO-139)
   is marked Done, but [EDD §21](engineering-design-document.md) still lists acceptance
   criteria without numbers, and the register still calls its benchmarks provisional. This
   page uses the numbers from the electronics plan and the register. They need to be written
   into EDD §21.
3. **Dates.** Every date above is the current Linear due date. Several are already past
   (for example the stage 5 coupons), so the dates need a pass once the team confirms the plan.
4. **Which buoy is the empty control** in the soak, now that the first buoy is a spare and the
   foam-filled second unit is deferred.
