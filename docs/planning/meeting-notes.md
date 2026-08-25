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
