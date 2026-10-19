# System Block Diagram

> **Summary** — One drawing of the whole S.C.O.U.T. system, SCOUT-S-000 Rev A (2026-10-19):
> mechanical, electrical, firmware and data, tied together by numbered notes and interface tags.
> Sheet 1 is the master with everything on it; sheets 2–4 zoom into electrical, firmware and
> data, and mechanical, using the same section letters and note numbers.
>
> Owner: Isabella Rodriguez (ECEN). Mechanical content from John Ryan Myrdal's CAD and
> studies; firmware and shore content from David Chousal's code and docs. Companion to the
> [Electronics Drawing Set](electronics-drawing-set.md) (SCOUT-E-100 Rev B), which stays the
> wiring reference. **Preliminary, not for final build.**

---

## Files

| File | What it is |
|---|---|
| [`drawings/scout-system-block-diagram.html`](drawings/scout-system-block-diagram.html) | Source. Open in a browser; it scales to the window |
| [`drawings/scout-system-block-diagram.pdf`](drawings/scout-system-block-diagram.pdf) | Print edition, 4 pages at their real paper sizes |

## Sheets

| Sheet | Paper | Sections |
|---|---|---|
| 1 · Integrated system (master) | 36 × 24 in (ARCH D) | Everything below, plus a system-at-a-glance box (X) and all 47 notes |
| 2 · Electrical hardware | 22 × 17 in (ANSI C) | A block diagram · B controller stack side view · C battery pack · D power tree and daily budget · E pin map |
| 3 · Firmware, radio link and data | 22 × 17 in (ANSI C) | F state machine · G 24 h schedule and current profile · H 30-byte packet · J power modes · K data path · L software gaps · R build and test workflow |
| 4 · Mechanical and integration | 22 × 17 in (ANSI C) | M as-deployed section · N housing packaging option C · P seals and materials · Q mass and stability · R workflow · S interface register |

Print sheet 1 on a plotter at 100%; sheets 2–4 print on ANSI C or scale down to 17 × 11 in
(tabloid). Red numbered balloons point to the notes; purple `IF-n` tags point to the interface
register (section S), which ties each physical part to its pin and to what it becomes in
firmware and data.

## Sources

Repo `main` at `455f709` (2026-10-19, through PR #187): `firmware/src/config.h` and
`main.cpp`, the [Integration Runbook](integration-runbook.md), [Shore Station](shore-station.md),
[`facts.md`](../hub/facts.md), the
[Power Budget Update](power-budget-update-2026-10-05.md), the electronics-housing
[packaging README](../../mechanical/cad/electronics-housing/packaging/README.md) and the
[printed-float study](../../mechanical/simulations/buoy-stability/printed-float-tip-explorer/README.md).
Component values come from the Rev B drawing set.

## Inconsistencies found while drawing it

The drawing shows these as they are and flags them; none is resolved by the drawing. The first
four are rows in [open questions](../hub/research/open-questions.md).

- `facts.md` "Delivery scheme" row says the spreading factor stays SF7; `config.h` and every
  other row use SF12.
- The power budget counts 3 transmissions a day; the firmware sends 3 slots × 3 copies and keeps
  the MCU awake about 7.7 s per slot (about +0.16 mAh/day, about 1% of the budget).
- The housing flange has 6 bolts in the 2026-09-28 sizing and 8 bolts in the 2026-10-06 DFM
  drawing. The diagram follows the newer DFM drawing.
- The turbidity board's location (housing vs sensor pod) is still open; it was already listed.
- `purchase-log.md` lists the Mouser order as not yet placed; the runbook says those parts
  arrived 2026-10-16.
