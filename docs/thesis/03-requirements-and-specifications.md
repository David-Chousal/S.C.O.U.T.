# Chapter 3: Requirements and Specifications

> **Summary** — Working draft of thesis chapter 3, Requirements and Specifications. Write here; the structure follows
> [Thesis Outline](../planning/thesis-outline.md). Status: not started.

**Source material in the repo:** docs/hub/facts.md, docs/planning/ (requirements and benchmarks), docs/research/hawaii-deployment-permitting.md

---

## 3.1 Stakeholders and Needs

_Draft here._

## 3.2 System Requirements and Specifications

_Placeholder: Table: Requirements, specifications, and verification methods_

_Draft here._

## 3.3 Design Environment and Load Definition

**Why it was done.** Every structural, buoyancy and stability check needs the same worst case, or the results cannot be
compared. The environment was fixed once and signed off on 2026-09-08
([Appendix C.1.1](appendix-c-calculations.md#c11-design-environment)).

| Parameter | Survival value | Basis |
|---|---|---|
| Water depth | 2.0 m | Shallowest routine depth, which gives the highest wave orbital velocity at the buoy |
| Wave height / period | 1.2 m / 6 s | Depth-limited (H/d about 0.6, below the 0.78 breaking limit) |
| Current | 0.8 m/s | Reef-flat tidal and wind-driven flow |
| Wind | 22 m/s (about 43 kt) | Strong gale; the buoy is recovered ahead of a forecast hurricane |
| Design pressure | 50.3 kPa | 5 m of seawater, the pressure target for every seal |

**How it changed the design.** These inputs became nine load cases (LC1 to LC9) whose governing horizontal case, wave
plus current, is about 330 N on the v5 wedge design. The cases set the wall thickness, the foam requirement, the pad-eye
and bolt sizing and the mooring attachment height (see [5.1](05-detailed-design-and-implementation.md#51-mechanical-design)).

## 3.4 Constraints

_Draft here._

### 3.4.1 Technical and Economic Constraints

_Draft here._

### 3.4.2 Environmental and Regulatory Constraints

- **Reef-safe by rule.** Nothing may anchor on coral, and the copper antifouling products were ruled out because copper is
  toxic to coral at low concentrations (decision of 2026-08-18; the toxicity claim still needs a citation).
- **Permitting.** Nobody on the team holds a permit that covers a moored buoy, and any seabed anchor or stay of more than a
  few days brings in the Army Corps of Engineers and the state. This is why the chosen route is to connect to an
  already-authorized structure rather than anchor our own ([9.6](09-professional-issues-and-societal-impact.md#96-legal-and-regulatory-compliance)).
- **Radio.** The buoy and shore LoRa links are held to FCC 47 CFR 15.247 (500 kHz bandwidth, 11.6 dBm, 2.15 dBi antenna).

### 3.4.3 Ethical and Social Constraints

_Draft here._
