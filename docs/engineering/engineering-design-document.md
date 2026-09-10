# S.C.O.U.T. Engineering Design Document (v0.3)

> **Summary** — The authoritative technical baseline: system requirements, mechanical/electrical/firmware architecture, component selection, power and energy budget, verification plan, and full BOM.
>
> **Source document** — `JR Energy Budget.docx`
>
> **Note** — the source file was named `JR Energy Budget.docx`, but its contents are the complete engineering design document. Renamed here to reflect actual content.

> ⚠️ **Reconciliation status (2026-09-09).** The **mechanical architecture (§4)** and its
> mechanical touchpoints in §§1–3, 18, 19, 21, 22 were reconciled against the detailed design
> and analysis work of 2026-08-14 → 2026-09-09. The **electrical, power, sensor, audio,
> communications, firmware, storage, and energy-budget sections (§§5–17, 20) have not yet had
> the same pass** and still reflect the earlier baseline — several decisions since (FCC-compliant
> LoRa config, daily packet size, on-board turbidity units, Rev A battery chemistry
> [ADR-0006](../decisions/0006-rev-a-battery-chemistry.md), V1 sensing payload
> [ADR-0005](../decisions/0005-v1-sensing-payload.md)) are captured in the
> [Knowledge Hub](../hub/README.md) but not yet folded in here. Owners: ECE (Isabella) and CSEN
> (David).

> ⚠️ **Platform note (2026-08-14).** This document describes the **ESP32-C3 + SX1262 custom
> PCB**, which — per [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) — is now the
> project's **future production target**, not the platform being built for the capstone. The
> **confirmed build platform is the Adafruit Feather M0 + RFM95** (see
> [`hardware/README.md`](../../hardware/README.md) and [`firmware/README.md`](../../firmware/README.md)).
> Consequently the ESP32-C3/SX1262 references throughout, and the power/energy analysis in
> §15–17, apply to the production target; a Feather-specific power budget will be produced
> empirically during Phase 1–4 testing. Sections have **not** been rewritten so this remains
> the reference design for the eventual PCB.

---

## 1. Executive Summary

### Project Overview

S.C.O.U.T. (Santa Clara Oceanic Utilities Transmitter) is a low-cost, long-duration environmental monitoring buoy intended for deployment on shallow coral reefs. The system is designed to autonomously collect environmental data while minimizing power consumption, maintenance requirements, hardware complexity, and overall cost.

S.C.O.U.T. operates as a self-contained sensing platform powered by a rechargeable LiFePO₄ battery and solar energy harvesting system. The buoy periodically measures environmental conditions, records underwater acoustic data, stores all information locally, and transmits summarized daily data to a nearby shore station using LoRa radio communication.

The system is intended to remain deployed for extended periods with minimal human interaction while maintaining reliable operation in a marine environment.

### Primary Objectives

- Develop an inexpensive reef-monitoring platform.

- Operate autonomously for long-duration deployments.

- Minimize daily energy consumption.

- Minimize maintenance requirements.

- Maintain a modular, serviceable design.

- Enable future expansion without major architectural changes.

### Functional Overview

S.C.O.U.T. performs four primary tasks:

1.  Measure water temperature.

2.  Measure water turbidity.

3.  Record underwater acoustic data.

4.  Transmit summarized daily data.

All raw data is stored locally while summarized environmental data is transmitted once per day.

### Design Philosophy

- Simplicity over unnecessary complexity.

- Minimize total component count.

- Minimize standby power consumption.

- Power hardware only when required.

- Maintain modular hardware architecture.

- Use commercially available components whenever practical.

- Clearly separate engineering assumptions from manufacturer specifications.

### Current Design Status

- Mechanical architecture **detailed and analyzed** — buoy architecture confirmed by design
  panel review; flotation, mooring load path, sealing method, materials, and buoyancy/freeboard
  model all resolved. Remaining items (housing final dimensions, stability analysis, impact
  testing, v5 FEA re-check, mooring hardware detailing) are tracked — see [§4.13](#413-open-mechanical-items).

- Electrical architecture baseline complete; Rev A bring-up in progress.

- Firmware architecture complete (SAMD21 / Feather M0 build target per
  [ADR-0001](../decisions/0001-mcu-and-radio-selection.md)).

- Hardware selection complete for the capstone build; production-PCB parts documented as the
  future target.

- Major assumptions documented.

- Daily power budget in progress; a Feather-specific budget will be produced empirically during
  Phase 1–4 testing.

- Battery and solar sizing pending final verified power budget.

## 2. System Requirements

### Functional Requirements

The S.C.O.U.T. buoy shall:

- Measure water temperature using one sensor (per [ADR-0003](../decisions/0003-single-point-sensing.md); 2 additional units held as field spares).

- Measure water turbidity using one sensor (per ADR-0003; 2 additional units held as field spares).

- Record underwater acoustic data using one hydrophone.

- Store all collected information locally.

- Transmit summarized sensor data once per day via LoRa.

- Operate autonomously.

- Recover automatically after temporary power interruption.

- Enter ultra-low-power sleep whenever inactive.

### Performance Requirements

#### Temperature

- One sensor deployed (+2 spares — ADR-0003)

- Six measurements/day

- Waterproof

#### Turbidity

- One sensor deployed (+2 spares — ADR-0003)

- Six measurements/day

- Analog optical sensing

#### Audio

- One hydrophone

- Mono

- 16-bit PCM

- 16 kHz

- Three 60-second recordings/day

#### Communications

- LoRa

- 915 MHz

- +14 dBm

- 125 kHz bandwidth

- SF7

- Coding Rate 4/5

- One transmission/day

### Storage Requirements

- Store all raw audio.

- Store all environmental measurements.

- Approximately 30-day onboard retention.

- Firmware-managed storage.

### Power Requirements

- LiFePO₄ battery

- Solar charging

- Ultra-low standby power

- Switch high-power sensors off between measurements

### Reliability Requirements

- Autonomous operation

- Resume after reset

- Protect stored data

- Minimize failure points

### Design Constraints

- Low cost

- Marine environment — 5 m water-equivalent pressure target, saltwater, biofouling, UV, corrosion

- Buoy outer diameter 18 in; electronics-housing internal envelope pending the final component
  list ([SCO-70](https://linear.app/scout1/issue/SCO-70) → [SCO-49](https://linear.app/scout1/issue/SCO-49)),
  designed around a ~Ø100 mm reference

- In-house fused-deposition 3D printing only (no outsourced molding/CNC)

- Positive, fault-tolerant buoyancy with reasonable freeboard

- Low average power

- Modular, field-serviceable construction

Full mechanical performance targets and constraints are in [§4](#4-mechanical-architecture) and
[§19](#19-design-constraints).

## 3. Overall System Architecture

### System Description

S.C.O.U.T. is organized into six major subsystems:

1.  Mechanical Structure

2.  Power System

3.  Sensor System

4.  Processing System

5.  Storage System

6.  Communications System

Each subsystem operates independently but is coordinated by the ESP32-C3 microcontroller.

### High-Level Architecture

Solar Panel

│

BQ25570 MPPT

│

LiFePO₄ Battery

│

┌──────────────┴──────────────┐

│ │

TPS62840 TPS61299

3.3 V Rail 5 V Rail

│ │

│ TPS22916 Load Switches

│ │

│ ┌───────────┴───────────┐

│ │ │

ESP32-C3 PCM1808 ADC SEN0189 ×3

│ │

│ Aquarian H2dM

│

┌────────┼────────┬──────────┐

│ │ │ │

SX1262 W25Q02JV DS18B20×3 Other GPIO

LoRa Flash

### Subsystem Responsibilities

#### Mechanical

- Supports all electronics in a sealed, serviceable chassis.

- Provides positive, fault-tolerant buoyancy (six foam-filled flotation wedges).

- Supports the solar panel mast.

- Carries the mooring load through a through-bolted 316 pad-eye.

- Positions the single sensor pod beneath the buoy (single-point sensing, ADR-0003).

#### Power

- Harvest solar energy.

- Charge battery.

- Generate regulated voltages.

- Switch high-power loads on demand.

#### Sensors

Collect:

- Water temperature

- Water turbidity

- Underwater acoustic data

#### Processing

The ESP32-C3 performs:

- Sensor scheduling

- Data acquisition

- Audio streaming

- Flash management

- LoRa communications

- Power management

- Fault recovery

#### Storage

Stores:

- Raw hydrophone recordings

- Temperature history

- Turbidity history

- Device status

- Configuration information

#### Communications

The SX1262 LoRa transceiver transmits one summarized packet per day to a shore receiver.

Raw audio is not transmitted.

### Data Flow

Sensors

│

▼

ESP32-C3

│

├── Process measurements

├── Store raw data

└── Generate daily summary

│

▼

SX1262 LoRa

│

▼

Shore Station

## 4. Mechanical Architecture

> **Status (2026-09-09).** This section was reconciled against the detailed mechanical design
> work of 2026-08-14 → 2026-09-09. The authoritative working documents are the
> [Knowledge Hub](../hub/README.md) and [`docs/engineering/buoy-structural/`](buoy-structural/);
> this section is the summary and points to them for full derivations, drawings, and test
> records. Provisional items and their blocking issues are listed in
> [§4.13](#413-open-mechanical-items).

### 4.1 Design goals and philosophy

The mechanical system:

- Protects the electronics and battery from seawater at the deployment pressure (5 m water
  equivalent target).
- Provides positive, fault-tolerant buoyancy with reasonable freeboard.
- Survives long-duration nearshore deployment — wave loading, corrosion, biofouling, UV, and
  incidental impact (grounding, handling, boat strike at the waterline).
- Keeps electrical and firmware revisions independent of the enclosure.
- Is **manufacturable in-house by fused-deposition 3D printing** — no outsourced molding or CNC,
  which is not cost-effective at capstone quantities.
- Is **modular and field-serviceable** — individual flotation wedges, the sensor pod, and the
  lid can each be replaced without disturbing the rest.
- Minimizes custom machining, part count, mass, and drag; uses standard fasteners and O-rings.

### 4.2 Buoy architecture overview

The buoy is a **central sealed chassis cylinder with six 60° flotation wedges bolted around it**,
forming an 18-inch-diameter disc. A static face-sealed lid closes the chassis at the top and
carries the solar-panel mast; a printed sensor stem and sensor pod hang below the chassis; the
mooring attaches through the chassis bottom.

This architecture was confirmed by a simulated multidisciplinary design panel review
(2026-08-21, 12 reviewer personas): **"proceed to detailed design, no redesign"** (8.0/10). The
review is committed at
[`reviews/buoy-preliminary-design-panel-review-2026-08.md`](reviews/buoy-preliminary-design-panel-review-2026-08.md)
and generated 14 tracked design actions.

| Element | Summary | Detail |
|---|---|---|
| Flotation | 6 foam-filled 60° wedges, bolted to the chassis, epoxied into a closed ring | [§4.3](#43-flotation-system) |
| Buoyancy / freeboard | ~7.6 kg as-deployed, ~3.8:1 reserve margin, ~2.5 in draft | [§4.4](#44-buoyancy-and-freeboard) |
| Electronics chassis | Sealed PETG cylinder, Ø5.75 in × 8.5 in, static face-seal lid | [§4.5](#45-electronics-chassis-and-lid) |
| Sensor mount | Printed stem + sensor pod below the hull; single-point sensing (ADR-0003) | [§4.6](#46-sensor-mount-stem-and-pod) |
| Mooring | Reef-safe mushroom anchor + twisted nylon line; through-bolted 316 pad-eye on the buoy | [§4.7](#47-mooring-attachment) |
| Structural analysis | LC1–LC9 load framework; FEA passes every case (v4 geometry) | [§4.8](#48-structural-analysis) |
| Waterproofing | Static face seals, fasteners outside the O-ring boundary, off-the-shelf O-rings | [§4.9](#49-waterproofing-strategy) |
| Materials / manufacturing | PETG build (ASA for scale-up), in-house FDM only | [§4.10](#410-materials-and-manufacturing) |
| Biofouling / coatings | Sea Hawk Smart Solution (copper-free) antifouling | [§4.11](#411-biofouling-and-coatings) |

### 4.3 Flotation system

**Design family (chosen 2026-08-17):** a bolted wedge assembly — heat-set brass inserts in the
chassis, M4 stainless bolts, no snap/keyhole locking — selected over a snap-keyhole "Master V3"
concept and a separate "Outer Octagon" shell. Full iteration history (CNC foam ring →
surfboard-style composite → single-print sections → snap-fit → bolted wedge, v1–v9 preserved as
history) is in
[`mechanical/cad/floatation/README.md`](../../mechanical/cad/floatation/README.md) and
[`design-notes.md`](../hub/design-notes.md).

**Geometry (v5, 2026-09-09):**

| Parameter | Value |
|---|---|
| Buoy outer diameter | 18.000 in (R9.000 in) |
| Flotation wedge height | 5.500 in (reduced from 8.000, [SCO-110](https://linear.app/scout1/issue/SCO-110)) |
| Chassis height | 8.500 in (reduced from 11.000 by the same amount, 1 in stub above the wedge top) |
| Wedge count / sector | 6 × exactly 60° |
| Wedge shell walls | outer curved 0.095 in, radial sides + internal web 0.063 in (fully-dense perimeter shells, no infill core) |

**Foam fill.** Each wedge module is filled after assembly with **US Composites #0204 2 lb/ft³
closed-cell rigid polyurethane pour foam** ([SCO-76](https://linear.app/scout1/issue/SCO-76)).
The foam does three jobs at once: buoyancy, structure, and waterproofing-by-redundancy — a
punctured wedge shell does not flood, and even with every printed shell gone the six foam cores
alone provide ~216 N of net lift (≈2.9× the whole-buoy nominal weight).

**Structural concept.** The six wedges are epoxied at their radial seams and foam-poured *after*
being bolted into the ring, forming an **epoxied closed monocoque ring**. In this configuration
each radial wall sees no through-thickness service pressure, the bonded 3.2 mm seam acts as a
compression-ring path and a stiff composite stringer (borrowing the surfboard-stringer
principle), and foam-fill pressure is reacted by the bonded neighbour. **The epoxied ring is the
primary structure; the foam is required backing** against local and asymmetric loads — a single
bare panel is marginal on external-pressure buckling, so foam must be in place before any
submersion until an assembly-level ring-buckling FEA confirms the bonded ring. A closed-form
check (2026-09-07,
[`mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md`](../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md))
accepted the wall thicknesses: outer wall SF 7.3 on yield under the 50.3 kPa (5 m) hydrostatic
case.

**Internal bracing web.** A perforated web spans between the wedge's bolt flanges. It began as a
design-for-manufacturing fix — the thin open side walls flexed during printing and broke
first-layer bed adhesion — and also does structural work (halves every wall panel's free span,
adds a shear web). In v5 the web's lightening holes additionally let it flex to seat around the
chassis and give service access without a rigid interference fit.

**Field replaceability.** Each wedge can be swapped on-site without disturbing the others.

### 4.4 Buoyancy and freeboard

The whole-buoy mass, displacement, and freeboard model — full worked derivation, sensitivity
sweep, and failure cases — is
[`buoy-mass-displacement-and-freeboard-model.md`](buoy-structural/buoy-mass-displacement-and-freeboard-model.md),
built 2026-08-29 and re-solved for the v5 geometry 2026-09-09 with an independent re-derivation.

| Quantity | v5 nominal | Note |
|---|---|---|
| As-deployed mass | ~7.59 kg (6.25 low / 9.69 high) | Tier III (battery, solar, stem, pod, mooring hardware) still estimated pending [SCO-70](https://linear.app/scout1/issue/SCO-70) |
| Max buoyant force (fully submerged) | ~286 N | |
| Net reserve buoyancy | ~212 N (≈21.6 kgf), **~3.84:1 margin** | v4 was 4.75:1; the SCO-110 resize traded margin for ~0.8 kg less mass and a lower solar deck |
| Nominal draft | ~2.50 in (63 mm) | |
| Freeboard to the wedge top | ~5.0 in (of a 5.5-in float section) | ~7.0 in to the top of the chassis lid |
| Float section wetted | ~9% | The buoy is **substantially over-floated** |

**Failure cases** (both stay afloat): a fully flooded chassis rises to ~3.1 in draft / ~4.4 in
freeboard; losing one entire wedge module rises to ~2.6 in draft but introduces an asymmetric
60° flotation gap and therefore a static list — quantifying that heel is stability work
([§4.8](#48-structural-analysis), [SCO-80](https://linear.app/scout1/issue/SCO-80)).

The model is **provisional** on two inputs: the real v5 print weights (shell masses are
currently geometric estimates) and the final Tier III component masses from
[SCO-70](https://linear.app/scout1/issue/SCO-70).

### 4.5 Electronics chassis and lid

A sealed PETG cylinder, **Ø5.750 in OD × 8.500 in tall** (v5), houses the main PCB, battery,
charge/regulation board, LoRa antenna, flash, internal temp/humidity sensor, and wiring. The
final internal envelope and wall thickness are **not yet fixed** — they depend on Isabella's
final electronics component list and dimensions ([SCO-70](https://linear.app/scout1/issue/SCO-70)),
which gates [SCO-49](https://linear.app/scout1/issue/SCO-49). A packing analysis
([`electronics-housing-packing-budget.md`](electronics-housing-packing-budget.md)) against the
real Rev A component sizes recommends a ~Ø100 mm × 110–130 mm internal envelope, which fits the
historical ~4-inch PVC reference form factor with margin. (The earlier "4-inch Schedule 40 PVC"
language in this document is a reference form factor only, not a spec —
[SCO-46](https://linear.app/scout1/issue/SCO-46).)

**Lid — static face seal.** The chassis closes with a **clamp + lid pair carrying a static face
seal**, declared the electronics-housing baseline 2026-09-02 (superseding an end-cap-into-cylinder
scheme). Key features:

- All 6 fasteners sit **outside the O-ring boundary** — Ø104.14 mm bolt circle vs. a Ø91.69 mm
  groove OD — so no fastener pierces the seal (closes a design-panel-review finding on
  [SCO-68](https://linear.app/scout1/issue/SCO-68)).
- Groove sized to a standard **AS568-043** ring: 22.9% squeeze, 75% gland fill.
- Seal faces bottom out land-to-land, so squeeze is set by geometry, not bolt torque; the flange
  is stiffened against bolt-to-bolt bowing.
- **Seal elastomer: silicone** (seawater + UV service, low compression set).
- A cable gland in the lid passes the sensor-string / antenna cable run.
- The lid carries an engraved identification label (four lines).

**Provisional:** the first clamp print (2026-09-02) showed slight O-ring tolerance trouble —
reprint pending ([SCO-105](https://linear.app/scout1/issue/SCO-105)); the AS568-043 free-diameter
fit against the groove ID is unverified ([SCO-106](https://linear.app/scout1/issue/SCO-106)); no
submersion test has been run to this design ([SCO-108](https://linear.app/scout1/issue/SCO-108)).

### 4.6 Sensor mount (stem and pod)

Per [ADR-0003](../decisions/0003-single-point-sensing.md), all sensing is at a **single point
beneath the buoy**, not a multi-depth string:

- One DS18B20 temperature sensor (pre-waterproofed; +2 field spares)
- One SEN0189 turbidity sensor (+2 field spares)
- One Aquarian hydrophone (pre-waterproofed)

A printed PETG **stem** (hex-socket top connector, perforated/free-flooding lower body) hangs
below the chassis; a **sensor pod** at its lower end carries the sensors. The pod splits into a
**dry chamber** (the turbidity adapter board / electronics) and a **flood chamber** (the
turbidity probe itself — light-blocked but water-permeable), epoxied watertight between them,
because the turbidity probe — unlike the thermometer and hydrophone — is not itself
waterproofed. The pod uses an **AS568-137** face-seal groove and a 3-bolt pattern.

The pod design is deliberately built to *enable* future multi-depth scaling (design-once,
cheap-to-repeat in-house additive) without activating it now — see
[`sensor-string-architecture.md`](sensor-string-architecture.md). The flood chamber is currently
being re-specced around Isabella's actual Rev A turbidity sensor rather than the generic SEN0189
assumption ([SCO-91](https://linear.app/scout1/issue/SCO-91)).

### 4.7 Mooring attachment

**Approach ([ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md)).** Reef-safe by
principle: at **marked sites** (existing pile or mooring) the buoy connects directly by line; at
**unmarked sites** a single **mushroom anchor** is sited *adjacent to, never on,* coral, with
enough swing clearance that the line cannot drag or agitate the reef.

**Line spec (2026-09-08):** 3-strand **twisted nylon, 3/8 in (9.5 mm)** — twisted construction
so a crossing propeller **fouls rather than cuts** it (a cut line loses the buoy adrift; a
fouled prop just stops the boat), nylon for catenary shock compliance. Scope length is a routine
sizing item still open on [SCO-17](https://linear.app/scout1/issue/SCO-17).

**Buoy attachment point.** A **through-bolted 316 stainless pad-eye** at the chassis bottom,
chosen from a six-option trade study (rigid U-bolt + backing plate, clamped cable loop, bonded
flanged eye, folding pad-eye, tapped block + eye bolt, transverse cross-pin clevis). The pad-eye
spreads load over 4 points (vs. the U-bolt's 2), is fully external — inspectable and
field-replaceable — and uses standard hardware. A **cross-pin clevis is kept as the fallback**
(printed plastic takes bearing and shear far better than pull-out). Shock compliance lives in
the mooring line (snubber / catenary), **not** the buoy penetration. The design panel review
rated this load path the project's single most consequential single-point failure; the specific
part, sizing, threaded-insert scheme, chassis-bottom boss, and proof test remain open on
[SCO-69](https://linear.app/scout1/issue/SCO-69).

The sensor string / pod is attached to the mooring so sensor positions stay repeatable.

### 4.8 Structural analysis

**Load framework.** Environmental loads are derived in
[`structural-load-framework.md`](buoy-structural/structural-load-framework.md) and
[`force-budget.md`](buoy-structural/force-budget.md) as nine load cases (LC1–LC9) using the
Morison equation, linear wave theory, and DNV-RP-C205 / USACE CEM conventions, each value
provenance-tagged. The **environmental design set was signed off 2026-09-08**
([SCO-73](https://linear.app/scout1/issue/SCO-73)): water depth `d` 2.0 m, wave height `H`
1.2 m, wave period `T_w` 6 s, current `U_c` 0.8 m/s, wind `U_wind` 22 m/s (survival condition).
Governing loads: **LC9 mooring snap ≈ 810 N**, LC6 combined resultant 586 N, LC8 hydrostatic
50.3 kPa (5 m).

**FEA (Autodesk Fusion, custom PETG material profile).** LC2–LC9 plus a service case were run
2026-08-29 to 2026-08-30 — **the buoy structure passes every case** (min SF 10–1450); results
tracker at [`mechanical/test/fea-mooring-load-cases.md`](../../mechanical/test/fea-mooring-load-cases.md).
LC6 and LC9 show local min SF 1.5–1.7 at the contact interface of a generic-steel stand-in ring,
examined and confirmed as a mesh/contact singularity artifact, not the buoy PETG.

**Analyses still owed** (all tracked): assembly-level ring-buckling FEA of the epoxied 6-wedge
ring; impact / boat-strike survivability, FEA + bench ([SCO-71](https://linear.app/scout1/issue/SCO-71)
— the design's stated validation target, since the first side-load study returned SF 25.4 and
was judged over-engineered for the cost target); **CG / CB / metacentric height / righting-arm
stability** ([SCO-80](https://linear.app/scout1/issue/SCO-80)); a dedicated re-run of the final
316 pad-eye interface with LC7's 70 N·m moment; and an **FEA re-check of the v5 geometry** (the
2026-08-29 runs were on v4 — buoy OD is unchanged and draft moved only ~0.2 in, so the loads are
approximately still valid, but the resize and the lower solar deck need a re-run before
deployment).

### 4.9 Waterproofing strategy

- **Static face seals** on both the electronics chassis lid and the sensor pod — fasteners
  outside the O-ring boundary, seal faces bottoming land-to-land ([§4.5](#45-electronics-chassis-and-lid)).
- **Off-the-shelf standard AS568 O-rings**, not 3D-printed or batch-cast — printed parts are
  porous along layer lines, a waterproofing-critical risk at the 5 m pressure target
  ([SCO-55](https://linear.app/scout1/issue/SCO-55)). Provisional; revisit if standard sizes do
  not fit.
- **Cable glands** for every conductor leaving a sealed volume; epoxied pod modules.
- **Foam-fill redundancy** on the flotation wedges.
- No electronics are intentionally exposed to seawater.

**First bench evidence (2026-08-24,
[`waterproofing-submersion-test-2026-08-24.md`](../../mechanical/test/waterproofing-submersion-test-2026-08-24.md)):**
a PLA sensor housing with a TPU-printed O-ring passed ~30 hr submerged bone-dry; a low-quality
PETG print of the same part and the electronics housing (the tested article had no bolt-joint
sealing washers, contrary to spec) both failed. Reprint and re-test are pending
([SCO-105](https://linear.app/scout1/issue/SCO-105), [SCO-108](https://linear.app/scout1/issue/SCO-108)).

### 4.10 Materials and manufacturing

- **Build material: PETG** for the wedges, chassis, and housings. **ASA is documented as the
  production scale-up material** for UV/marine durability; the ABS / SLA / nylon comparison was
  dropped ([SCO-64](https://linear.app/scout1/issue/SCO-64)).
- **In-house fused-deposition printing only.** Outsourced molding / CNC is not cost-effective at
  capstone quantities. Fit is validated with PLA scale prints (1/4, 1/2, 1:1) before committing
  full-scale PETG.
- **Print structure** ([`print-settings.md`](buoy-structural/print-settings.md)): wall count
  dominates infill for FDM structural strength. Chassis: 6 walls / 25–30% gyroid generally,
  8–10+ walls / 100% solid locally at the mooring boss. Wedge family: v5 thin-wall spec per
  [§4.3](#43-flotation-system). Heat-set-insert pull-out depends on solid perimeters around the
  hole, not bulk infill. Provisional pending the FEA sign-off on [SCO-73](https://linear.app/scout1/issue/SCO-73).
- **Fasteners:** M4 316 stainless bolts into brass heat-set inserts. The corrosion strategy —
  stainless hardware plus sealed bolt heads — is open on [SCO-92](https://linear.app/scout1/issue/SCO-92).
- **Flotation foam:** US Composites #0204 2 lb/ft³ closed-cell rigid PU pour foam.
- **Adhesive:** marine epoxy for the wedge radial seams, wedge-cap bonds, and insert potting.

### 4.11 Biofouling and coatings

**Sea Hawk Smart Solution antifouling coating** (copper-free, Econea biocide), chosen over
copper-based products — copper is toxic to coral at low concentration and conflicts with the
reef-safe principle in [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) — and
over a pricier copper-free alternative
([`biofouling-antifouling-coatings.md`](../research/biofouling-antifouling-coatings.md),
[SCO-15](https://linear.app/scout1/issue/SCO-15)). Re-ratified 2026-09-08 over a
"let it grow naturally" alternative. Coating adhesion and UV/water durability validation is open
on [SCO-78](https://linear.app/scout1/issue/SCO-78).

### 4.12 Interfaces

| Interface | Provisions |
|---|---|
| Mechanical → Electrical | PCB mounting inside the chassis, battery restraint, internal cable routing, lid cable gland, connector access through the serviceable lid |
| Mechanical → Sensor system | Stem-to-chassis connection, pod mounting on the stem, hydrophone mounting, flood/dry chamber sealing, strain relief on the sensor cable |
| Mechanical → Power system | Solar-panel mast on the chassis lid, cable protection down the stem/chassis, battery restraint inside the chassis |
| Mechanical → Mooring | Through-bolted 316 pad-eye at the chassis bottom; sensor string tied to the mooring |

Electrical and firmware revisions are intended to occur with minimal change to the enclosure.

### 4.13 Open mechanical items

| Item | Blocked on / tracked by |
|---|---|
| Electronics housing final internal envelope, wall thickness, gland count | [SCO-70](https://linear.app/scout1/issue/SCO-70) → [SCO-49](https://linear.app/scout1/issue/SCO-49) |
| Real v5 print weights (wedge, chassis) — model currently on geometric estimates | [SCO-110](https://linear.app/scout1/issue/SCO-110) re-slice |
| v5 chassis + cap STEP re-exports and a dimensioned wedge PDF | [SCO-110](https://linear.app/scout1/issue/SCO-110) |
| Assembly-level ring-buckling FEA (epoxied 6-wedge ring) | [SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| Impact / boat-strike survivability (FEA + bench) | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Stability — CG / CB / GM / righting, one-wedge-loss list angle | [SCO-80](https://linear.app/scout1/issue/SCO-80) |
| v5-geometry FEA re-check | [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| Mooring pad-eye — part, sizing, boss, proof test | [SCO-69](https://linear.app/scout1/issue/SCO-69) |
| Corrosion strategy — sealed bolt heads | [SCO-92](https://linear.app/scout1/issue/SCO-92) |
| Electronics-housing clamp reprint + submersion re-test | [SCO-105](https://linear.app/scout1/issue/SCO-105), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| Turbidity flood-chamber re-spec to the real Rev A sensor | [SCO-91](https://linear.app/scout1/issue/SCO-91) |
| Coating adhesion / UV durability validation | [SCO-78](https://linear.app/scout1/issue/SCO-78) |
| Cap cable-gland revision (routing, OD, sealing) | [SCO-53](https://linear.app/scout1/issue/SCO-53) |
| Chassis top section — sealing + service-access port | [SCO-68](https://linear.app/scout1/issue/SCO-68) |
| Stem + solar-mount refinement into current iterations | [SCO-54](https://linear.app/scout1/issue/SCO-54) |

## 5. Electrical Architecture

### Purpose

The electrical architecture provides regulated power distribution, sensor interfacing, onboard processing, local data storage, and daily wireless communication while minimizing average power consumption.

### System Philosophy

The electrical system follows four core principles:

- Only power hardware when required.

- Minimize always-on current.

- Use the fewest active components possible.

- Keep the architecture modular and serviceable.

### Power Distribution

#### Primary Energy Source

- Solar Panel

- LiFePO₄ Rechargeable Battery

#### Energy Harvesting

- **TI BQ25570**

  - Maximum Power Point Tracking (MPPT)

  - Battery charging

  - Battery protection

- 

### Voltage Rails

#### 3.3 V Rail

Generated by:

- **TI TPS62840 Buck Converter**

Supplies:

- ESP32-C3

- SX1262 LoRa Radio

- Winbond W25Q02JV Flash

- DS18B20 Temperature Sensors

- Logic circuits

- Digital interfaces

The 3.3 V rail remains active continuously.

#### 5 V Rail

Generated by:

- **TI TPS61299 Boost Converter**

Supplies:

- PCM1808 Analog Supply

- SEN0189 Turbidity Sensors

The 5 V rail is normally disabled and only enabled during measurements.

### Load Switching

High-power devices are switched using:

- **TI TPS22916 Load Switches**

Switch 1

Controls:

- Turbidity Sensors

Switch 2

Controls:

- Audio Subsystem

This minimizes standby energy consumption.

### Main Controller

#### ESP32-C3

Responsibilities:

- System scheduling

- Sensor control

- Power management

- Audio acquisition

- Flash memory management

- LoRa communications

- Error handling

- Watchdog recovery

Default state:

Deep Sleep

Operating frequency:

80 MHz

### Communication Buses

#### OneWire

Devices:

- One DS18B20 sensor (+2 field spares — ADR-0003)

#### SPI Bus

Devices:

- SX1262

- W25Q02JV

#### I²S Bus

Device:

- PCM1808

#### Analog Inputs

Devices:

- One SEN0189 turbidity sensor (+2 field spares — ADR-0003)

### Audio Interface

Hydrophone

↓

PIP Bias Network

↓

PCM1808

↓

I²S

↓

ESP32-C3

↓

Flash Memory

### Power States

#### Sleep

Powered:

- ESP32 Deep Sleep

- Flash Deep Power Down

- Regulators

Unpowered:

- Audio

- Turbidity Sensors

#### Temperature Sampling

Powered:

- ESP32

- DS18B20

#### Turbidity Sampling

Powered:

- ESP32

- TPS61299

- TPS22916

- One SEN0189 sensor (+2 field spares — ADR-0003)

#### Audio Recording

Powered:

- ESP32

- TPS61299

- TPS22916

- H2dM

- PCM1808

- Flash

#### LoRa Transmission

Powered:

- ESP32

- SX1262

## 6. Component Selection

### Component Summary

| **Function**    | **Selected Component** |
|-----------------|------------------------|
| MCU             | ESP32-C3               |
| LoRa Radio      | SX1262                 |
| MPPT Charger    | TI BQ25570             |
| 3.3 V Regulator | TI TPS62840            |
| 5 V Boost       | TI TPS61299            |
| Load Switch     | TI TPS22916 (×2)       |
| Temperature     | DS18B20 (×3)           |
| Turbidity       | DFRobot SEN0189 (×3)   |
| Hydrophone      | Aquarian H2dM          |
| Audio ADC       | TI PCM1808             |
| Storage         | Winbond W25Q02JV       |

### Component Selection Rationale

#### ESP32-C3

Chosen because:

- Extremely low sleep current

- Sufficient processing capability

- Native SPI

- Native I²S

- ADC support

- Excellent development ecosystem

- Low cost

#### SX1262

Chosen because:

- Very low receive current

- Very low sleep current

- Excellent link budget

- Supports long deployment life

- Ideal for low-data-rate telemetry

#### BQ25570

Chosen because:

- Designed specifically for energy harvesting

- Integrated MPPT

- Extremely low quiescent current

- Proven solar applications

#### TPS62840

Chosen because:

- Ultra-low quiescent current

- Excellent efficiency at light loads

- Well suited for battery-powered systems

#### TPS61299

Chosen because:

- High efficiency

- Generates required 5 V rail

- More than adequate current capability

- Enabled only when needed

#### TPS22916

Chosen because:

- Extremely low leakage

- Very low ON resistance

- Simple enable control

- Reduces standby power dramatically

#### DS18B20

Chosen because:

- Waterproof availability

- Digital output

- Excellent accuracy

- OneWire interface simplifies wiring

- Multiple sensors share one bus

#### SEN0189

Chosen because:

- Low cost

- Simple analog interface

- Suitable for proof-of-concept reef monitoring

- Easily switched off between measurements

#### Aquarian H2dM

Chosen because:

- Low-voltage operation

- No phantom power required

- Low operating current

- Simple interface

- Ideal for autonomous systems

#### PCM1808

Chosen because:

- High-quality audio conversion

- Native I²S interface

- Low design complexity

- Well documented

#### Winbond W25Q02JV

Chosen because:

- Large storage capacity

- Low standby current

- Supports approximately 30 days of onboard audio retention under the current mission profile

- Simple SPI/QSPI interface

### Alternative Components Considered

| **Original Choice** | **Final Decision** | **Reason for Change** |
|----|----|----|
| ESP32-S3 / T-Beam | ESP32-C3 | Lower power and simpler architecture |
| Aquarian H2A-XLR | Aquarian H2dM | Eliminated phantom power requirement |
| INA217 Preamp | Removed | No longer required after hydrophone change |
| 128 Mbit Flash | 2 Gbit Flash | Increased storage capacity for onboard audio |
| Continuous Sensor Power | Load-switched power | Reduced standby energy consumption |

### Component Selection Philosophy

Every component was selected using the following criteria:

1.  Lowest practical average power consumption.

2.  Minimal supporting circuitry.

3.  Long-term availability.

4.  Manufacturer documentation.

5.  Ease of integration.

6.  Proven reliability.

7.  Ability to support future expansion.

## 7. Power Architecture

### Purpose

The power architecture is designed to maximize deployment duration by minimizing average power consumption while supporting autonomous operation from a solar-charged battery system.

### Design Philosophy

The power system follows five primary principles:

- Harvest solar energy continuously.

- Keep the system in Deep Sleep whenever possible.

- Power high-current peripherals only when required.

- Minimize always-on quiescent current.

- Separate the low-power digital rail from the switched 5 V measurement rail.

### Power Flow

Solar Panel

│

▼

TI BQ25570 MPPT Energy Harvester

│

▼

LiFePO₄ Battery

│

├───────────────┐

▼ ▼

TPS62840 TPS61299

3.3 V Rail 5 V Boost

│ │

│ TPS22916 Load Switches

│ │

│ ┌──────┴────────┐

│ │ │

▼ ▼ ▼

Digital Turbidity Audio System

Electronics Sensors (PCM1808 + H2dM)

### Battery System

Battery Chemistry:

- Rechargeable LiFePO₄

Purpose:

- Supply power during nighttime and low-solar conditions.

- Provide stable energy storage for continuous operation.

Battery sizing will be determined after completion of the verified daily energy budget.

### Solar Energy Harvesting

The solar subsystem consists of:

- Solar panel

- TI BQ25570 MPPT charger

- LiFePO₄ battery

The BQ25570 continuously harvests available solar energy and charges the battery using Maximum Power Point Tracking (MPPT) to improve charging efficiency under varying sunlight conditions.

### Voltage Rails

#### 3.3 V Rail (Always Active)

Generated by:

- TI TPS62840

Supplies:

- ESP32-C3

- SX1262

- W25Q02JV

- DS18B20

- Digital logic

Characteristics:

- Always enabled

- Ultra-low quiescent current

- Primary system supply

#### 5 V Rail (Switched)

Generated by:

- TI TPS61299

Supplies:

- PCM1808 analog supply

- SEN0189 turbidity sensors

Characteristics:

- Disabled during sleep

- Enabled only for turbidity measurements and audio recording

- Controlled by firmware through TPS22916 load switches

### Power Switching Strategy

#### Always Powered

- BQ25570

- TPS62840

- ESP32-C3 (Deep Sleep)

- SX1262 (Warm Sleep)

- W25Q02JV (Deep Power-Down)

- DS18B20 (Standby)

#### Switched On-Demand

- TPS61299

- PCM1808

- Aquarian H2dM

- SEN0189 ×3

These devices are powered only during active measurements to minimize daily energy consumption.

### Protection Strategy

The architecture relies on:

- Regulated voltage rails

- Controlled power sequencing

- Load switches for high-current peripherals

- Firmware-controlled startup and shutdown

Future revisions may include additional transient and reverse-polarity protection depending on deployment requirements.

### Energy Management Philosophy

The system minimizes average power consumption by maximizing the percentage of time spent in Deep Sleep.

The firmware controls subsystem power states rather than allowing peripherals to remain continuously energized.

This approach provides significantly greater deployment duration than a continuously powered architecture.

## 8. Sensor Architecture

> ⚠️ **Superseded in part by [ADR-0003](../decisions/0003-single-point-sensing.md) (2026-08-14).**
> The build deploys **one DS18B20 and one SEN0189** at a single sensing location — not the
> 3× multi-depth string described below. Extra temp/turbidity units are field spares. The
> quantity and layout below are corrected; the step-by-step operation text still reads "all
> three" and is superseded — read it as "the sensor". Multi-depth is a future concept.

### Purpose

The sensor subsystem acquires environmental data at a single point beneath the buoy while minimizing power consumption and wiring complexity.

Three sensing modalities are included:

- Water temperature

- Water turbidity

- Underwater acoustics

### Temperature Subsystem

#### Sensor

- DS18B20 Waterproof Digital Temperature Sensor

Quantity:

- 1 deployed (2 additional units held as field spares — see ADR-0003)

Communication:

- OneWire

Supply:

- 3.3 V

Power Strategy:

- Remains powered continuously.

- Extremely low standby current makes load switching unnecessary.

Sampling Schedule:

- Six measurements per day.

Operation:

1.  ESP32 wakes.

2.  Broadcasts a single Convert-T command.

3.  The sensor performs conversion.

4.  ESP32 enters Light Sleep during conversion.

5.  ESP32 wakes.

6.  Reads each sensor sequentially.

7.  Returns to Deep Sleep.

### Turbidity Subsystem

#### Sensor

- DFRobot SEN0189

Quantity:

- 1 deployed (2 additional units held as field spares — see ADR-0003)

Interface:

- Analog

Supply:

- Switched 5 V

Power Strategy:

- Normally unpowered.

- Enabled only during measurements.

Sampling Schedule:

- Six measurements per day.

Operation:

1.  Enable TPS61299.

2.  Enable TPS22916 load switch.

3.  Apply power to the sensor.

4.  Wait 500 ms for stabilization.

5.  Read all three analog outputs.

6.  Disable sensor power.

7.  Return to Deep Sleep.

### Audio Subsystem

#### Hydrophone

- Aquarian H2dM

Interface:

- Plug-in Power (PIP)

Signal Chain:

Hydrophone

↓

PIP Bias Network

↓

PCM1808

↓

ESP32-C3 (I²S)

↓

Flash Memory

Supply:

- Switched 5 V

Sampling Configuration:

- Mono

- 16 kHz

- 16-bit PCM

Recording Schedule:

- Three recordings per day.

- 60 seconds each.

Operation:

1.  Enable TPS61299.

2.  Enable TPS22916.

3.  Power PCM1808.

4.  Bias H2dM.

5.  Begin I²S streaming.

6.  Stream audio directly into flash memory.

7.  Stop recording.

8.  Power down audio subsystem.

9.  Return to Deep Sleep.

### Sensor Layout

The deployed sensor set is (per ADR-0003):

- Temperature Sensor (DS18B20 ×1)

- Turbidity Sensor (SEN0189 ×1)

- Aquarian Hydrophone ×1

Sensors are sited together at a single point beneath the buoy. Additional DS18B20 and SEN0189 units are kept as field spares, not deployed. A future revision may distribute sensors vertically for multi-depth measurement — see [Sensor String Architecture](sensor-string-architecture.md).

### Sensor Synchronization

Temperature and turbidity measurements are synchronized so they represent approximately the same environmental conditions.

Audio recordings occur independently according to the scheduled recording windows.

This minimizes power consumption while preserving meaningful environmental datasets.

### Sensor Data Flow

Temperature

│

Turbidity

│

Hydrophone

│

▼

ESP32-C3

│

▼

Flash Memory

│

▼

Daily Summary

│

▼

SX1262 LoRa

## 9. Audio Subsystem

### Purpose

The audio subsystem continuously acquires high-quality underwater acoustic data during scheduled recording periods while minimizing average energy consumption. Raw audio is stored locally for later retrieval and analysis and is **not** transmitted over LoRa.

### Design Objectives

- Record biologically relevant reef acoustics.

- Minimize subsystem power consumption.

- Minimize analog circuitry.

- Eliminate phantom power requirements.

- Stream directly to onboard flash memory.

- Operate autonomously.

### Hardware Architecture

#### Signal Chain

Aquarian H2dM Hydrophone

│

▼

Plug-in Power (PIP) Bias Network

│

▼

TI PCM1808 Audio ADC

│

▼

I²S Digital Audio

│

▼

ESP32-C3

│

▼

Winbond W25Q02JV Flash Memory

### Components

#### Hydrophone

**Component**

- Aquarian H2dM

Purpose

- Capture underwater acoustic signals.

Reasons for Selection

- Low-voltage operation.

- No phantom power required.

- Low operating current.

- Simple interface.

- Suitable for autonomous battery-powered systems.

#### Audio ADC

**Component**

- TI PCM1808

Purpose

- Convert analog hydrophone output into digital audio.

Reasons for Selection

- Native I²S interface.

- Low design complexity.

- High audio quality.

- Well-documented implementation.

### Audio Configuration

| **Parameter**      | **Value**  |
|--------------------|------------|
| Channels           | Mono       |
| Sample Rate        | 16 kHz     |
| Bit Depth          | 16-bit PCM |
| Recording Duration | 60 seconds |
| Recordings per Day | 3          |
| Daily Raw Audio    | 5.76 MB    |

### Recording Schedule

The audio subsystem records:

- Three times per day.

- One minute per recording.

- Evenly distributed throughout the day.

The exact recording times may be modified in firmware without requiring hardware changes.

### Power Management

#### Sleep State

Powered:

- Nothing within the audio subsystem.

The hydrophone, ADC, and associated circuitry remain completely unpowered between recordings.

#### Recording State

Power sequence:

1.  Enable TPS61299 boost converter.

2.  Enable TPS22916 load switch.

3.  Power PCM1808.

4.  Apply PIP bias to H2dM.

5.  Initialize I²S.

6.  Begin recording.

Shutdown sequence:

1.  Stop I²S.

2.  Disable hydrophone bias.

3.  Power down PCM1808.

4.  Disable load switch.

5.  Disable boost converter.

### Data Handling

Audio is streamed continuously from the PCM1808 to the ESP32 using the I²S peripheral.

The ESP32 writes incoming audio directly to flash memory using small RAM buffers.

Entire recordings are **not** buffered in RAM because the recording size exceeds the available internal memory.

### Storage Strategy

Each recording is stored immediately after acquisition.

Storage characteristics:

- Sequential writes.

- Raw PCM format.

- Firmware-managed file allocation.

- Approximately 30 days of onboard storage before overwrite.

Future firmware revisions may implement compression if additional storage capacity becomes necessary.

### Failure Recovery

If power is interrupted:

- Current recording terminates.

- Previously stored recordings remain intact.

- Recording resumes at the next scheduled event.

## 10. Communications (LoRa)

### Purpose

The communications subsystem transmits summarized environmental data from the buoy to a nearby shore station once per day using LoRa.

Raw audio remains stored onboard and is not transmitted.

### Design Objectives

- Minimize transmission energy.

- Maximize communication reliability.

- Maintain simple firmware.

- Operate without acknowledgements during normal operation.

### Hardware

#### Radio

**Component**

- Semtech SX1262

Interface

- SPI

Controlled by

- ESP32-C3

### Operating Parameters

| **Parameter**    | **Value** |
|------------------|-----------|
| Frequency        | 915 MHz   |
| Transmit Power   | +14 dBm   |
| Bandwidth        | 125 kHz   |
| Spreading Factor | SF7       |
| Coding Rate      | 4/5       |
| Header           | Explicit  |
| CRC              | Enabled   |
| Preamble         | 8 symbols |

### Transmission Schedule

The buoy transmits:

- Once per day.

Transmission occurs after all daily measurements have been collected.

### Payload Structure

| **Field**                            | **Bytes**    |
|--------------------------------------|--------------|
| Timestamp                            | 4            |
| Temperature Measurements (18 values) | 36           |
| Turbidity Measurements (18 values)   | 36           |
| Battery Voltage                      | 2            |
| Status Flags                         | 1            |
| Firmware Version                     | 1            |
| CRC-16                               | 2            |
| **Total Payload**                    | **82 bytes** |

### Communication Workflow

1.  ESP32 wakes.

2.  Read summarized sensor data from flash.

3.  Wake SX1262.

4.  Configure radio.

5.  Load payload.

6.  Transmit packet.

7.  Wait for TX complete.

8.  Return SX1262 to Warm Sleep.

9.  Return ESP32 to Deep Sleep.

### Radio Power States

#### Sleep

- SX1262 Warm Sleep.

- Configuration retained.

#### Transmission

Powered:

- ESP32-C3

- SX1262

Duration:

Approximately one transmission event per day using the configured LoRa parameters.

### Shore Station

The shore station receives the daily packet and is responsible for:

- Packet validation.

- Data storage.

- Long-term archival.

- Visualization.

- Optional cloud synchronization.

- Future machine learning and anomaly detection.

### Failure Handling

If transmission fails:

- Sensor data remains stored locally.

- Firmware records the failed transmission.

- Retry behavior may be implemented in future revisions.

The current baseline architecture assumes no automatic retransmissions for the initial power budget.

## 11. Data Storage

### Purpose

The data storage subsystem provides reliable, non-volatile storage for all environmental measurements, raw hydrophone recordings, system metadata, and diagnostic information. Storage is optimized for low power consumption, sequential writes, and long deployment duration.

### Design Objectives

- Store all raw hydrophone recordings.

- Store all temperature measurements.

- Store all turbidity measurements.

- Preserve data through unexpected resets.

- Minimize write energy.

- Maximize flash lifetime.

- Simplify firmware implementation.

### Hardware

#### Primary Storage Device

| **Parameter**  | **Value**        |
|----------------|------------------|
| Component      | Winbond W25Q02JV |
| Capacity       | 2 Gbit (256 MB)  |
| Interface      | Quad SPI (QSPI)  |
| Supply Voltage | 3.3 V            |
| Default State  | Deep Power-Down  |

### Stored Data

The flash memory stores the following information:

#### Environmental Data

- Temperature measurements

- Turbidity measurements

#### Audio Data

- Raw PCM recordings

- Recording timestamps

#### System Information

- Battery voltage

- Firmware version

- System status flags

- Device configuration

- Error logs

### Storage Organization

Flash memory is logically divided into regions.

Example layout:

| **Region**           | **Purpose**                     |
|----------------------|---------------------------------|
| Boot / Configuration | Device settings                 |
| Environmental Log    | Temperature & turbidity history |
| Audio Storage        | Raw recordings                  |
| Diagnostic Log       | Errors and system events        |
| Reserved             | Future expansion                |

The exact memory map will be finalized during firmware implementation.

### Audio Storage

Configuration:

| **Parameter** | **Value** |
|---------------|-----------|
| Format        | PCM       |
| Sample Rate   | 16 kHz    |
| Bit Depth     | 16-bit    |
| Channels      | Mono      |

Generated data:

- 1.92 MB per recording

- 5.76 MB per day

- Approximately 172.8 MB over 30 days

Approximately 20% of flash capacity is reserved for metadata, wear management, erase alignment, and future expansion.

### Write Strategy

The ESP32 continuously streams incoming audio into flash using small RAM buffers.

Characteristics:

- Sequential page writes

- No full-recording RAM buffer

- Low firmware complexity

- Reduced RAM usage

- Improved flash endurance

### Read Strategy

Flash is read only when required.

Typical read operations include:

- Preparing the daily LoRa packet

- Diagnostic retrieval

- Data download during maintenance

### Storage Retention

The firmware maintains approximately 30 days of recordings under the current mission profile.

When storage becomes full, firmware will overwrite the oldest recordings using a circular buffer strategy while preserving system metadata.

### Power Management

#### Normal State

- Flash enters Deep Power-Down.

#### Recording

- Flash wakes.

- Sequential writes occur throughout recording.

- Flash returns to Deep Power-Down after recording completes.

#### Communication

- Flash wakes.

- Required summary data is read.

- Flash returns to Deep Power-Down.

### Design Constraint

#### DC-001 — Audio Storage Capacity

The selected storage device satisfies the current mission profile.

Any increase in:

- Sample rate

- Bit depth

- Recording duration

- Recordings per day

- Retention period

requires a storage capacity review.

## 12. Firmware Architecture

### Purpose

The firmware coordinates every subsystem within S.C.O.U.T. while minimizing energy consumption and maintaining autonomous operation.

The firmware is event-driven and spends the majority of its lifetime in Deep Sleep.

### Primary Responsibilities

The firmware is responsible for:

- System startup

- Scheduling measurements

- Power management

- Sensor acquisition

- Audio recording

- Flash management

- LoRa communications

- Battery monitoring

- Error detection

- Watchdog recovery

### Operating Philosophy

The firmware follows one fundamental rule:

**Only power hardware that is actively performing useful work.**

Every subsystem remains unpowered whenever possible.

### System States

#### State 1 — Deep Sleep

Default operating state.

Powered:

- ESP32-C3 (Deep Sleep)

- Essential regulators

- Battery charging circuitry

Unpowered:

- Audio subsystem

- Turbidity sensors

- 5 V rail

#### State 2 — Temperature Measurement

Sequence:

1.  Wake ESP32.

2.  Issue DS18B20 Convert-T command.

3.  Enter Light Sleep during conversion.

4.  Wake.

5.  Read the sensor.

6.  Save measurements.

7.  Return to Deep Sleep.

#### State 3 — Turbidity Measurement

Sequence:

1.  Wake ESP32.

2.  Enable TPS61299.

3.  Enable TPS22916.

4.  Apply power to all SEN0189 sensors.

5.  Wait 500 ms for stabilization.

6.  Read all three analog channels.

7.  Store measurements.

8.  Disable sensor power.

9.  Return to Deep Sleep.

#### State 4 — Audio Recording

Sequence:

1.  Wake ESP32.

2.  Enable TPS61299.

3.  Enable TPS22916.

4.  Power PCM1808.

5.  Apply PIP bias to H2dM.

6.  Initialize I²S.

7.  Stream audio into flash.

8.  Stop recording.

9.  Return flash to Deep Power-Down.

10. Disable audio subsystem.

11. Return to Deep Sleep.

#### State 5 — Daily Communication

Sequence:

1.  Wake ESP32.

2.  Read summarized data from flash.

3.  Wake SX1262.

4.  Configure radio.

5.  Transmit LoRa packet.

6.  Return radio to Warm Sleep.

7.  Return ESP32 to Deep Sleep.

### Scheduler

Daily schedule:

| **Task**                 | **Frequency** |
|--------------------------|---------------|
| Temperature Measurements | 6/day         |
| Turbidity Measurements   | 6/day         |
| Audio Recordings         | 3/day         |
| LoRa Transmission        | 1/day         |

Tasks are distributed throughout the day to avoid unnecessary power peaks.

### Data Flow

Sensors

│

▼

ESP32-C3

│

├── Process measurements

├── Stream audio

├── Store data

└── Create daily summary

│

▼

SX1262 LoRa

### Error Handling

The firmware detects and records:

- Sensor read failures

- Storage errors

- Communication failures

- Low battery conditions

- Unexpected resets

All events are logged for later retrieval.

### Recovery Strategy

Upon reset:

1.  Initialize hardware.

2.  Verify flash integrity.

3.  Restore scheduler.

4.  Resume normal operation.

No user intervention is required following temporary power interruption.

### Future Firmware Enhancements

Potential future improvements include:

- OTA firmware updates

- Adaptive sampling schedules

- Audio event detection

- Data compression

- Automatic retransmissions

- Intelligent duty-cycle adjustment based on battery state

## 13. Operating Timeline

### Purpose

The operating timeline defines the sequence of events performed by S.C.O.U.T. during a typical 24-hour operating cycle. The objective is to maximize time spent in low-power states while ensuring all required measurements are collected and transmitted.

### Daily Operating Philosophy

S.C.O.U.T. remains in Deep Sleep for the majority of each day.

The system wakes only to:

- Measure temperature

- Measure turbidity

- Record underwater audio

- Transmit one daily LoRa packet

All other time is spent in the lowest practical power state.

### 24-Hour Operating Cycle

The exact wake times are configurable in firmware. The following timeline represents the current baseline schedule.

| **Time**       | **Event**                           |
|----------------|-------------------------------------|
| 00:00          | Temperature + Turbidity Measurement |
| 02:00          | Audio Recording                     |
| 04:00          | Temperature + Turbidity Measurement |
| 08:00          | Temperature + Turbidity Measurement |
| 10:00          | Audio Recording                     |
| 12:00          | Temperature + Turbidity Measurement |
| 16:00          | Temperature + Turbidity Measurement |
| 18:00          | Audio Recording                     |
| 20:00          | Temperature + Turbidity Measurement |
| 23:55          | Generate Daily Summary              |
| 23:56          | LoRa Transmission                   |
| Remaining Time | Deep Sleep                          |

The schedule is intentionally distributed throughout the day to capture changing environmental conditions while avoiding long periods of uninterrupted activity.

### Temperature Event Timeline

Each temperature event follows the sequence below.

1.  Wake ESP32-C3.

2.  Broadcast DS18B20 Convert-T command.

3.  ESP32 enters Light Sleep during conversion.

4.  Wake after conversion.

5.  Read the sensor.

6.  Store measurements.

7.  Return to Deep Sleep.

### Turbidity Event Timeline

Each turbidity event immediately follows the corresponding temperature event.

1.  Enable TPS61299 boost converter.

2.  Enable TPS22916 load switch.

3.  Apply power to all SEN0189 sensors.

4.  Wait for sensor stabilization.

5.  Read all three analog outputs.

6.  Store measurements.

7.  Disable sensor power.

8.  Disable boost converter.

9.  Return to Deep Sleep.

### Audio Recording Timeline

Each recording follows the same sequence.

1.  Wake ESP32-C3.

2.  Enable 5 V rail.

3.  Power PCM1808.

4.  Apply PIP bias to hydrophone.

5.  Initialize I²S.

6.  Stream audio directly to flash memory.

7.  Stop recording.

8.  Return flash to Deep Power-Down.

9.  Disable audio subsystem.

10. Return to Deep Sleep.

### Daily Communication Timeline

Once each day:

1.  Wake ESP32-C3.

2.  Read summarized environmental data.

3.  Wake SX1262.

4.  Configure LoRa radio.

5.  Transmit daily packet.

6.  Return SX1262 to Warm Sleep.

7.  Return ESP32-C3 to Deep Sleep.

### Normal Power State Summary

| **System State** | **Typical Condition**                                   |
|------------------|---------------------------------------------------------|
| Deep Sleep       | Default operating state                                 |
| Light Sleep      | During DS18B20 conversion                               |
| Active           | Sensor measurements, audio recording, LoRa transmission |

## 14. Daily Sampling Schedule

### Purpose

This section defines what data is collected, how frequently it is collected, and how it is processed before storage and transmission.

### Temperature Sampling

#### Sensor

DS18B20 Waterproof Digital Temperature Sensor

#### Quantity

3

#### Frequency

6 measurements per day per sensor

#### Daily Measurements

18 total temperature measurements

#### Workflow

- Wake MCU

- Simultaneous conversion

- Sequential read

- Save to flash

- Return to Deep Sleep

### Turbidity Sampling

#### Sensor

DFRobot SEN0189

#### Quantity

3

#### Frequency

6 measurements per day per sensor

#### Daily Measurements

18 total turbidity measurements

#### Workflow

- Enable switched 5 V rail

- Stabilize sensors

- Read analog outputs

- Save to flash

- Remove power

### Audio Sampling

#### Sensor

Aquarian H2dM

#### Quantity

1

#### Frequency

3 recordings per day

#### Recording Length

60 seconds

#### Audio Configuration

| **Parameter** | **Value**  |
|---------------|------------|
| Channels      | Mono       |
| Sample Rate   | 16 kHz     |
| Bit Depth     | 16-bit PCM |

#### Daily Audio

| **Metric**          | **Value**   |
|---------------------|-------------|
| Recordings          | 3           |
| Recording Time      | 180 seconds |
| Raw Audio Generated | 5.76 MB/day |

### Daily Data Summary

| **Data Type**        | **Daily Quantity** |
|----------------------|--------------------|
| Temperature Readings | 18                 |
| Turbidity Readings   | 18                 |
| Audio Recordings     | 3                  |
| Audio Duration       | 180 seconds        |
| LoRa Packets         | 1                  |

### Data Storage Strategy

Immediately after collection:

- Temperature data is stored in flash.

- Turbidity data is stored in flash.

- Audio is streamed directly to flash memory.

No measurement data is discarded prior to storage.

### Daily LoRa Summary Packet

The firmware constructs one packet each day containing:

- Timestamp

- Daily temperature dataset

- Daily turbidity dataset

- Battery voltage

- System status flags

- Firmware version

- CRC

Raw audio is retained onboard and is not included in the LoRa transmission.

### Mission Profile Summary

| **Parameter**        | **Value**  |
|----------------------|------------|
| Temperature Sensors  | 3          |
| Turbidity Sensors    | 3          |
| Hydrophones          | 1          |
| Temperature Samples  | 18/day     |
| Turbidity Samples    | 18/day     |
| Audio Recordings     | 3/day      |
| Audio Duration       | 180 s/day  |
| LoRa Transmissions   | 1/day      |
| Data Storage         | Continuous |
| Default System State | Deep Sleep |

### Design Philosophy

The sampling schedule balances three competing objectives:

1.  Collect sufficient environmental data to characterize reef conditions.

2.  Minimize average daily energy consumption.

3.  Maintain a simple, deterministic firmware architecture that is easy to validate, debug, and expand in future revisions.

## 15. Daily Energy Budget

### Purpose

The daily energy budget estimates the average energy consumed by S.C.O.U.T. over a 24-hour period. This budget serves as the basis for battery sizing and solar panel sizing.

This version represents **Power Budget v1.0 (Preliminary)**. Electrical characteristics are derived from manufacturer documentation where available. Operating durations are based on the current firmware architecture and documented engineering assumptions.

Future prototype testing will be used to validate and refine these values.

### Methodology

For each component:

Daily Energy (Wh/day)

= Operating Voltage × Average Current × Operating Time per Day

All component energies are then summed to determine the total daily system energy consumption.

Whenever possible:

- Electrical parameters originate from manufacturer documentation.

- Operating durations originate from the firmware schedule defined in Sections 12–14.

- Engineering assumptions are explicitly documented.

### Component Energy Budget

| **Component** | **State Considered** | **Daily Energy (Wh/day)** | **Confidence** |
|----|----|----|----|
| ESP32-C3 | Active + Deep Sleep | 0.00343 | Medium (datasheet + timing assumptions) |
| SX1262 | TX + Warm Sleep | 0.000003 | Medium |
| BQ25570 | Quiescent Only | 0.000043 | High |
| DS18B20 ×3 | Active + Standby | 0.000013 | High |
| SEN0189 ×3 | Six measurement events/day | 0.000330 | Medium |
| Aquarian H2dM | Three 60-second recordings/day | 0.000210 | Medium |
| PCM1808 | Three 60-second recordings/day | 0.006000 | Medium |
| Winbond W25Q02JV | Streamed writes + daily read | 0.000110 | Medium |
| TPS62840 | Quiescent Current | 0.000005 | High |
| TPS22916 ×2 | Quiescent Current | ~0.0000001 | High |
| TPS61299 | Quiescent + switching | 0.000010 | Medium |

### Preliminary Total

| **Quantity**       | **Value**           |
|--------------------|---------------------|
| Total Daily Energy | **≈0.01015 Wh/day** |

### Largest Energy Consumers

| **Rank** | **Component** | **Approximate Contribution** |
|----|----|----|
| 1 | PCM1808 Audio ADC | ~59% |
| 2 | ESP32-C3 | ~34% |
| 3 | SEN0189 Turbidity Sensors | ~3% |
| 4 | Aquarian H2dM | ~2% |
| Remaining Components | \<2% combined |  |

### Engineering Notes

This preliminary budget highlights several important observations.

- The audio subsystem dominates total energy consumption.

- The ESP32-C3 is the second largest consumer due to continuous activity during audio recording.

- The always-on circuitry contributes only a small fraction of the total daily energy.

- Reducing audio duty cycle would have the greatest effect on deployment duration.

### Validation Plan

The following measurements should be performed on the first hardware prototype:

- Deep Sleep current

- Temperature measurement current

- Turbidity measurement current

- Audio subsystem current

- Flash write current

- LoRa transmission current

- Total daily battery current

These measurements will be used to produce **Power Budget v2.0 (Verified)**.

## 16. Battery Sizing

### Purpose

This section establishes the battery capacity required to support continuous autonomous operation under the current mission profile.

Battery sizing is based on the preliminary daily energy budget and will be refined after prototype validation.

### Battery Chemistry

Selected Battery

- Rechargeable LiFePO₄

Reasons for Selection

- Excellent cycle life

- High safety

- Stable discharge voltage

- Wide operating temperature range

- Suitable for long-duration outdoor deployment

### Design Philosophy

The battery should provide sufficient capacity to:

- Operate overnight.

- Continue operation during multiple cloudy days.

- Support all scheduled sensing events.

- Maintain adequate reserve capacity.

- Avoid deep discharge whenever practical.

### Sizing Method

Battery capacity is determined using:

Required Battery Energy

Daily Energy Consumption

×

Required Days of Autonomy

×

Safety Factor

Where:

- Daily Energy Consumption comes from Section 15.

- Days of Autonomy is determined by deployment requirements.

- Safety Factor accounts for aging, environmental conditions, and unforeseen loads.

### Current Inputs

| **Parameter**            | **Current Value**                           |
|--------------------------|---------------------------------------------|
| Daily Energy Consumption | 0.01015 Wh/day (Preliminary)                |
| Battery Chemistry        | LiFePO₄                                     |
| Battery Voltage          | To be finalized during hardware integration |
| Days of Autonomy         | To be determined                            |
| Safety Factor            | To be determined                            |

### Recommended Design Process

The battery should not be selected solely from the preliminary energy budget.

Instead:

1.  Complete prototype testing.

2.  Verify the measured daily energy consumption.

3.  Establish the required autonomy period (e.g., several consecutive low-sunlight days).

4.  Apply an appropriate engineering safety factor.

5.  Select the nearest commercially available LiFePO₄ battery exceeding the calculated requirement.

### Battery Management

The battery management strategy includes:

- Solar charging through the TI BQ25570.

- Continuous voltage monitoring by the ESP32-C3.

- Firmware-controlled low-battery detection.

- Future support for adaptive sampling if battery voltage falls below a configurable threshold.

### Future Enhancements

Potential improvements include:

- Dynamic duty cycling based on state of charge.

- Seasonal adjustment of sampling frequency.

- Adaptive audio recording schedules.

- Intelligent energy budgeting based on available solar input.

These enhancements are not required for S.C.O.U.T. v1.0 but can significantly increase deployment duration in future revisions.

## 17. Solar Sizing

### Purpose

The solar subsystem replenishes the energy consumed by S.C.O.U.T. each day while maintaining sufficient battery charge for continuous autonomous operation.

The solar system shall be capable of supporting normal operation under typical environmental conditions while providing adequate margin for seasonal variation, cloud cover, component aging, and conversion losses.

### Design Objectives

The solar subsystem shall:

- Fully replenish the average daily energy consumption.

- Recharge the battery after overnight operation.

- Maintain positive long-term energy balance.

- Continue operation through periods of reduced solar irradiance.

- Operate without user intervention.

### System Architecture

The solar subsystem consists of:

- Solar panel

- TI BQ25570 MPPT energy harvesting IC

- LiFePO₄ battery

- 3.3 V and 5 V regulated power rails

Energy flows continuously from the solar panel into the battery whenever sufficient sunlight is available. The battery then powers the buoy during both daylight and nighttime operation.

### Solar Energy Requirement

The current design uses the preliminary daily energy budget developed in Section 15.

| **Parameter**            | **Current Value**                |
|--------------------------|----------------------------------|
| Daily Energy Consumption | **0.01015 Wh/day (Preliminary)** |

This value will be replaced with a verified measurement after prototype testing.

### Engineering Margin

The solar panel shall be selected with significant excess capacity relative to the calculated average daily energy consumption.

Design margin should account for:

- Cloud cover

- Seasonal variation

- Panel contamination

- Battery charging losses

- Regulator efficiency

- Component aging

A practical engineering goal is for the solar panel to generate substantially more energy on an average day than the buoy consumes.

### MPPT Operation

The TI BQ25570 continuously monitors the solar input and adjusts its operating point to maximize harvested power.

Benefits include:

- Improved efficiency under varying sunlight.

- Better low-light performance.

- Increased battery charging efficiency.

- Longer deployment duration.

### Verification Plan

Prototype testing shall verify:

- Solar charging current.

- Harvested energy under representative field conditions.

- Battery state of charge over multiple days.

- System operation during prolonged cloudy weather.

- Net daily energy balance.

The measured data will be used to produce **Solar Sizing v2.0**.

## 18. Design Assumptions

### Purpose

This section documents all engineering assumptions used throughout the S.C.O.U.T. design process.

Manufacturer specifications and engineering assumptions are intentionally separated to maintain traceability and simplify future design revisions.

### Mechanical Assumptions

| **Item** | **Assumption** |
|---|---|
| Buoy outer diameter | 18.000 in (R9.000 in) — dimensioned drawings |
| Flotation wedge height (v5) | 5.500 in; chassis 8.500 in |
| Wedge count | 6 × exactly 60°, epoxied into a closed ring |
| Flotation foam | US Composites #0204, 2 lb/ft³ (0.032 g/cm³); full-fill of all 6 wedge modules |
| Build material | PETG (ρ 1.27 g/cm³); ASA for production scale-up |
| As-deployed mass (v5) | ~7.59 kg nominal — Tier III (battery, solar, stem, pod, mooring hardware) still estimated pending [SCO-70](https://linear.app/scout1/issue/SCO-70); v5 shell masses are geometric estimates pending re-slice |
| Net reserve buoyancy | ~212 N (~3.8:1 margin); nominal draft ~2.5 in |
| Pressure target | 5 m water equivalent (50.3 kPa) |
| Environmental design set (structural) | `d` 2.0 m, `H` 1.2 m, `T_w` 6 s, `U_c` 0.8 m/s, `U_wind` 22 m/s (survival) — signed off 2026-09-08 |
| Governing structural load | LC9 mooring snap ≈ 810 N |
| Seawater density | 1.025 g/cm³ |
| Appendage displacement credit (freeboard model) | 0.372 kg |

These values will be updated as the v5 re-slice, [SCO-70](https://linear.app/scout1/issue/SCO-70),
the stability analysis, and the impact / ring-buckling / v5 FEA runs complete. Full derivations
in [`docs/engineering/buoy-structural/`](buoy-structural/).

### Firmware Assumptions

| **Item**               | **Assumption**                                     |
|------------------------|----------------------------------------------------|
| MCU Clock              | 80 MHz during active operation                     |
| Default MCU State      | Deep Sleep                                         |
| Temperature Conversion | ESP32 enters Light Sleep during DS18B20 conversion |
| Audio Storage          | Continuous streamed writes to flash                |
| Flash Buffering        | Small RAM buffers only                             |
| Radio Retries          | None                                               |
| LoRa Transmission      | One packet per day                                 |

### Sensor Assumptions

| **Item** | **Assumption** |
|----|----|
| Temperature Sensors | One DS18B20 (+2 field spares — ADR-0003) |
| Temperature Samples | Six per sensor per day |
| Turbidity Sensors | One SEN0189 (+2 field spares — ADR-0003) |
| Turbidity Samples | Six per sensor per day |
| Sensor Synchronization | Temperature and turbidity sampled during the same wake event |

### Audio Assumptions

| **Item**           | **Assumption** |
|--------------------|----------------|
| Hydrophone         | Aquarian H2dM  |
| ADC                | TI PCM1808     |
| Channels           | Mono           |
| Sample Rate        | 16 kHz         |
| Bit Depth          | 16-bit PCM     |
| Recording Duration | 60 seconds     |
| Recordings per Day | Three          |

### Storage Assumptions

| **Item**          | **Assumption**                            |
|-------------------|-------------------------------------------|
| Storage Device    | Winbond W25Q02JV                          |
| Capacity          | 256 MB                                    |
| Audio Retention   | Approximately 30 days                     |
| Storage Strategy  | Circular buffer after capacity is reached |
| Reserved Capacity | Approximately 20%                         |

### Communications Assumptions

| **Item**            | **Assumption** |
|---------------------|----------------|
| Radio               | SX1262         |
| Frequency           | 915 MHz        |
| TX Power            | +14 dBm        |
| Bandwidth           | 125 kHz        |
| Spreading Factor    | SF7            |
| Coding Rate         | 4/5            |
| Payload             | 82 bytes       |
| Daily Transmissions | One            |

### Power Assumptions

| **Item** | **Assumption** |
|----|----|
| Battery Chemistry | LiFePO₄ |
| Solar Charging | TI BQ25570 MPPT |
| 3.3 V Rail | Always enabled |
| 5 V Rail | Enabled only during turbidity measurements and audio recording |
| Turbidity Sensors | Normally unpowered |
| Audio Subsystem | Normally unpowered |

### Preliminary Design Assumptions

The following items remain preliminary until prototype validation:

- Daily energy consumption.

- Component active durations.

- Regulator efficiency under actual operating conditions.

- Flash write timing.

- Battery capacity.

- Solar panel size.

These values will be updated after laboratory testing and field validation.

### Assumption Management

Any future modification to the following parameters shall trigger a review of the power budget and system sizing:

- Sampling frequency.

- Audio recording duration.

- Sample rate.

- Bit depth.

- LoRa transmission schedule.

- Payload size.

- Storage retention period.

- Battery chemistry.

- Solar panel selection.

Maintaining this list ensures that future revisions remain traceable, repeatable, and technically defensible.

## 19. Design Constraints

### Purpose

This section documents the engineering constraints that influenced the S.C.O.U.T. design. These constraints establish the boundaries within which the system must operate and identify conditions that require future design review if modified.

### Mechanical Constraints

#### Buoy Structure

- Buoy outer diameter is **18 in**; the design is manufactured entirely by in-house
  fused-deposition 3D printing in PETG.

- The six flotation wedges shall be foam-filled and epoxied into a closed monocoque ring; foam
  shall be in place before any submersion until the assembly-level ring-buckling FEA confirms
  the bonded ring unaided.

- The structure shall pass the LC1–LC9 load framework at the signed-off environmental design
  set (governing case LC9, mooring snap ≈ 810 N) and the 5 m (50.3 kPa) hydrostatic case.

- Buoyancy shall remain positive with a fully flooded chassis and with any one wedge module
  lost.

#### Electronics Housing

- Enclosure internal envelope and wall thickness are **pending the final electronics component
  list** ([SCO-70](https://linear.app/scout1/issue/SCO-70) → [SCO-49](https://linear.app/scout1/issue/SCO-49));
  the packing analysis targets ~Ø100 mm × 110–130 mm, within the historical ~4-inch PVC
  reference form factor.

- The lid shall use a static face seal with all fasteners outside the O-ring boundary.

- Internal layout shall remain modular to simplify maintenance and future revisions.

- Components shall be securely mounted to withstand wave action and transportation.

#### Marine Environment

The buoy is intended for long-term deployment in a marine environment.

The design shall account for:

- Saltwater exposure — sealed volumes, 316 stainless fasteners, corrosion strategy on
  [SCO-92](https://linear.app/scout1/issue/SCO-92)

- Humidity — internal temp/humidity sensor for state-of-health

- Corrosion

- Biofouling — Sea Hawk Smart Solution copper-free antifouling coating

- UV exposure — PETG for the build, ASA documented for production

- Temperature variation

#### Reef Safety

Per [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md): anchoring shall not place
hardware on coral; the mooring line shall have swing clearance that prevents it dragging on the
reef; no copper-based antifouling (toxic to coral).

### Electrical Constraints

#### Low Average Power

The system shall minimize average daily power consumption through aggressive power management.

This is achieved by:

- Deep Sleep as the default operating state

- Load-switching high-power peripherals

- Ultra-low quiescent current regulators

- Event-driven firmware

#### Voltage Rails

The architecture is constrained to two regulated rails:

- 3.3 V digital rail

- Switched 5 V measurement rail

Future hardware additions should utilize these rails whenever practical.

### Storage Constraint

#### DC-001 — Audio Storage Capacity

Current mission profile:

- 16 kHz

- 16-bit PCM

- Mono

- Three 60-second recordings/day

- Approximately 30-day retention

This configuration fits within the selected 256 MB flash memory.

Changes to any of the following require storage re-evaluation:

- Sample rate

- Bit depth

- Recording duration

- Number of recordings

- Retention period

### Communication Constraints

Current LoRa configuration is optimized for:

- Up to ~2 km line-of-sight range (RFM95 upper figure with a tuned antenna; real over-saltwater range with a low buoy antenna will be lower and is pending the Phase 4 measurement)

- Low energy consumption

- One transmission per day

Increasing transmission frequency or payload size will require a revised power budget.

### Firmware Constraints

The firmware architecture assumes:

- Event-driven execution

- Deterministic scheduling

- No operating system

- Sequential task execution

- No concurrent sensor acquisition

### Expandability Constraints

Future sensors may be added provided they do not exceed:

- Available GPIO

- Available flash capacity

- Battery energy budget

- Solar charging capability

- Mechanical packaging volume

Any significant subsystem addition shall trigger a review of:

- Power budget

- Battery sizing

- Solar sizing

- Mechanical layout

- Firmware scheduling

### Validation Constraints

The following sections remain preliminary until prototype testing is complete:

- Daily energy budget

- Battery sizing

- Solar sizing

- Long-term storage validation

- Environmental durability

Prototype testing shall supersede analytical estimates where discrepancies exist.

## 20. Future Improvements

### Purpose

This section identifies potential enhancements that were intentionally excluded from S.C.O.U.T. v1.0 to maintain simplicity, reduce development risk, and accelerate prototype completion.

### Firmware Enhancements

Potential future firmware improvements include:

- Adaptive sampling intervals

- Battery-aware duty cycling

- Adaptive recording schedules

- Audio event detection

- Data compression

- Scheduled self-diagnostics

- Automatic fault recovery improvements

- Remote configuration through LoRa

- OTA firmware updates (if future communications architecture permits)

### Communications Enhancements

Possible future upgrades include:

- Automatic retransmissions

- Packet acknowledgements

- Downlink commands

- Remote parameter updates

- Multi-hop networking

- Mesh networking

- Increased telemetry frequency

- Compression of transmitted sensor data

### Sensor Enhancements

Potential future sensors include:

- Dissolved oxygen

- pH

- Salinity

- Conductivity

- Pressure / depth

- Light intensity (PAR)

- Chlorophyll

- Additional hydrophones

- Water velocity

- IMU for buoy motion characterization

Each additional sensor shall undergo independent review for:

- Mechanical integration

- Electrical compatibility

- Firmware complexity

- Energy consumption

### Mechanical Improvements

Potential future revisions include:

- **Multi-depth sensor string** — distributing sensor pods vertically to sample stratification,
  deferred from v1 per [ADR-0003](../decisions/0003-single-point-sensing.md). The v1 pod is
  deliberately designed to make this cheap to add later — see
  [`sensor-string-architecture.md`](sensor-string-architecture.md).

- ASA (or injection-molded) enclosure components for a production run

- Improved modular sensor pods

- Enhanced cable management

- Tool-less service access

- Improved anti-biofouling features

- Alternative mooring configurations

- Integrated lifting features

- Simplified manufacturing

### Power System Improvements

Future power improvements may include:

- Higher-efficiency solar panels

- Dynamic MPPT optimization

- Larger battery options

- Additional battery monitoring

- Energy-aware scheduling

- Seasonal operating profiles

- Redundant charging paths

### Data Management Improvements

Potential future storage enhancements include:

- Lossless audio compression

- Intelligent event-based recording

- Automatic storage optimization

- Metadata indexing

- Improved diagnostic logging

- Selective audio retention

### Research Opportunities

S.C.O.U.T. provides a foundation for future work in:

- Coral reef soundscape analysis

- Machine learning classification of reef health

- Long-term environmental monitoring

- Low-power autonomous marine sensing

- Distributed reef monitoring networks

- Autonomous ecological anomaly detection

### Design Philosophy for Future Revisions

Future revisions should continue to prioritize:

1.  Simplicity.

2.  Low power consumption.

3.  Modularity.

4.  Reliability.

5.  Ease of manufacturing.

6.  Ease of maintenance.

7.  Scientific usefulness.

New features should only be incorporated if they provide measurable value without significantly increasing system complexity or reducing deployment reliability.

## 21. Verification & Test Plan

### Purpose

The objective of the verification and testing phase is to validate that the S.C.O.U.T. system performs as designed and that all engineering assumptions made during development are either confirmed or revised based on measured data.

Testing shall progress from individual components to fully integrated field deployments.

### Phase 1 — Electrical Bench Testing

#### Objectives

- Verify all regulated voltage rails.

- Measure quiescent current.

- Verify battery charging.

- Verify power sequencing.

- Validate all load switches.

#### Acceptance Criteria

- 3.3 V rail within regulator specification.

- 5 V rail within regulator specification.

- No excessive voltage ripple.

- All switched peripherals power on and off correctly.

- No unexpected current draw.

### Phase 2 — Sensor Validation

#### Temperature Sensors

Verify:

- Correct sensor detection.

- Temperature accuracy.

- Repeatability.

- Waterproof integrity.

#### Turbidity Sensors

Verify:

- Stable analog output.

- Repeatability.

- Power-up stabilization time.

- Response to varying turbidity.

#### Hydrophone

Verify:

- Correct bias voltage.

- Clean audio waveform.

- Noise floor.

- Frequency response.

- Recording quality.

### Phase 3 — Storage Validation

Verify:

- Flash initialization.

- Sequential write operation.

- Read reliability.

- Data integrity after reset.

- Circular buffer operation.

- Long-duration recording.

Acceptance Criteria:

- No corrupted recordings.

- No unexpected data loss.

- Continuous recording for at least the intended retention period.

### Phase 4 — Communications Testing

Verify:

- LoRa initialization.

- Successful packet transmission.

- Packet reception.

- CRC validation.

- Packet timing.

- Daily transmission scheduling.

Field Tests:

- Short-range communication.

- Line-of-sight operation.

- Real deployment environment.

### Phase 5 — Power Validation

Measure:

- Deep Sleep current.

- Temperature event current.

- Turbidity event current.

- Audio subsystem current.

- Flash write current.

- LoRa transmission current.

- Total daily battery energy consumption.

These measurements will replace the analytical estimates used in the preliminary power budget.

### Phase 6 — Mechanical Validation

Full test records are in [`mechanical/test/`](../../mechanical/test/README.md).

**Completed:**

- LC2–LC9 + service-case FEA (Fusion, custom PETG profile) — buoy structure passes every case,
  min SF 10–1450 (2026-08-29/30, on the v4 geometry).
- First bench submersion test (2026-08-24) — PLA + TPU O-ring passed ~30 hr; a low-quality PETG
  print and the electronics housing (no bolt-joint sealing washers on the article) failed.
- Closed-form wedge wall-thickness check (2026-09-07) — outer 0.095 in / sides 0.063 in accepted.
- Full slicer weigh-in of the v4 flotation parts (2026-08-24).

**Owed (tracked):**

| Test | Purpose | Issue |
|---|---|---|
| Assembly-level ring-buckling FEA | Confirm the epoxied 6-wedge ring unaided by foam | [SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| Impact / boat-strike — FEA + bench on printed samples | The design's stated validation target (impact survivability at controlled cost) | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Stability — CG/CB/GM, righting arm, one-wedge-loss list | Confirm the buoy self-rights and the resize lowered CG | [SCO-80](https://linear.app/scout1/issue/SCO-80) |
| v5-geometry FEA re-run | The 2026-08-29 runs were on v4 | [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| Final 316 pad-eye interface FEA (with LC7 moment) | Sign off the mooring load path | [SCO-69](https://linear.app/scout1/issue/SCO-69) |
| Electronics-housing clamp reprint + submersion re-test | Validate the static face seal to the current design | [SCO-105](https://linear.app/scout1/issue/SCO-105), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| Integrated waterproof + proof-load + tilt test | System-level mechanical validation | [SCO-82](https://linear.app/scout1/issue/SCO-82) |
| Foam-fill manufacturing trials on sacrificial wedges | De-risk the pour process | [SCO-76](https://linear.app/scout1/issue/SCO-76) |

**Environmental tests:** splash, submersion, vibration, UV exposure, saltwater exposure, coating
adhesion / durability ([SCO-78](https://linear.app/scout1/issue/SCO-78)).

### Phase 7 — Integrated System Testing

Operate S.C.O.U.T. continuously under representative conditions.

Verify:

- Autonomous scheduling.

- Continuous operation.

- Battery charging.

- Daily LoRa transmission.

- Correct sensor operation.

- Stable firmware.

- No unexpected resets.

### Success Criteria

The system shall be considered validated when it:

- Operates autonomously.

- Successfully collects all scheduled measurements.

- Successfully stores all required data.

- Successfully transmits the daily summary.

- Maintains positive battery energy balance under expected operating conditions.

- Completes long-duration testing without critical failures.

## 22. Complete Bill of Materials (BOM)

### Purpose

This Bill of Materials identifies the primary hardware required to construct one S.C.O.U.T. prototype.

### Electronics

| **Qty** | **Component** | **Manufacturer** | **Part Number** | **Purpose** |
|----|----|----|----|----|
| 1 | Microcontroller | Espressif | ESP32-C3 | Main controller |
| 1 | LoRa Transceiver | Semtech | SX1262 | Wireless communications |
| 1 | MPPT Charger | Texas Instruments | BQ25570 | Solar charging and energy harvesting |
| 1 | 3.3 V Buck Regulator | Texas Instruments | TPS62840 | Digital power rail |
| 1 | 5 V Boost Regulator | Texas Instruments | TPS61299 | Measurement power rail |
| 2 | Load Switch | Texas Instruments | TPS22916 | Switched peripheral power |
| 1 | Audio ADC | Texas Instruments | PCM1808 | Audio digitization |
| 1 | QSPI Flash Memory | Winbond | W25Q02JV | Onboard data storage |

### Sensors

| **Qty** | **Component** | **Manufacturer** | **Part Number** | **Purpose** |
|----|----|----|----|----|
| 1 (+2 spare) | Temperature Sensor | Analog Devices / Maxim | DS18B20 | Water temperature — 1 deployed, 2 spares (ADR-0003) |
| 1 (+2 spare) | Turbidity Sensor | DFRobot | SEN0189 | Water turbidity — 1 deployed, 2 spares (ADR-0003) |
| 1 | Hydrophone | Aquarian Audio | H2dM | Underwater acoustics — part number pending ECE decision |

### Power System

| **Qty** | **Component**   | **Purpose**           |
|---------|-----------------|-----------------------|
| 1       | Solar Panel     | Primary energy source |
| 1       | LiFePO₄ Battery | Energy storage        |

### Mechanical Components

Printed parts are in-house PETG unless noted. Quantities are per buoy.

| **Qty** | **Component** | **Material / part** | **Purpose** |
|---|---|---|---|
| 1 | Electronics chassis (Ø5.75 in × 8.5 in, v5) | Printed PETG | Sealed electronics enclosure |
| 1 | Chassis lid + face-seal clamp | Printed PETG | Serviceable top closure, static face seal |
| 6 | Flotation wedge shell (5.5 in, v5) | Printed PETG | Buoyancy / structural ring |
| 6 | Wedge bottom (impact cap) | Printed PETG | Waterline impact protection |
| 6 | Wedge cap | Printed PETG | Seals the foam cavity |
| 1 | Chassis cap | Printed PETG | Covers the chassis stub, foam overflow trim |
| 1 | Sensor stem | Printed PETG | Suspends the sensor pod below the hull |
| 1 | Sensor pod (dry + flood chamber) | Printed PETG | Turbidity sensor housing |
| 1 | Solar-panel mount (4-arm bracket + ring) | Printed PETG | Solar panel mast |
| ~2 kits | Flotation foam | US Composites #0204, 2 lb/ft³ closed-cell rigid PU pour foam | Buoyancy + structural backing + flood redundancy |
| 1 | O-ring, chassis lid | AS568-043, silicone | Lid face seal |
| 1 | O-ring, sensor pod | AS568-137, silicone | Pod face seal |
| ~2–3 | Cable glands | Marine, sized to the sensor/antenna cable | Waterproof cable entry |
| ~60 | Heat-set inserts | Brass, M4 | Fastener anchors in printed parts |
| ~75 | Bolts + washers + nuts | 316 stainless, M4 | Wedge/lid/pad-eye fastening |
| 1 | Mooring pad-eye | 316 stainless, through-bolted (part TBD — [SCO-69](https://linear.app/scout1/issue/SCO-69)) | Buoy mooring attachment |
| 1 | Mushroom anchor | Cast iron (unmarked sites only) | Station keeping — sited off-coral (ADR-0004) |
| — | Mooring line | 3-strand twisted nylon, 3/8 in; scope length TBD ([SCO-17](https://linear.app/scout1/issue/SCO-17)) | Compliant mooring; fouls a propeller rather than being cut |
| ~1 pint | Antifouling coating | Sea Hawk Smart Solution (copper-free, Econea) | Biofouling mitigation |
| — | Marine epoxy | 2-part | Wedge radial seams, cap bonds, insert potting |

Wedge and chassis wall/infill spec: [`print-settings.md`](buoy-structural/print-settings.md).

### Passive Components

The PCB also includes standard passive and support components, including:

- Decoupling capacitors

- Bulk capacitors

- Pull-up and pull-down resistors

- Bias resistors

- Inductors (for switching regulators)

- Crystal or oscillator (if required)

- Connectors

- Test points

- Programming header

- ESD protection (recommended)

- Reverse-polarity protection (recommended)

These components shall be selected during schematic capture based on manufacturer reference designs and PCB layout requirements.

### Procurement Notes

Whenever practical:

- Purchase components from authorized distributors.

- Match manufacturer-recommended reference designs.

- Verify package compatibility before PCB layout.

- Maintain alternate suppliers for long-lead components.

### Revision History

| **Version** | **Description** |
|----|----|
| v0.1 | Initial engineering design document generated from architecture development and design review. |
| v0.2 | Wordmark standardization, PR-governance/conventions alignment, ADR-0001 platform note (Feather M0 build target vs. ESP32-C3 production target), electronics-housing dimensions marked TBD. |
| v0.3 (2026-09-09) | **Mechanical architecture (§4) fully reconciled** against the 2026-08-14 → 2026-09-09 detailed design and analysis: six-wedge bolted flotation (v5 geometry), foam-filled epoxied monocoque ring, buoyancy/freeboard model, static face-seal lid, reef-safe mooring + 316 pad-eye, LC1–LC9 structural framework + FEA results, waterproofing strategy, materials/manufacturing, biofouling. Mechanical touchpoints updated in §§1–3, 18, 19, 21, 22. Electrical/power/sensor/audio/comms/firmware/storage sections (§§5–17, 20) still pending the same pass — owners ECE/CSEN. |
| v1.0 (Planned) | Updated after prototype construction, laboratory validation, measured power budget, battery sizing, and field testing. |

### Document Conclusion

This document defines the baseline architecture for the S.C.O.U.T. autonomous reef monitoring buoy. It captures the current mechanical, electrical, firmware, sensing, storage, communications, and power-system design decisions, along with the assumptions and constraints used to reach them.

The next major milestone is prototype implementation and validation. Measured performance data will be used to refine the preliminary analytical models, replace estimated power values with experimental results, and finalize battery and solar sizing for long-duration deployment.

S.C.O.U.T. v1.0 is intended to serve as a modular, low-power, and extensible platform capable of supporting future research in autonomous coral reef monitoring while providing a clear engineering foundation for future revisions.
