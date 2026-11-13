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

**How it changed the design.** These inputs became nine load cases (LC1 to LC9; LC1, slack-mooring catenary tension, remains unresolved because it is blocked on the mooring scope and line weight, so the mooring analysis is not complete) whose governing horizontal case, wave
plus current, is about 330 N on the v5 wedge design. The cases set the wall thickness, the foam requirement, the pad-eye
and bolt sizing and the mooring attachment height (see [5.1](05-detailed-design-and-implementation.md#51-mechanical-design)).

## 3.4 Constraints

_Draft here._

### 3.4.1 Technical and Economic Constraints

_Draft here._

### 3.4.2 Environmental and Regulatory Constraints

- **Reef-safe by rule.** Nothing may anchor on coral, and the copper antifouling products were ruled out because copper is
  toxic to coral at low concentrations (decision of 2026-08-18). Copper at 20 µg/L cut coral fertilization from about 93% to 41% ([Reichelt-Brushett and Harrison, 1999](https://doi.org/10.1016/S0025-326X(98)00183-0); see also [2005](https://doi.org/10.1007/s00338-005-0013-5)).
- **Permitting.** Nobody on the team holds a permit that covers a moored buoy. Any seabed anchor brings in the Army Corps of
  Engineers and the state, and a stay of more than a few days can too; each agency has to confirm its requirements in writing. This is why the chosen route is to connect to an
  already-authorized structure rather than anchor our own ([9.6](09-professional-issues-and-societal-impact.md#96-legal-and-regulatory-compliance)).
- **Radio.** The links are configured at 915 MHz, 500 kHz bandwidth and +11 dBm ([facts.md](../hub/facts.md)). The RFM95 modular grant (FCC ID 2ASEORFM95C) separately caps conducted power at 11.6 dBm and antenna gain at 2.15 dBi, and carries labeling, 20 cm separation and no-co-location conditions. 47 CFR 15.247 sets further requirements, including at least 500 kHz of bandwidth or frequency hopping.

### 3.4.3 Ethical and Social Constraints

_Draft here._
