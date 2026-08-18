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
