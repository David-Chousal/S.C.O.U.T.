# ECE Work Plan 2026–27

> **Summary** — Week-by-week plan for the ECE (electrical) track, from the 2026-10-06 parts
> order to the spring deployment, with a fixed weekly routine and monthly gates. Each week has
> one goal, the tasks to finish, and the Linear issue it closes. Built to be strict but
> realistic: about **10–12 hours a week** of senior-design time, with exams and winter break
> planned in. If a week slips, the next week's first task is to catch up, not to start new work.
>
> Owner: Isabella Rodriguez (ECEN). Stages and benchmarks: [Electronics Build and Test Plan](../engineering/electronics-build-and-test-plan.md).
> Team phases: [Team Timeline](team-timeline.md).

---

## Weekly routine

| Day | Block | What |
|---|---|---|
| **Monday** | 15 min | Pick this week's Linear issues; move them to *In Progress*. Re-read this week's row below |
| **Mon / Wed / Fri** | 2–3 h lab each | Hands-on bench work only: build, measure, fix |
| **Tue / Thu** | 1 h | Paperwork: orders, datasheets, write up measurements, answer the team |
| **Every lab day** | 5 min, same day | Log every measurement (value, units, setup, date) in `hardware/test/measurement-log.md` — never from memory later |
| **Friday** | 20 min | Weekly review: close or roll Linear issues, add a one-line Hub journal note, flag any blocker older than 2 days in team chat |
| **First Friday of the month** | 30 min | Gate check against the monthly table below; if behind, cut scope (not sleep) and tell the team |

**Rules**

1. No purchase without the stage that needs it (see the buying schedule).
2. A blocker older than 2 days goes to the team.
3. Every number that changes the power budget updates `facts.md` that week.
4. Never transmit without an antenna, and never put a primary cell on a Feather that still has its charger.

## October 2026 — Bench bring-up (Phase 1)

| Week | Goal | Tasks | Closes |
|---|---|---|---|
| **Oct 5–11** | Ready before parts land | Orders placed (Adafruit + Mouser). Install Arduino IDE, SAMD board package, RadioHead, OneWire, DallasTemperature, RTClib, SdFat. Book lab soldering + bench supply. Draw the breadboard layout from the pin table | SCO-115 (order) |
| **Oct 12–18** | Stage 1: first readings | Solder headers (M0, Adalogger, S3, LoRa wing, antennas). DS18B20 ±0.5 °C check. Grove turbidity clear > turbid. SD CSV + RTC across a power cycle. Phase 1 demo | SCO-157 (Stage 1) |
| **Oct 19–25** | Stage 2: real power numbers | Bench supply at 3.6 V on BAT, USB unplugged. Measure sleep, awake, turbidity, TX. Update `facts.md` + budget. **Go/no-go on two D cells → place Later order 1** | SCO-23, SCO-157 (Stage 2), SCO-158 (Later 1) |
| **Oct 26–Nov 1** | Stage 3 + radio | DMG2305UX switch on its adapter, off-current < 1 µA. Bench LoRa link to the S3 shore station with David. Wire the SHT40 | SCO-157 (Stage 3), SCO-87 |

**October gate:** sleep current measured, sensors switch off cleanly, packets reach the shore station.

## November 2026 — Integration on batteries (Phase 2)

| Week | Goal | Tasks | Closes |
|---|---|---|---|
| **Nov 2–8** | Stage 4–5 | Outdoor range test with spring antennas (RSSI vs distance). 24 h standby loop with David's schedule firmware. | SCO-24, SCO-160, SCO-165 |
| **Nov 2–15** | Hydrophone (Stage 7) | Hydrophone + preamp + larger microSD ordered (Later 2) once it arrives in ~a month: plug-in-power bias from 3.3 V, preamp, 22.05 kHz 1-min clips to SD, recording current, clips through the pipeline | SCO-8, SCO-158 |
| **Nov 9–15** | Battery safety | D cells arrive. Remove the charger IC on the deployment Feather; build ideal diodes + fuse + keyed JST plug. Verify 0 µA into the battery with USB on | SCO-150 |
| **Nov 16–22** | Stage 6 start | Start the 7-day run on two D cells. Move the switch circuit from breadboard to the FeatherWing Proto | SCO-159 |
| **Nov 23–29** | Stage 6 result (Thanksgiving) | Finish the 7-day run; extrapolate to 12 months; update ADR-0007 | SCO-159, SCO-10 |

**November gate:** a full day-cycle on real cells with no charge path, extrapolating to ≥ 12 months. ADR-0007 can be accepted.

## December 2026 — Harden before the break (Phase 3 start)

| Week | Goal | Tasks | Closes |
|---|---|---|---|
| **Nov 30–Dec 6** | Soldered build | Everything off the breadboard: M0 + Adalogger + Proto stack, crimped/soldered leads, JST battery plug. Hand dimensions to John Ryan | SCO-162 (inputs) |
| **Dec 7–13** | Finals (light) | Only: write the wiring diagram + measurement summary into `hardware/` | — |
| **Dec 14–Jan 3** | Winter break (remote) | Draft the field checklist and the Enclosure Assembly Guide electronics section. Prepare the Later 2 order (hydrophone) so it goes out on day 1 of winter quarter | — |

**December gate:** a soldered, documented electronics stack that survives being carried around.

## January–February 2027 — Hydrophone, housing, water (Phases 3–4)

| Week | Goal | Tasks | Closes |
|---|---|---|---|
| **Jan 4–10** | Housing parts | Order Later 3 (whip antenna, coating, desiccant) with the winter-quarter senior-design budget | SCO-158 |
| **Jan 11–24** | Stage 7 + into the housing | Install electronics in the housing with John Ryan; fit the uFL + SMA bulkhead | SCO-8 |
| **Jan 25–Feb 7** | Stage 8 sealed soak | 7–14 days sealed: ≥ 95% packets, humidity flat, no resets | SCO-161 |
| **Feb 8–26** | Phase 4 water test | 2 weeks at the local site (Monterey dock or pool, SCO-143). Fix what breaks. Order spares | SCO-143, SCO-14 |

**February gate:** two weeks in real water with daily data. Book the D-cell shipment to Hawaii (SCO-163).

## March–May 2027 — Deployment (Phases 5–6)

| Week | Goal | Tasks | Closes |
|---|---|---|---|
| **Mar 1–19** | Final prep | Final build, spare kit, field checklist dry run, D cells shipped to the host (arrive ≥ 2 weeks early) | SCO-163 |
| **Spring break** | Away | Remote support only; deployment per SCO-164 (host or team without ECE, or after break) | SCO-164 |
| **Apr–May** | Deployed | Daily telemetry check (10 min), weekly battery-trend note, recovery late May | — |

## How to keep this current

- This file is the plan; **Linear is the live tracker**. Each row maps to the issues it closes.
- If a gate is missed, edit the following rows here in the same PR that records the slip in
  the Hub journal. Don't let the plan and reality drift apart silently.
