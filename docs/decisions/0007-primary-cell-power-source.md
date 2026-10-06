# ADR-0007 — Deployment Power Source: Primary Li-SOCl₂ D Cell, No Solar

- **Status:** 🟡 Open — **working decision as of 2026-10-05**, pending Dr. Shoba Krishnan's
  review that day. Not final.
- **Date raised:** 2026-09-30 (Shoba and Dr. Wolfe suggested a long-life primary cell)
- **Owners:** ECE lead (Isabella Rodriguez); CS lead consulted on firmware sleep and cold boot
- **Blocks:** battery-bay dimensions ([SCO-49](https://linear.app/scout1/issue/SCO-49)),
  the electronics component list ([SCO-70](https://linear.app/scout1/issue/SCO-70)), firmware
  battery thresholds ([SCO-83](https://linear.app/scout1/issue/SCO-83)), and the power bench
  bring-up

---

## Context

[ADR-0002](0002-lifepo4-charging-path.md) asks how to charge LiFePO₄ from solar on the Feather
M0, and [ADR-0006](0006-rev-a-battery-chemistry.md) records the Rev A prototype's LiPo + PID 6106
path. Neither sizes the deployment battery against a real duty cycle.

The 2026-10-05 power budget ([Power Budget Update](../engineering/power-budget-update-2026-10-05.md))
does. It shows the board's sleep floor (≈ 501 µA, 90% of the draw) dominates, and the whole
system needs about 13.3 mAh/day without the hydrophone and about 30.3 mAh/day with it. That is
small enough for a single primary cell to cover a year, which would remove the panel, the
charger, and every part above the waterline.

## Options

### Option A — Solar + rechargeable (LiFePO₄ per ADR-0002, or LiPo per ADR-0006)

**Pros**
- No lifetime limit; room for more hydrophone recording.
- Sizing is easy: about 89 mW of panel and about 297 mAh of storage would cover the budget.

**Cons**
- More parts, a panel exposed to salt and fouling, a charger to design or buy.
- The PKCELL LiPo cannot charge above 45 °C.
- The double conversion loses about 40%.

### Option B — One primary Li-SOCl₂ D cell + power-gating (proposed)

**Pros**
- Sealed, no charger, nothing above the waterline.
- 3.6 V suits the onboard 3.3 V regulator (≈ 92% efficient).
- With a TPL5111 timer gating the EN pin, it lasts ≈ 16 months even in the pessimistic case.

**Cons**
- Hard lifetime limit.
- Cold boot every wake, so firmware must persist state.
- The Feather's onboard LiPo charger must be removed. Charging a primary cell is a fire hazard.

### Option C — Two primary D cells (fallback)

**Pros**
- Passes 12 months even without power-gating in the pessimistic case (≈ 14 months).

**Cons**
- ≈ 100 g more, and a bigger battery bay.
- Needs a factory parallel pack with diodes (series 7.2 V is too high).

## Decision

**Working decision (2026-10-05, not final):** Option B, with Option C as the fallback, and
12 months kept as the design target. Parts for the bench are ordered on 2026-10-05; the
hydrophone, solar panel and LiPo/PID 6106 path are **not** ordered. This ADR moves to 🟢 Accepted
only after Dr. Krishnan's review and a bench measurement of the sleep floor
([SCO-23](https://linear.app/scout1/issue/SCO-23)).

**Update 2026-10-06 (still working, not final):** the team now leans to **Option C — two D
cells in a parallel pack — with firmware standby** (the SAMD21 sleeps and wakes on its internal
RTC), and **no power-off timer** for the prototype. Standby + two cells passes 12 months even on
the pessimistic budget (≈ 14 months with the hydrophone) and needs no extra parts, wiring, or
cold-boot firmware. Power-gating (Option B) stays available as a later fallback. A check of the
Feather M0 schematic also corrected the gated floor from ≈ 20 µA to ≈ 55 µA (EN's 100k pull-up
adds 36 µA while held low). Bench parts were ordered 2026-10-06 without the TPL5111. See the
[Electronics Build and Test Plan](../engineering/electronics-build-and-test-plan.md).

If accepted, this ADR **supersedes ADR-0002** (no charging path is needed) and changes the
"solar-powered" description across the docs and the website.

## Consequences

- The Feather's charger IC is removed on the deployment board. The cell gets a one-way element,
  a fuse, and a keyed disconnect plug. Bench work uses a current-limited supply, not a cell.
- Firmware: radio sleep (not standby), sensor power pins default off, and state persisted
  across cold boots ([SCO-25](https://linear.app/scout1/issue/SCO-25),
  [SCO-98](https://linear.app/scout1/issue/SCO-98)).
- Per-sensor switching becomes V1-required ([SCO-87](https://linear.app/scout1/issue/SCO-87)).
- Battery telemetry thresholds move to a 3.6 V Li-SOCl₂ discharge curve, which is very flat, so
  voltage alone is a poor fuel gauge ([SCO-83](https://linear.app/scout1/issue/SCO-83)).
- The housing must fit one or two D cells, about 100 g each, with the vent facing away from the electronics
  ([SCO-49](https://linear.app/scout1/issue/SCO-49)).

## References

- [Power Budget Update — 2026-10-05 (Draft)](../engineering/power-budget-update-2026-10-05.md)
- [ADR-0002 — LiFePO₄ charging path](0002-lifepo4-charging-path.md)
- [ADR-0006 — Rev A battery chemistry](0006-rev-a-battery-chemistry.md)
- Adafruit Feather M0 Radio with LoRa guide (sleep current, EN pin, onboard charger warnings)
- Semtech SX1276 rev 4; Maxim DS18B20; DFRobot SEN0189 (see the update's datasheet table)
