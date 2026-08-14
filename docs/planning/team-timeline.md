# Full Team Master Timeline & Work Plan

> **Summary** — Phase-by-phase work plan from kickoff through Hawaii deployment, with parallel tracks for each discipline lead.
>
> **Source document** — `SCOUT_TeamTimeline.docx`
>
> **Note** — the original used wide 4-column tables. Restructured into per-phase sections so each track reads cleanly in Notion.
>
> **Re-baselined 2026-08-14** — the original plan ran Phases 0–2 over summer 2026. Those
> deliverables did not complete (firmware had not started), so the schedule was reset to run
> **Aug 14, 2026 → May 28, 2027**. The windows below are the current plan; the Linear phase
> projects mirror these dates exactly.

---

## How this document works

Each phase below shows what every team member is doing in parallel. The ECE lead builds
hardware, the CS lead writes firmware on their own dev board, and the GE lead designs and
tests the physical buoy structure. Each phase ends with a team check-in and a research item
every member completes before the next phase begins.

**Tracks:** ECE — Hardware Lead · CS — Software Lead · GE — Field & Mech Lead

---

## PHASE 0

**Window:** Aug 14 – Sep 4, 2026 (3 weeks)

**Goal:** Kickoff: Order Parts · Set Up Tools · Align on Design

### ECE — Hardware Lead

- Place Phase 1 BOM order on Adafruit (~$225)
- Install Arduino IDE + ESP32 board package
- Install all firmware libraries (DallasTemp, RTClib, RadioHead, LoRa, ArduinoJson)
- Confirm a test blink sketch uploads to ESP32 without errors
- Share GPIO pin assignment table with CS lead
- Buy breadboard, jumper wires, multimeter if not already owned
- RESEARCH HOMEWORK  ALL: Read the ÂB / EACP paper (Shaghaghi et al., 2020) — this is the comm protocol we are adapting. Focus on the sleep-wake synchronization concept. Come to check-in able to explain it in one paragraph.

### CS — Software Lead

- Buy a bare ESP32 dev board (~$10-15 on Amazon) for independent firmware dev
- Install Arduino IDE or PlatformIO (VS Code)
- Install same library list ECE shares; confirm compile
- Read LoRa packet format spec from ECE lead
- Decide on CSV data schema: columns, units, timestamp format
- Set up GitHub repo — invite all team members

### GE — Field & Mech Lead

- Sketch 3 rough buoy hull concepts (top view + side view, hand-drawn OK)
- Research IP68-rated enclosure options for electronics (Pelican, Hammond)
- Note dimensions: hull must fit ~6x4x2 in enclosure + battery inside or below
- Research coral reef mooring best practices (reef-safe anchoring)
- Document Hawaii deployment site conditions: avg wave height, depth, current
- Contact local dive shop or researcher at Hawaii site for site access plan

### Notes

- TEAM CHECK-IN  End of Phase 0: 30-min video call. Review hull sketches together. Confirm GPIO table is shared and understood. Confirm GitHub repo has everyone committed. Agree on CSV data format.

---

## PHASE 1

**Window:** Sep 7 – Oct 16, 2026 (6 weeks, Fall Quarter)

**Goal:** Subsystem Bring-Up — All Three Tracks Running in Parallel

### ECE — Hardware Lead

- Week 1: Wire DS18B20 temp sensor → confirm °C readings in Serial Monitor
- Week 1: Wire DS3231 RTC → confirm time read and alarm interrupt fires
- Week 2: Wire MicroSD card → confirm CSV file creates, appends, closes cleanly
- Week 2: Wire turbidity sensor (SEN0189) → confirm ADC value changes with water clarity
- Week 3: Wire RFM95W LoRa → run RadioHead ping-pong between 2 boards
- Week 3: Measure and record sleep current with multimeter (target <5 mA avg)
- Week 4: Document all wiring with labeled breadboard photo + schematic sketch
- Week 4: Push all wiring diagrams to GitHub /hardware folder
- RESEARCH HOMEWORK  ALL: Research coral reef water temperature thresholds for bleaching events. What temperature, sustained for how long, triggers bleaching? This informs our sampling rate decisions. Each person finds one primary source (journal article, NOAA report, etc.) and posts a 3-sentence summary to a shared doc.

### CS — Software Lead

- Week 1: Write and test DS18B20 read function (returns float tempC)
- Week 1: Write and test DS3231 RTC time-read and alarm-set functions
- Week 2: Write SD card logger — opens file, appends CSV row, closes
- Week 2: Write turbidity ADC read function with voltage divider math
- Week 3: Write LoRa TX function — formats JSON packet and transmits
- Week 3: Write LoRa RX function on Raspberry Pi side (Python + pyLoRa or equivalent)
- Week 4: Unit test each function independently; push all to GitHub /firmware folder
- Week 4: Write pseudocode for full duty-cycle state machine — share with ECE lead for review

### GE — Field & Mech Lead

- Week 1: Finalize hull geometry — choose cylinder-tapered design, define dimensions
- Week 1: Research and shortlist 2-3 buoy materials (HDPE, PVC, fiberglass, ABS)
- Week 2: Create CAD model or detailed hand sketch of hull cross-section
- Week 2: Design sensor mounting bracket — where does DS18B20 probe exit hull?
- Week 3: Research biofouling mitigation (copper mesh, antifouling paint, sensor wiper concepts)
- Week 3: Identify Hawaii deployment site GPS coordinates; document tidal range and depth
- Week 4: Draft mooring design — anchor type, line length, swivel, shackle specs
- Week 4: Push CAD files or annotated sketches to GitHub /mechanical folder

### Notes

- TEAM CHECK-IN  End of Phase 1 (end of June): Video call. ECE demos temp + RTC readings live over screen share. CS shares unit test results. GE presents hull CAD/sketch. Discuss: does CS firmware match ECE's GPIO table exactly? Any pin conflicts?

---

## PHASE 2

**Window:** Oct 19 – Nov 25, 2026 (5.5 weeks, Fall Quarter)

**Goal:** System Integration — Full Duty-Cycle Loop Running

### ECE — Hardware Lead

- Integrate all modules on shared SPI bus — verify no CS pin conflicts
- Test LoRa + SD simultaneously (they share MOSI/MISO/SCK — one CS HIGH at all times)
- Wire P-channel MOSFET sensor power gate (GPIO 26 controls sensor VCC rail)
- Wire battery voltage divider (100kΩ+100kΩ) to GPIO 35 ADC for monitoring
- Integrate MPPT charge controller + LiFePO₄ battery + buck converter on bench
- Measure actual sleep current at battery terminals with multimeter
- Run 48-hour continuous bench test — verify no crashes, SD fills correctly
- Document all power measurements: sleep current, active current, TX current peak
- RESEARCH HOMEWORK  ALL: Research LoRa performance over saltwater. Saltwater attenuates 915 MHz RF differently than air. Find at least one source on expected range reduction and post findings. ECE lead: look specifically at antenna height effect on range. CS lead: look at spreading factor tradeoffs (SF7 vs SF12) for range vs. data rate.

### CS — Software Lead

- Implement full duty-cycle state machine: Sleep → Wake → Sense → Log → TX → Sleep
- Implement battery voltage check — skip TX if below threshold (e.g. 11.8V)
- Implement RTC alarm to wake ESP32 every 30 minutes
- Implement sensor power gate: GPIO 26 HIGH before sleep, LOW after wake
- Test full loop end-to-end with ECE's integrated breadboard over video call
- Implement data recovery logic: if SD write fails, retry once then flag error in log
- Implement LoRa packet with timestamp, temp, turbidity, battery voltage, packet counter
- Push complete integrated firmware v0.1 to GitHub with README

### GE — Field & Mech Lead

- Source and order enclosure material (PVC pipe sections, Pelican case, or similar)
- Fabricate or 3D-print prototype hull section — at least one watertight test piece
- Design and fabricate cable entry points — test with IP68 cable glands
- Perform first waterproof test: submerge empty sealed enclosure 1m for 30 minutes
- Design sensor port — how does DS18B20 probe exit hull and remain sealed?
- Research and document Hawaii-specific reef-safe mooring hardware (no-drill methods)
- Sketch solar panel mounting bracket — angle, attachment, wave impact resistance
- Document buoyancy calculation: estimate total system weight vs. flotation volume needed

### Notes

- TEAM CHECK-IN  End of Phase 2 (end of July): 1-hour integration call. CS shares screen running full firmware loop live. ECE reports measured sleep current vs. predicted. GE shows waterproof test result (pass/fail photo). If any subsystem is behind, team decides whether to carry forward or resolve before Phase 3.

---

## PHASE 3

**Window:** Nov 30, 2026 – Jan 15, 2027 (spans winter break)

**Goal:** Enclosure Assembly · Waterproofing · First Submersion Test

### ECE — Hardware Lead

- Mount breadboard/PCB inside enclosure using nylon standoffs
- Route all sensor cables through IP68 cable glands — apply marine epoxy around glands
- Mount solar panel externally — solder weatherproof connections
- Perform full system waterproof test: sealed enclosure 1m submersion 30 min
- Run 1-week continuous data collection test in lab — verify SD card fills without error
- Verify LoRa range in air from sealed enclosure (confirm antenna not blocked by metal)
- Label all wires with heat shrink labels; photograph final internal wiring
- Write Enclosure Assembly Guide (step-by-step with photos) — push to GitHub
- RESEARCH HOMEWORK  ALL: Review IALA maritime buoy marking regulations for Special Marks (yellow light, recommended reflector). GE lead: confirm hull color and light requirements. ECE lead: research yellow LED navigation light modules available off-shelf. CS lead: research whether AIS transponder broadcast is required for our deployment size/location.

### CS — Software Lead

- Finalize firmware v1.0 — full duty-cycle, error handling, power management
- Implement State of Health (SoH) telemetry: include internal temp, battery %, uptime in packet
- Implement watchdog timer (WDT) — forces hard reboot if firmware freezes
- Write shore-side Python receiver script for Raspberry Pi (receive packet, parse JSON, append to CSV)
- Set up Raspberry Pi with LoRa HAT — confirm end-to-end packet reception
- Analyze 1-week lab data log — check for gaps, anomalies, timestamp drift
- Create simple data dashboard (even a Python matplotlib plot script counts)
- Tag GitHub repo as v1.0 with release notes

### GE — Field & Mech Lead

- Finalize hull fabrication — complete buoy body with sealed electronics bay
- Test buoyancy with electronics weight loaded inside — confirm correct waterline
- Fabricate mooring attachment point — stainless steel eyebolt or through-hull fitting
- Test storm resistance concept: pour water over buoy, simulate wave impact by hand
- Attach sacrificial zinc anode to metal hull components (galvanic corrosion protection)
- Install navigation light bracket on top of hull (yellow LED, required by IALA)
- Confirm solar panel is above waterline at all buoy orientations
- Ship or bring prototype hull to campus for fall integration

### Notes

- TEAM CHECK-IN  Start of Fall Quarter: In-person or video integration session. Physically connect ECE electronics into GE enclosure for the first time. Run firmware in assembled buoy. Document fit issues. Create a punch list of modifications needed before field test.

---

## PHASE 4

**Window:** Jan 18 – Feb 26, 2027 (6 weeks, Winter Quarter)

**Goal:** Field Prototype Deployment · Iteration · Range Testing

### ECE — Hardware Lead

- Deploy prototype in campus pond or pool for 2-week field test
- Monitor LoRa reception at shore station daily — log packet loss rate
- Measure real solar charging current on sunny and overcast days
- Iterate antenna height/placement based on range test results
- Solder final semi-permanent prototype PCB (optional: KiCad → JLCPCB at $5/5pcs)
- Prepare spare components kit: extra sensors, ESP32, RFM95W, SD cards
- Test sensor readings in real water — compare DS18B20 to known thermometer
- Document all issues discovered in field; update GitHub issues tracker
- RESEARCH HOMEWORK  ALL: Research coral reef monitoring networks that already exist (NOAA CoRIS, CRAMP, Allen Coral Atlas). How does their data collection compare to ours? What metrics do they track that we should consider adding? Each member picks one network and presents a 5-minute summary at the November check-in.

### CS — Software Lead

- Analyze 2-week field data set — identify any anomalies or sensor drift
- Tune duty-cycle interval based on real power consumption data from ECE lead
- Implement adaptive transmission: reduce TX frequency when battery below 20%
- Improve shore-side dashboard — add live plot of temperature and turbidity over time
- Test firmware OTA update concept (optional stretch goal for future scalability)
- Document firmware architecture with block diagram — push to GitHub /docs folder
- Write data format specification document for future multi-buoy expansion
- Prepare firmware v1.1 release with all field-test improvements

### GE — Field & Mech Lead

- Observe field test — note any buoy instability, tilt, or drag issues
- Measure actual waterline height vs. prediction — adjust ballast if needed
- Inspect enclosure after 2-week deployment: any moisture intrusion? any biofouling?
- Test and document cable gland integrity after extended submersion
- Refine mooring design based on observed buoy behavior in water
- Prepare Hawaii deployment plan: logistics, equipment, shipping, permissions
- Contact Hawaii permitting authority or reef organization for deployment approval
- Begin any regulatory paperwork needed for ocean deployment (US Coast Guard, DLNR)

### Notes

- TEAM CHECK-IN  Mid-October and end of November: Two check-ins this phase. First: review 1-week field data together. Second: review full 2-week results and finalize Hawaii prep plan. Assign Hawaii shipping responsibilities.

---

## PHASE 5

**Window:** Mar 1 – Mar 19, 2027 (3 weeks, before spring break)

**Goal:** Hawaii Deployment Prep · Final Hardware Sign-Off · Ship

### ECE — Hardware Lead

- Final waterproofing re-verification: pressure test at 5m water equivalent
- Verify all connections are soldered or crimped (no breadboard in final unit)
- Apply conformal coating to PCB for humidity and salt spray protection
- Fully charge LiFePO₄ battery before shipping
- Pack spare parts kit: 2x DS18B20, 1x ESP32, 1x RFM95W, 2x SD cards, fuses, wire
- Write field service guide: how to replace sensors without opening main enclosure
- Write hardware troubleshooting guide: symptom → likely cause → fix
- Ship or carry hardware to Hawaii by early January
- RESEARCH HOMEWORK  ALL: Review coral bleaching data for your deployment region in Hawaii. What are the historically recorded temperature peaks? Compare to our sensor's ±0.5°C accuracy. Is our sampling rate (every 30 min) fine enough to catch bleaching-risk events? Document findings to include in project report.

### CS — Software Lead

- Final firmware v1.2: all bugs from field test resolved, WDT confirmed working
- Write firmware flashing guide (step-by-step for non-ECE person to reflash ESP32)
- Ensure firmware logs startup errors to SD so remote debugging is possible
- Set up Raspberry Pi shore station at Hawaii location remotely with GE lead
- Write data retrieval SOP: how to extract SD card data and upload to shared Google Drive
- Prepare simple real-time data viewer accessible via web browser (optional stretch)
- Archive all code, libraries, and config in GitHub with deployment tag v1.2-hawaii
- Document known limitations and future improvement backlog

### GE — Field & Mech Lead

- Confirm Hawaii deployment site permissions are secured in writing
- Identify and mark GPS coordinates of planned deployment location
- Pre-rig mooring hardware on shore — test anchor, line, swivel, shackle assembly
- Photograph and document deployment site: reef proximity, currents, access point
- Plan deployment day logistics: boat/kayak access, dive gear if needed, safety plan
- Prepare data retrieval schedule: how often to check buoy, swap SD card, visual inspect
- Identify local contact (researcher, diver, ranger) who can check on buoy if needed
- Write Hawaii Field Operations Manual — share with all team members

### Notes

- TEAM CHECK-IN  Start of January 2027: Deployment readiness review. Run through Hawaii Field Operations Manual together. Confirm shore station is set up and receiving. Everyone knows the contingency plan if something fails on deployment day.

---

## PHASE 6

**Window:** Mar 22 – May 28, 2027 (~10 weeks live deployment)

**Goal:** Hawaii Live Deployment · Data Collection · Remote Monitoring

### ECE — Hardware Lead

- Provide remote hardware support to GE lead during deployment
- Monitor battery voltage telemetry daily — flag if below 20%
- If hardware issue arises: diagnose remotely using SD log + SoH telemetry data
- Ship replacement components overnight if critical failure occurs
- Document all hardware performance metrics from live deployment data
- Begin writing hardware design section of final project report
- Research KiCad PCB design for multi-unit v2.0 (future scope)
- RESEARCH HOMEWORK  ALL: Begin drafting the project's contribution to literature. How does S.C.O.U.T. compare to existing reef monitoring buoys in cost, power consumption, and data quality? Identify 3 papers on low-cost marine IoT sensing to cite in your final report. Each member drafts their section by Spring Break.

### CS — Software Lead

- Monitor live data stream from shore station daily
- Run data quality checks: flag missing packets, timestamp gaps, sensor anomalies
- Produce weekly data summary plots — share in team group chat
- Implement any critical firmware fixes remotely (reflash ESP32 via GE lead on-site)
- Begin writing software design section of final project report
- Start designing cloud upload pipeline for multi-buoy v2.0 (future scope)
- Archive all collected data to GitHub /data folder with metadata

### GE — Field & Mech Lead

- DEPLOY buoy at confirmed Hawaii reef site
- Install and anchor shore-side Raspberry Pi base station
- Confirm LoRa link is live between buoy and base station on deployment day
- Perform weekly visual inspection of buoy (biofouling check, light check, position check)
- Swap SD card monthly and upload data to shared Google Drive
- Document any physical issues: barnacle growth, antenna tilt, anchor movement
- Take underwater photos of sensor faces monthly — document biofouling rate
- Write field observations log — post weekly update to shared team doc

### Notes

- TEAM CHECK-IN  Monthly video calls (January, February, March). Review data together. Assess reef health indicators. Confirm buoy is operating normally. By March: begin consolidating findings for senior design final presentation.

---
