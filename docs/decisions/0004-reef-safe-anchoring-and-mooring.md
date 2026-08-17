# ADR-0004 — Reef-safe anchoring and mooring approach

- **Status:** 🟢 Accepted
- **Date decided:** 2026-08-17
- **Owners:** John Ryan Myrdal (`geng`), confirmed by the team
- **Affects:** mechanical mooring hardware, deployment logistics (Phase 3–6), environmental
  compliance at the Hawaii site

## Context

[SCO-17](https://linear.app/scout1/issue/SCO-17) had been open since 2026-08-14 with no
approach chosen — flagged by a stakeholder (Oliver) as being as important as the sensors
themselves, since a poorly chosen mooring can physically damage the reef S.C.O.U.T. is meant to
monitor. [Stakeholder Interviews § Deployment and Anchoring](../research/stakeholder-interviews.md)
and [Open Questions](../hub/research/open-questions.md) both carried it as unresolved; the
[Systems Decision Matrix](../research/systems-decision-matrix.md) listed both "Mooring &
anchoring" and "Reef-safe anchoring strategy" as **Not started**.

Two site conditions need different handling: reefs with existing infrastructure (permitted
moorings, piles, reef markers) versus unmarked reef where the team must place ground tackle
itself. The unmarked case is the one with real reef-damage risk and needed a specific anchor
design chosen, not just a strategy.

## Decision

**Attachment method, by site:**
- **Marked sites** (existing mooring pile or reef marker present) — connect the buoy directly
  to the pre-existing mooring point or pile via line. No new ground tackle placed.
- **Unmarked sites** — deploy a single anchor.

**Anchor shape (unmarked sites): mushroom anchor.**
- Sets by vertical embedment in sand/rubble substrate rather than dragging to bite, unlike a
  fluke/Danforth anchor — the deployment motion itself cannot scrape adjacent coral.
- No moving parts to seize, corrode shut, or work loose over a 1+ year submerged deployment.
- Off-the-shelf and inexpensive, consistent with the project's [< $5,000 total cost
  ceiling](../hub/facts.md#mission-targets).
- Standard choice in NOAA-style reef eco-moorings for the same reason it's chosen here.
- **Alternative considered:** a helical (screw-in) anchor has a better holding-power-to-weight
  ratio and a smaller footprint, but requires a driving tool to install — added
  logistics for a small team working from a boat at a remote site, for no benefit at this
  buoy's scale. Worth revisiting only if anchor weight becomes a binding constraint.

**Anchor placement:** sited adjacent to coral, never on it, with enough swing radius that the
mooring line cannot drag across or agitate the reef through the tide/current cycle.

**Line material:**
- **Synthetic rope** (high-durability marine-grade) is the default for the mooring line.
- **Chain** is used instead in higher-turbulence, higher-wave-energy locations, where rope
  chafe/abrasion risk outweighs its lower weight and cost.

## Consequences

- Mechanical design work on `mooring/` hardware (not yet started in CAD) now has a concrete
  target: a mushroom anchor, swivel, and synthetic-rope (or chain, site-dependent) line —
  scoped for [SCO-17](https://linear.app/scout1/issue/SCO-17) and downstream CAD tasks in
  Phase 3–5.
- Deployment planning (Phase 5, Hawaii prep) can now site-survey against a defined decision
  rule: existing infrastructure → connect to it; unmarked → single mushroom anchor placed
  adjacent to (never on) coral with swing clearance.
- Does not resolve final line diameter, swivel/shackle hardware, or anchor weight/sizing —
  those are routine sizing decisions for the mechanical build, not architectural, and don't
  need their own ADR.
- If a future site's substrate can't take a mushroom anchor (e.g., hard pavement with no sand
  cover), this ADR does not cover that case and would need revisiting.

## References

- [SCO-17](https://linear.app/scout1/issue/SCO-17) — mechanical: choose a reef-safe
  anchoring/mooring approach
- [Stakeholder Interviews § Deployment and Anchoring](../research/stakeholder-interviews.md)
- [Systems Decision Matrix](../research/systems-decision-matrix.md)
- [Open Questions](../hub/research/open-questions.md)
