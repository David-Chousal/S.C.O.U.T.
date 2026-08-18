# State Snapshot — 2026-08-17 (Floatation & FEA)

> **Summary** — Second dated snapshot for 2026-08-17 — see also
> [2026-08-17.md](2026-08-17.md) (O-rings, mooring approach) and the SCOUT Weekly entry in
> [meeting-notes.md](../../planning/meeting-notes.md). Snapshots are append-only history; the
> always-current view is [`status.md`](../status.md).
>
> Part of the [Knowledge Hub](README.md).

---

**Phase:** 0 — Kickoff (2026-08-14 – 2026-09-04)

## Where the project stands

Mechanical design (John Ryan, `geng`) chose the final floatation family — the bolted wedge
variant with bottom caps — and ran the first structural FEA pass on it. This session also
corrects a same-day meeting summary that predated the bottom caps and overstated a provisional
FEA pass/fail criterion as an established target.

## Changed today

- **Floatation family chosen**: bolted wedge variant (heat-set inserts + bolts, no snap/keyhole
  locking) over the snap/keyhole Master V3 and Outer Octagon. New bottom caps under each wedge
  (gyroid infill, many wall layers) for impact protection; foam fill and surfboard-stringer-
  inspired radial webs carry over. Chosen after this morning's print test found integrating the
  bottom caps into the snap/keyhole body broke its previously-working keyhole slide-in function
  — see [mechanical/cad/floatation/README.md](../../../mechanical/cad/floatation/README.md#bolted-variant-chosen--2026-08-17).
- **First FEA pass**: Autodesk Fusion static-stress study, 300 N side load on the floatation +
  bottom caps, ABS material properties. Minimum safety factor 25.4 against an SF≥4 check used
  only for this study — not yet a validated target. Full record:
  [mechanical/test/fea-floatation-side-load-2026-08-17.md](../../../mechanical/test/fea-floatation-side-load-2026-08-17.md).
- **Corrected a same-day record**: the 2026-08-17 SCOUT Weekly meeting summary in
  [decision-log.md](../decision-log.md) and [meeting-notes.md](../../planning/meeting-notes.md)
  recorded the bolted+foam choice but predates the bottom caps and stated the safety-factor
  figure without the provisional-target caveat. `decision-log.md`, `facts.md`, and
  `design-notes.md` now carry the complete, corrected version from the mechanical lead
  directly; the historical meeting-note entry is left as-is (an accurate record of what was
  reported at the meeting itself).
- **Two new Linear issues filed**: [SCO-68](https://linear.app/scout1/issue/SCO-68) (chassis
  top section — sealing + service-access port, explicitly requested this session) and
  [SCO-69](https://linear.app/scout1/issue/SCO-69) (mooring/sensor-string attachment hardware —
  leading candidate is a stainless U-bolt + mounting plate, not yet designed).

## Still blocking

1. LiFePO₄ charging path ([SCO-10](https://linear.app/scout1/issue/SCO-10))
2. Hydrophone part number ([SCO-8](https://linear.app/scout1/issue/SCO-8))
3. Housing dimensions ([SCO-49](https://linear.app/scout1/issue/SCO-49)) — now also blocks the
   remaining floatation acceptance criteria on [SCO-48](https://linear.app/scout1/issue/SCO-48)
   and the new chassis top-section task ([SCO-68](https://linear.app/scout1/issue/SCO-68))
4. Print material — PETG default, ABS/ASA under evaluation
   ([SCO-64](https://linear.app/scout1/issue/SCO-64))
