# Chapter 4: Concept Development and Design Approach

> **Summary** — Working draft of thesis chapter 4, Concept Development and Design Approach. Write here; the structure follows
> [Thesis Outline](../planning/thesis-outline.md). Status: not started.

**Source material in the repo:** docs/decisions/, docs/hub/decision-log.md, docs/research/systems-decision-matrix.md, docs/engineering/engineering-design-document.md

---

## 4.1 Concept Generation

_Draft here._

## 4.2 Trade Studies and Selected Concept

_Placeholder: Table: Decision matrix for the flotation concept_

_Draft here._

### 4.2.1 Microcontroller and Radio

_Draft here._

### 4.2.2 Power System

_Draft here._

### 4.2.3 Flotation and Hull

**Concept and context.** The first concept was a ring of six bolted printed wedges, foam-filled, with a lead ballast arm.
The bolted variant (heat-set inserts and bolts) was chosen over the snap-and-keyhole Master V3 and an outer octagon, and
a damaged wedge can be replaced in the field.

**Iteration.** Analysis killed the concept in two steps. The buoy was found to be stable upside down (RR-11, 2026-09-29),
which needed a lead arm, and the thin walls needed foam to survive 5 m (RR-06). Lead is a possible permit objection and
foam sourcing was put on hold, so on 2026-10-14 to 10-16 the team moved to **a single printed float with no ballast, foam or
lead**. A mushroom-shaped float was also studied (2026-10-18 to 10-19, candidate N03: about 2.61 kg, 4.80 in draft, GM
2.29 in) but its two stability results are not yet reconciled.

**Result and impact.** The printed float is lighter (2.87 kg against 7.75 kg for v5), self-rights, and removes the
foam and lead supply questions. Calculations and results: [5.1.1](05-detailed-design-and-implementation.md#511-flotation-and-hull-structure)
and [5.1.4](05-detailed-design-and-implementation.md#514-stability-and-self-righting-ballast).

**Mooring and anchoring** ([ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md), 2026-08-17). A marked site
connects directly by line; an unmarked site gets one mushroom anchor placed next to, never on, coral. Since 2026-10-16 the
chosen route is to connect to a structure that already has authorization, which avoids a new seabed footprint.

### 4.2.4 Sensing Payload

_Draft here._

## 4.3 Concept of Operations

_Placeholder: Figure: Concept of operations_

_Draft here._

## 4.4 System-Level Architecture

_Placeholder: Figure: System-level block diagram_

_Draft here._

## 4.5 Risk Assessment

_Placeholder: Table: Risk register and mitigations_

_Draft here._
