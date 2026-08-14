# ADR-0002 — LiFePO₄ Charging Path on the Feather M0

- **Status:** 🟡 Open — decision not yet made
- **Date raised:** 2026-08-14
- **Owners:** ECE lead (hardware); CS lead consulted on battery-voltage telemetry
- **Blocks:** power subsystem bench bring-up (Phase 2), battery/solar sizing validation,
  firmware battery-voltage thresholds

---

## Context

[ADR-0001](0001-mcu-and-radio-selection.md) confirmed the **Adafruit Feather M0 + RFM95
(Adafruit 3178)** as the build platform. That decision surfaced a battery-chemistry conflict
that now needs its own record.

- The Feather M0's **onboard charger is an MCP73831**, a single-cell **Li-ion/LiPo** charger
  with a **4.2 V** float voltage. The board's JST battery connector and `BAT` pin are wired
  directly to that charger.
- The [Engineering Design Document §16](../engineering/engineering-design-document.md)
  specifies **LiFePO₄** (lithium iron phosphate) for cycle life, thermal tolerance, and marine
  safety. A LiFePO₄ cell is **~3.2 V nominal and ~3.65 V maximum**.

Charging a 3.65 V-max LiFePO₄ cell from a 4.2 V LiPo charger **overcharges it** — unsafe and
destructive to the cell. The Feather's built-in charging path and the specified battery
chemistry are therefore incompatible without intervention. This must be resolved before the
power subsystem is integrated on the bench (Phase 2).

## Options

### Option A — Switch the battery to LiPo, use the Feather as designed

**Pros**
- Zero extra hardware; the onboard MCP73831 charger and USB charging "just work".
- Simplest possible bring-up; matches every Feather tutorial and example.

**Cons**
- Abandons the LiFePO₄ advantages the EDD chose it for: longer cycle life, wider temperature
  tolerance, and better safety margin for a sealed, long-deployment marine enclosure.
- LiPo is less tolerant of the heat inside a sun-exposed surface buoy.

### Option B — Keep LiFePO₄, bypass the onboard charger, feed a regulated rail into `3V3`

**Pros**
- Preserves the EDD's chosen chemistry and its deployment-life rationale.
- Cleanest separation: a dedicated LiFePO₄ solar charge controller (+ MPPT, per EDD §17)
  charges the cell; a buck/LDO regulates the pack down to a clean 3.3 V fed into the Feather's
  **`3V3` pin**, leaving the onboard charger and `BAT` path entirely unused.

**Cons**
- Extra parts and board area (charge controller + regulator).
- Powering via `3V3` bypasses the Feather's own 3.3 V regulator — the external regulator must
  be sized for peak load (LoRa TX current) with margin.
- Battery-voltage telemetry can no longer be read from the Feather's `BAT`/A7 divider; it must
  be sensed on the LiFePO₄ pack directly through a divider to a spare ADC pin.

### Option C — Keep LiFePO₄, external charger, power the Feather through `USB`/5 V

**Pros**
- Keeps LiFePO₄; the Feather runs from a regulated 5 V (external boost) into `USB`, so its
  onboard 3.3 V regulator still does the final regulation.

**Cons**
- Two conversion stages (pack → 5 V boost → onboard 3.3 V buck) waste power in an
  energy-constrained system — the opposite of the EDD's low-power intent.
- The onboard charger is still physically present on `BAT`; care needed to ensure nothing is
  ever connected to it.

## Decision

**Not yet made.** To be resolved by the ECE lead during Phase 1–2 power bring-up. Option B is
the presumptive direction because it preserves the EDD's chemistry choice with the least
wasted energy, but this needs to be confirmed against the actual charge-controller part and
measured quiescent draw.

## Consequences

- Battery and solar sizing ([EDD §16–17](../engineering/engineering-design-document.md)) cannot
  be finalized until the chemistry and charge path are fixed.
- The firmware **battery-voltage thresholds** (the "skip TX below threshold" logic in the
  [Team Timeline](../planning/team-timeline.md) Phase 2, and SoH telemetry) depend on the final
  pack voltage and where voltage is sensed. The 11.8 V figure in the timeline assumes a
  higher-voltage pack and must be revisited once the pack configuration is set.
- If Option A is chosen, several EDD sections that justify LiFePO₄ need a note that the build
  platform uses LiPo instead.

## Open questions

1. Single LiFePO₄ cell, or a multi-cell pack? This sets the regulator topology and the
   firmware voltage thresholds.
2. Which solar charge controller supports LiFePO₄ + MPPT at this scale? (EDD §17 assumed the
   TI BQ25570 on the production PCB — is an off-the-shelf module preferred for the build?)
3. Where is battery voltage sensed, and through what divider, so SoH telemetry stays accurate?

## References

- [ADR-0001 — MCU and Radio Selection](0001-mcu-and-radio-selection.md) — where this conflict
  was first surfaced (open question 4)
- [Engineering Design Document §16 Battery Sizing, §17 Solar Sizing](../engineering/engineering-design-document.md)
- [`hardware/README.md`](../../hardware/README.md) — Open items
- Adafruit Feather M0 charging documentation (MCP73831); LiFePO₄ cell charge profile (3.65 V max)
