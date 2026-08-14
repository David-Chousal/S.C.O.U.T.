# MVP System Overview & Framework

> **Summary** — Defines the SCOUT minimum viable product: mission, sensing payload, power strategy, communications, mechanical design, and shore station.
>
> **Source document** — `Project Description/Subsections, and MVP.docx`

---

**Team** — Isabella Rodriguez (ECEN, Hardware Lead) · John Ryan Myrdal (GENG, Mechanical / Field) · David Chousal Cantu (CSEN, Software)

**Institution** — Santa Clara University · Senior Design Project · Academic Year 2026–2027

---

**https://github.com/irodriguez-17/SCOUT**

Last Updated: May 2026

## Project Vision

S.C.O.U.T. is a **small, solar-powered, modular marine buoy system** for **long-term shallow-water coral reef monitoring**. Deployed adjacent to reefs, it collects environmental data indicative of reef health.

**Design priorities:**

- Affordable

- Durable

- Low power

- Scalable (many buoys, many locations globally)

- Modular (future sensing applications)

- Minimal maintenance

- Small, visually simple form factor

**Long-term vision:** A global reef monitoring network with many SCOUT buoys deployed across reef systems.

## Primary Mission (MVP)

Deploy a **solar-powered buoy adjacent to coral reefs** that:

- Records reef-relevant environmental data

- Operates autonomously for **1+ year deployments**

- Conserves energy via sleep/wake cycling

- Wirelessly transmits data to a **shore-side base station**

- Enables reef-health monitoring and statistical analysis

## MVP Data Collection

### 1. Temperature Sensor (Required)

**Purpose:** Monitor reef stress and bleaching risk.
**Why:** Coral bleaching strongly correlates with prolonged elevated temperature.
**Sampling:** ~Every **30–60 minutes** (very low power).

### 2. Water Quality Proxy (Required - At Least One)

**Option A: Turbidity**

- Measures suspended particles / water clarity

- Indicates sedimentation, runoff, storm disturbance, poor reef conditions

- Suggested sampling: **1–4 times/day**

**Option B: Light**

- Measures photosynthetically available light

- Important for coral symbiotic algae health

- Suggested sampling: **1–4 times/day**

**Current recommendation:** **Temperature + Turbidity**, with light added if feasible.

### 3. Hydrophone / Acoustic Monitoring (Optional / Stretch Goal)

**Purpose:** Record reef soundscapes.
**Why:** Reef acoustic signatures vary with biodiversity, reef health, and stress.

**Approach:**

- Short recordings at periodic intervals

- Shore-side filtering removes:

  - Boat noise

  - Wave noise

  - Environmental interference

**Potential value:**

- Baseline reef sound signatures

- Long-term acoustic health trends

**Status:** High value, but higher scope and complexity.

## Power System

### Design Philosophy

Ultra-low-power operation through intelligent duty cycling.

**Operating logic:**

- Sleep most of the time

- Wake to record data

- Store locally

- Return to sleep/charge

- Periodically transmit to shore

### Energy Resilience Strategy (Cloudy Periods)

System priorities:

1.  Maintain core operation

2.  Reduce transmission frequency

3.  Continue local data storage

4.  Pause nonessential sensing if battery becomes critical

5.  Resume normal operation after recharge

### Proposed Components

- Solar panel

- Rechargeable battery

- Charge controller

- Power monitoring system

- Low-power embedded controller

**Likely battery:** **LiFePO4 (Lithium Iron Phosphate)** for lifespan, durability, safety, and common marine use.

## Embedded Electronics & Control

### Proposed Control Logic

**Sleep → Wake → Record → Store → Battery Check → Transmit if power sufficient → Sleep**

If low power:

- Delay transmission

- Continue energy conservation

### Hardware Direction

> **Update (2026-08-14):** the platform is now decided in
> [ADR-0001](../decisions/0001-mcu-and-radio-selection.md). The confirmed build platform is
> the **Adafruit Feather M0 + RFM95 LoRa (Adafruit 3178)** with an **Adalogger FeatherWing
> (Adafruit 2922)**. The ESP32-based direction below is retained as the *future
> production-PCB* target (ESP32-C3 + SX1262), not the platform being built for the capstone.

**ESP32-based system (original recommendation — now the production target)**

**Why:**

- Strong low-power sleep modes

- More capable than standard Arduino

- Well suited for IoT sensing

- Modular sensor integration

**Responsibilities:**

- Sensor management

- Sleep scheduling

- Battery monitoring

- Power optimization

- Local data logging

- Radio communication

## Communications System

### Primary Method — LoRa Radio

**Why:**

- Very low power

- Long range

- Reliable for small environmental data packets

- Well-suited for autonomous sensing systems

**Current assumptions:**

- Design range: **~2 km line of sight** (RFM95 upper figure with a tuned antenna, per the
  Adafruit RFM9x range FAQ; expect less over saltwater with a low buoy antenna — to be
  measured in the Phase 4 range test)

- Direct line of sight to shore

- No dependence on internet or cellular

**Key concern:** Saltwater RF interference requires testing/validation.

## Mechanical / Marine Design

### Deployment Conditions

- Fixed mooring

- **2–8 meter max depth**

- Buoy remains at surface

### Geometry

**Shape:**

- Cylindrical at waterline

- Tapers downward to mooring attachment

- Tapers upward toward antenna

**Purpose:**

- Stability

- Reduced drag

- Clean/elegant appearance

- Functional solar + antenna integration

### Sensor Placement

- Mounted beneath buoy **or**

- Suspended lower on anchor/mooring chain

Placement determined by:

- Data quality

- Depth performance

- Reliability

### Requirements

Must be:

- Waterproof

- Storm resistant

- Biofouling resistant

- Serviceable

- Reef-safe

**Anchoring:** Long-term stability with minimal reef disturbance.

## Shore-Side Base Station

### Purpose

Receive and process buoy data.

**Likely hardware:** Raspberry Pi receiver system.

**Responsibilities:**

- LoRa reception

- Local storage

- Basic statistical processing

- Quantitative sorting/organization

**Future additions:**

- Cloud upload

- Dashboards

- ML/data analysis

- Multi-buoy network management

## Overall System Architecture

1.  **Environmental Sensing:** Temperature, turbidity/light, optional hydrophone

2.  **Embedded Control:** Sleep/wake, sensing, battery management, storage

3.  **Power:** Solar, battery, charge control, optimization

4.  **Communications:** LoRa buoy-to-shore transmission

5.  **Marine Housing:** Waterproof buoy, mooring, anti-fouling, storm survivability

6.  **Shore Station:** Raspberry Pi, storage, analytics, future cloud/ML

## Long-Term Vision

A **globally scalable reef monitoring platform** supporting:

- Coral reef conservation

- Long-term environmental monitoring

- Reef restoration

- Researchers

- NGOs

- Resorts/coastal stakeholders

- Governments

**Goal:** Make reef monitoring affordable, continuous, modular, and globally scalable.
