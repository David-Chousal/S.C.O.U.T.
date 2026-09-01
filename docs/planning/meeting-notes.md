# Team Meeting Notes

> **Summary** — Running notes from team design meetings, beginning with the 2026-05-08 component brainstorm.
>
> **Source document** — `Meeting Notes_.docx`

---

**Attendees** — John Myrdal · Isabella Rodriguez · David Chousal Cantu

---

**5/8/2026**

**Brainstorming and First Steps:**

## STATIONARY NEARSHORE DATA COLLECTING BUOY COMPONENTS

### Hardware

- Thermistor

- Oxygen Level Sensor

- Hydrophone/Sonar?

- Accelorometer/IMU

- CPU

- Long Distance Radio

### Power Generation & Management

> A battery alone won't last long if we are doing signal processing or long-distance transmission.

- **Solar Panels & Mounts:** Flexible or rigid panels are standard. We’ll need a **Solar Charge Controller (MPPT)** to efficiently charge the battery.

- **Power Management System (PMS):** A dedicated board to handle "sleep cycles." We want the CPU to wake up, sample, transmit, and go back to sleep to save power.

- **Real-Time Clock (RTC):** If our CPU is in deep sleep, we need an ultra-low-power RTC to "wake" the system for scheduled data dumps.

### Software

- Off-board data center / database for data analysis

- Signal processing software (Continuously transmitting or periodic data dump? Look into energy/computing costs)

- Data processing software - Traditional or neural network.

### Software & Data Strategy

- **On-board Logging (SD Card):** Always have a "black box" backup. If the radio fails, we want the data saved locally for when the buoy is recovered

- **Watchdog Timer (WDT):** A hardware or software "dead man's switch." If our code freezes due to a bug, the WDT will force a hard reboot.

- **State of Health (SoH) Telemetry:** Don't just send oxygen levels; send battery voltage, internal temperature, and humidity. This tells us if our buoy is "dying" before it actually does.

### Communications & Navigation

- **LoRa** technology provides reliable, low-power ship-to-shore communication over seawater, bypassing the need for cellular or satellite coverage. *(Correction, 2026-08-14: the "15–20+ km" figure noted here was optimistic. The RFM95 does ~2 km line-of-sight with a tuned antenna per the Adafruit range FAQ; real over-saltwater range is expected to be lower and will be measured in Phase 4.)*

### Marine Safety & Legal Requirements

> To prevent our buoy from being a "hazard to navigation" (and to stop ships from potentially hitting it), we need specific hardware:

- **Navigation Light:** A yellow flashing LED (required by Coast Guard/IALA regulations for "Special Marks").

- **Radar Reflector:** A passive metal shape that makes our buoy visible on a ship’s radar.

- **AIS (Automatic Identification System):** A transponder that broadcasts its position to nearby ships (highly recommended for high-traffic areas).

### Structure 

- Floatation device

- Electronic hardware & transmitter housing

- Sensor housing

- Ballast

- Anchor/subsea securing system

### Structural Durability & Maintenance

> The ocean is a "universal solvent." We need to protect the buoy from the elements.

- **Biofouling Protection:** Sensors (especially the O2 sensor) will be covered in algae within weeks. Look into **copper mesh** or **mechanical wipers** for the sensor faces.

- **Sacrificial Anodes:** Zinc or aluminum blocks bolted to the metal frame to prevent "Galvanic Corrosion" from eating our structural components.

- **Desiccant Packs:** Even a "sealed" housing will have humidity. Use silica gel packets inside to prevent condensation on our electronics.

- **Mooring Hardware:** We listed "Anchor," but let’s not forget **swivels** (to prevent the rope from tangling as the buoy spins) and **shackles** with seizing wire.

---

## 2026-08-17 — SCOUT Weekly

**Attendees:** David Chousal Cantu (CSEN) · John Ryan Myrdal (GENG) · Navid Shaghaghi (advisor)
**Absent:** Isabella Rodriguez (ECEN) — the three open Phase 0 hardware decisions were not
taken as a result.

### Decisions

| Decision | Record |
|---|---|
| **V1 sensing payload closed** — temperature, turbidity, hydrophone. **Dissolved oxygen excluded**: NOAA has largely stopped using it for reef monitoring because a point reading is too locally sensitive to represent reef-wide health. Returns only as a stretch, via the lab's existing infrared DO sensor | [ADR-0005](../decisions/0005-v1-sensing-payload.md), [SCO-11](https://linear.app/scout1/issue/SCO-11) |
| **Two temperature measurements** — external waterproof probe for water; a separate cheap internal temp + humidity sensor for State of Health, where a humidity rise in a sealed bay means a leak | [SCO-60](https://linear.app/scout1/issue/SCO-60) |
| **Flotation = wedge system + expanding foam**, bolted and epoxied to a central chassis. Mechanical interlocks were prototyped and dropped for bolting. FEA minimum safety factor **25** against a threshold of 4 | [SCO-48](https://linear.app/scout1/issue/SCO-48) |
| **Wiring moves to modular snap connectors** — each module mates as it stacks; cables remain only where something leaves the chassis | [SCO-61](https://linear.app/scout1/issue/SCO-61) |
| **The chat assistant will be renamed** — "Fred" came from a British colonial-army scout. Replacement to honour a coral-reef scientist or reef-bioacoustics pioneer | [SCO-65](https://linear.app/scout1/issue/SCO-65) |

### Reported

- **Electronics housing printed and sealed** — O-ring seal held a water test with no ingress.
  Bay opens via six heat-set screws, under a minute.
- **Housing diameter already fits every component except possibly the battery**; height is
  deliberately dynamic. **The battery and solar panel — not the PCB — set the lower bound on
  volume**, so those are the blocking dimensions from ECE.
- Hurricane on the Hawaii side took out power and internet; John worked offline through it.

### Raised

- **GPS and lid-open tamper detection** for a buoy left unattended for a year — a tamper event
  probably needs an out-of-band transmission rather than waiting for the daily packet
  ([SCO-62](https://linear.app/scout1/issue/SCO-62)).
- **Acoustic tamper/impact detection** using the hydrophone already on board — deferred, since
  a lid switch answers the same question for pennies, but boat-strike detection has no cheap
  equivalent ([SCO-67](https://linear.app/scout1/issue/SCO-67)).
- **Large lab 3D printer is offline** after a power-supply swap. It is the only machine that
  can print full-scale sections ([SCO-63](https://linear.app/scout1/issue/SCO-63)).
- **Build material still open** — PETG vs ABS vs ASA, with SLA and nylon worth comparing.
  Agreed to print one sample per material ([SCO-64](https://linear.app/scout1/issue/SCO-64)).

### Flagged — unresolved

**The printed O-ring result conflicts with the recorded decision.** [SCO-55](https://linear.app/scout1/issue/SCO-55)
was closed the same day with *"O-rings will be purchased off-the-shelf… printed parts are
porous along layer lines."* John's printed ring then held a water test. He qualified it
himself — *"I clamped it really hard, though"* — and the test was not the qualifying one: the
decision rests on a **5 m water-equivalent pressure test** and long-duration compression set,
neither of which a static ambient immersion exercises. Recorded rather than reconciled; needs
a two-minute call next week.

### Next steps

| Action | Owner |
|---|---|
| **Battery + solar panel dimensions, then board envelope** — the blocking inputs for housing geometry | Isabella |
| Three open Phase 0 decisions: charging path, hydrophone part number (due Aug 28) | Isabella |
| Diagnose the large lab printer; document bed sizes across all available machines | John Ryan |
| Add mechanical and systems tasks to Linear as they come up | John Ryan |
| Website design pass; hardware testing blocked until back on campus | David |

---

## 2026-08-24 — SCOUT Weekly

**Attendees:** John Ryan Myrdal (GENG) · David Chousal Cantu (CSEN) · Isabella Rodriguez (ECEN)
· Navid Shaghaghi (advisor)

Raw transcript's speaker labels were an anonymized "Me"/"Them" throughout (Granola/Zoom
diarization gap, not a name issue on our end) — attribution below is inferred from content and
should be corrected if wrong.

### Decisions

- **Staged sensor power control**: V1 ships with sensors always-on (simplest path to a working
  end-to-end system); per-sensor transistor switching is a deliberate **V2** step, not a blocker
  for initial bring-up. Isabella and David agreed explicitly ("the switch is like V2" / "yeah, I
  agree") ([SCO-87](https://linear.app/scout1/issue/SCO-87)).
- **Buy, don't build, for now**: Rev A bring-up uses an off-the-shelf Feather M0, not a custom
  board — reaffirms [ADR-0001](../decisions/0001-mcu-and-radio-selection.md), doesn't change it.
  A custom board remains a possible future-phase goal, explicitly not now.
- **Team intends to form an LLC** around SCOUT for IP protection, independent of whether
  anything commercial ever comes of it — protects the IP even once the capstone report is
  public via the school library. Strong verbal agreement ("I think we should do it, definitely");
  John will send state-comparison info and handle incorporation
  ([SCO-90](https://linear.app/scout1/issue/SCO-90)). **Not yet executed** — no state chosen, no
  paperwork filed.

### Reported

- **Isabella — Rev A schematic**: KiCad schematic done for the Feather M0, battery, and the two
  currently-schematic'd sensors (DS18B20 temperature, SEN0189 turbidity) — reviewed against
  datasheets, not yet physically tested. Deliberately left out the solar panel and hydrophone
  (both still open — power budget and part choice, respectively). Changed the battery/charging
  approach from what the EDD originally specified, matching the LiPo + external bq25185 charger
  path already documented in [ADR-0002's counterpart PR](https://github.com/David-Chousal/S.C.O.U.T./pull/102).
- **Isabella/David — base station**: still deciding the shore-station node architecture — open
  question is whether it needs concurrent LoRa+WiFi (would need an ESP32-S3 class part) or can
  do it sequentially (M0 + a separate WiFi module is enough)
  ([SCO-86](https://linear.app/scout1/issue/SCO-86)).
- **John — mass/buoyancy model**: confirmed live on the call that the printed shell alone (not
  counting foam) already exceeds the buoyancy needed — matches the
  [2026-08-24 weigh-in work](../hub/design-notes.md) landing the same day. Plan is to shrink the
  floatation design rather than keep the current oversized margin
  ([SCO-48](https://linear.app/scout1/issue/SCO-48) comment).
- **John — waterproofing tests**: reported the same two bench tests written up in
  [`mechanical/test/waterproofing-submersion-test-2026-08-24.md`](../../mechanical/test/waterproofing-submersion-test-2026-08-24.md) —
  electronics housing water-resistant, not waterproof (expected); sensor pod passed with "a
  really horrible" printed O-ring. Isabella/Navid asked the right follow-up — *at what
  pressure?* — this was an ambient bench test, not a pressure test. John committed to a pool
  drop test (targeting the ~5 m equivalent) before returning to campus.
- **John — CAD**: building a tentative electronics mounting plate to size required housing
  volume, pending Isabella's confirmed component list (battery + boards) — Isabella asked to
  verify that list directly with her rather than trust an AI-summarized version, citing past
  incorrect merges ([SCO-70](https://linear.app/scout1/issue/SCO-70) comment). Also mentioned
  switching primary CAD modeling work to **Fusion 360** ("because it's just better") — not yet
  reconciled against [`mechanical/cad/README.md`](../../mechanical/cad/README.md)'s stated single
  shared Onshape document as the native source; flagged in `facts.md`, not resolved here.
  Getting a third 3D printer; may print the full chassis as a single large print.

### Raised

- **Base-station architecture** — see Reported above; genuinely undecided, not just unstated
  ([SCO-86](https://linear.app/scout1/issue/SCO-86)).
- **CAD native-source tool** — Onshape (documented) vs. Fusion 360 (what John described using
  live on the call) — not reconciled.
- **Funding mechanics** — confirmed workable: buy through Navid's lab now (parts become lab
  property until reimbursed), re-request once official Senior Design funding opens. Depends on
  Navid's lab absorbing the interim cost.

### Flagged — unresolved

**The printed-O-ring-vs-SCO-55-decision tension from the 2026-08-17 meeting is still open —
two weeks running.** That entry flagged a printed O-ring passing a water test against the
recorded off-the-shelf-only decision and said it "needs a two-minute call next week." That call
didn't happen; instead, John ran a related (not the same) bench test this week, again with
printed O-rings, again for practical reasons (speed, not a deliberate comparison — see
[`facts.md`](../hub/facts.md#mechanical--deployment)). The underlying question — does the
off-the-shelf-O-ring decision hold up, or should it be revisited given two now-passing printed
O-ring results — still hasn't gotten its own conversation.

### Next steps

| Action | Owner |
|---|---|
| Assemble Rev A bring-up order cart (M0, sensors, wiring), share total cost | Isabella |
| Order Rev A parts through lab funding | Isabella ([SCO-88](https://linear.app/scout1/issue/SCO-88)) |
| Continue base-station architecture research (S3 vs M0+M0+WiFi) | David |
| Confirm exact component list (battery, boards) with John directly | Isabella |
| Build electronics mounting plate once component list confirmed | John Ryan |
| Pressure-test the sensor housing (pool drop, ~5 m target) before returning to campus | John Ryan |
| McMaster order for heat-set inserts/fasteners — check campus garage stock first | John Ryan ([SCO-89](https://linear.app/scout1/issue/SCO-89)) |
| Have the still-open printed-O-ring vs. SCO-55 conversation — second week flagged | Team |
| Reconcile CAD native-source documentation (Onshape vs. Fusion 360) | John Ryan |
| Talk to advisor (Maria, per John's referral) about overall project guidance | Isabella |
| Send LLC state-comparison info to the team | John Ryan ([SCO-90](https://linear.app/scout1/issue/SCO-90)) |

---

## 2026-08-31 — SCOUT Weekly

**Attendees:** John Ryan Myrdal (GENG) · David Chousal Cantu (CSEN) · Navid Shaghaghi (advisor)

**Absent:** Isabella Rodriguez (ECEN) — her open hardware decisions were the meeting's main
unblocked-work topic, discussed without her.

Raw transcript's speaker labels were an anonymized "Me"/"Them" throughout (Granola/Zoom
diarization gap) — attribution below is inferred from content and should be corrected if wrong.

### Decisions

- **Meeting cadence**: next week (Labor Day) skipped; team reconvenes **2026-09-14**. That is
  the last meeting before the quarter starts, and is meant to set the standing meeting schedule
  and finalize what John Ryan brings to campus. The two-week gap was chosen deliberately to give
  Isabella time to make her hardware decisions and get parts ordered and tested.
- **Patent the system as a whole**, not individual components. David's market research had
  concluded there was little patent potential; Navid reframed it — the filing target is the
  integrated system ("nobody else has made a floating buoy that monitors coral… you just need
  one thing that's different"), not any subsystem
  ([SCO-95](https://linear.app/scout1/issue/SCO-95)).
- **Not pursuing defense/military applications.** The hydrophone capability was noted as
  attractive to that market and the team explicitly declined the angle ("we'll leave that to
  you"). Recorded because it constrains the commercialization path, not because anything was
  built differently.
- **Business model direction**: a public **paid** API for raw data access, plus a dashboard
  aggregating all deployed buoys. "Public" here means anyone can buy access, not free. LLC and
  IP to be established before next summer, ahead of applying to the BBA startup program.
- **Anchor plan reaffirmed**: tie to pre-existing piles; do not drill into the sea floor
  ([ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) holds).

### Reported

- **John Ryan — mechanical design essentially complete.** A full-panel FEA run covered every
  critical force scenario the team could construct, including anchor strike, whale impact, and
  low-probability twist cases. Headline result: **the metal shackle fails before the buoy
  does** — the structure is significantly overbuilt. Flotation foam is polyurethane-based and
  fully waterproof; expectation is it absorbs a projectile rather than allowing a clean
  puncture, though that is unverified
  ([SCO-73](https://linear.app/scout1/issue/SCO-73), [SCO-71](https://linear.app/scout1/issue/SCO-71)).
- **John Ryan — turbidity pod housing redesigned from scratch** after the earlier leak, using
  industrial marine standards throughout. Now standardized to O-ring sizes with a proper static
  face seal, and engraved with team initials, "SCOUT", "Electronics Housing", and the rated
  depth. Seal quality by eye is good; **face groove depth is not yet confirmed** and the O-ring
  squeeze still needs to be validated into the 15–30% window
  ([SCO-91](https://linear.app/scout1/issue/SCO-91)).
- **John Ryan — printing and travel plan**: flotation wedges printed before travel and carried
  in luggage; bamboo printer staying home, large filament supply travelling instead. The chassis
  is a single ~35-hour print he may run on an industrial printer at work over Labor Day — if it
  succeeds, buoy assembly drops to roughly ten minutes
  ([SCO-93](https://linear.app/scout1/issue/SCO-93)). STEP files can be sent to David to print
  locally if extra capacity is needed. **Target: hardware assembled and buoy ready by October.**
- **David — software track functionally complete for Phase 1 and now parts-limited.** Analytics
  and pipeline work is done and tested against dummy data; firmware drivers
  ([SCO-25](https://linear.app/scout1/issue/SCO-25)) and the real LoRa receiver
  ([SCO-24](https://linear.app/scout1/issue/SCO-24)) are written and waiting on hardware. Only
  two open items are not hardware-blocked: measurement units
  ([SCO-13](https://linear.app/scout1/issue/SCO-13)) and the "Fred" rename
  ([SCO-65](https://linear.app/scout1/issue/SCO-65)).
- **Navid — senior design lab expectations**: the lab runs as weekly milestones (hazards form,
  budget, writing sections). An Overleaf LaTeX template will be shared with the three team
  members, Navid, and the lab TA. Writing starts early and sections will evolve — the point is
  to force steady progress rather than a final-week scramble. John Ryan will handle GE-specific
  extras such as lifecycle analysis. Consensus that the team is significantly ahead of a typical
  senior design team at this stage.

### Raised

- **Corrosion strategy** — Navid raised that salt will attack every exposed fastener over a
  year-long deployment; worst case the buoy has to be drilled apart to service it. Agreed
  approach: all-stainless hardware, plus an epoxy / polyurethane / silicone plug poured over
  exposed bolt heads, with 3D-printed containment walls to hold the pour. Dig out the plug to
  service. Purpose is **salt exclusion**, explicitly not biofouling
  ([SCO-92](https://linear.app/scout1/issue/SCO-92)).
- **Threaded-insert technique** — Navid suggested pausing the print, dropping the insert in, and
  resuming, so the plastic encloses the insert rather than being remelted around it. Avoids the
  off-axis heat-set failure mode; he has lab samples to show. John Ryan interested but wary
  ([SCO-94](https://linear.app/scout1/issue/SCO-94)).
- **LoRa range and the candidate test site** — the ~2 km line-of-sight figure is spec, not
  measured ([SCO-14](https://linear.app/scout1/issue/SCO-14)). A likely test site is well off
  shore; John Ryan took the action to measure the actual distance
  ([SCO-96](https://linear.app/scout1/issue/SCO-96)). Fallback if out of range: **hop the signal
  through a large pre-existing buoy already moored on-site**, which conveniently also solves
  mooring at that site. Failing that, more onboard memory and physical retrieval.
- **Sharp-impact and projectile cases were not modelled** in the FEA panel. Worth computing the
  puncture threshold as a report statistic ([SCO-71](https://linear.app/scout1/issue/SCO-71)).
- **Hawaii deployment timing** confirmed as **spring break**, matching Phase 6.

### Flagged — unresolved

**The biofouling mitigation decision appears to have been reversed, and the reversal has not
been ratified.** [SCO-15](https://linear.app/scout1/issue/SCO-15) is `Done` and
[`status.md`](../hub/status.md) records the outcome as the **Sea Hawk Smart Solution
antifouling coating**, chosen 2026-08-18. On this call the team reached the opposite position:
anti-barnacle paint ruled out, because a coating effective enough to stop growth would harm the
reef — "if it's super resistant, it's going to kill the reef, which is super counterproductive."
The stated preference is now to let natural growth occur, with John Ryan citing prior work on
3D-printed surfaces that actively attract coral growth and interest in making the buoy part of
the reef ecosystem.

Three readings are possible and nobody picked one: the coating decision stands and this was
informal musing; the decision is genuinely reversed and needs a decision-log row plus
corrections to `status.md`; or both hold at different scopes (coating on sensor optics, natural
growth on the hull). **The coating is on the purchase list, so this should not sit.** Flagged on
[SCO-15](https://linear.app/scout1/issue/SCO-15) rather than silently reconciled.

**Phase 0's end date drifted without a decision.** David noticed the Linear project now runs to
2026-09-20 rather than Sep 4 and asked John Ryan directly whether he had extended it; John Ryan
said it was unintentional and he had not touched the phase dates. Nobody chose the new date. It
was shrugged off on the call ("we're still at phase zero anyway") but it means the mirrored
correction in [PR #116](https://github.com/David-Chousal/S.C.O.U.T./pull/116) is codifying an
accident — resetting Linear back to Sep 4 is equally defensible. Also note Sep 20 now overlaps
Phase 1, which starts Sep 7.

**The printed-O-ring vs. [SCO-55](https://linear.app/scout1/issue/SCO-55) tension has aged out
rather than been resolved.** Flagged in both the 2026-08-17 and 2026-08-24 entries as needing a
short call that never happened. The housing has since been remodelled around off-the-shelf
O-ring sizes ([SCO-91](https://linear.app/scout1/issue/SCO-91)), which arguably settles it in
practice — but no one said so explicitly, and the record still shows an open question.

### Next steps

| Action | Owner |
|---|---|
| Communicate the two-week window to Isabella over chat — decisions + parts list needed | David · Navid |
| Deliver the final electronics component list and dimensions by 2026-09-14 | Isabella ([SCO-70](https://linear.app/scout1/issue/SCO-70)) |
| Close the open hardware decisions — charging path, hydrophone part, base-station node | Isabella ([SCO-10](https://linear.app/scout1/issue/SCO-10), [SCO-8](https://linear.app/scout1/issue/SCO-8), [SCO-86](https://linear.app/scout1/issue/SCO-86)) |
| Buy Rev A parts against lab funding once the list arrives | Navid ([SCO-88](https://linear.app/scout1/issue/SCO-88)) |
| Attempt the chassis print on the work industrial printer over Labor Day | John Ryan ([SCO-93](https://linear.app/scout1/issue/SCO-93)) |
| Confirm or replace the "Fred" name before the next meeting | John Ryan ([SCO-65](https://linear.app/scout1/issue/SCO-65)) |
| Decide on-board measurement units | David ([SCO-13](https://linear.app/scout1/issue/SCO-13)) |
| Confirm face groove depth and validate O-ring squeeze on the remodelled housing | John Ryan ([SCO-91](https://linear.app/scout1/issue/SCO-91)) |
| Measure shore-to-site distance for the candidate Hawaii test location | John Ryan ([SCO-96](https://linear.app/scout1/issue/SCO-96)) |
| Resolve the biofouling coating reversal — ratify or revert | Team ([SCO-15](https://linear.app/scout1/issue/SCO-15)) |
| Settle whether Phase 0 ends Sep 4 or Sep 20 | Team ([PR #116](https://github.com/David-Chousal/S.C.O.U.T./pull/116)) |
