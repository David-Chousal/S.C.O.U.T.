# ADR-0002 — Battery Chemistry

- **Status:** 🟡 Open — Rev A prototype decision made; final deployment chemistry and capacity not decided
- **Date raised:** 2026-08-18
- **Owners:** ECE lead
- **Blocks:** Final power budget, deployment battery sizing, enclosure battery-bay dimensions

---

## Context

The Engineering Design Document specifies a **3.2 V LiFePO₄** cell as the project's battery
chemistry, used throughout its BOM and power budget (EDD §15–17). [ADR-0001](0001-mcu-and-radio-selection.md)
noted that the Feather M0's *onboard* LiPo charger is not compatible with that chemistry.

Rev A's KiCad schematic (`hardware/schematics/scout-reva.kicad_sch`, reviewed against
manufacturer documentation, ERC-clean) does not use the Feather's onboard charger at all —
confirmed by direct inspection of the schematic source, which shows the Feather's BAT/VBAT pin
explicitly unconnected. Instead, Rev A's power architecture is:

1. FlexSolar 10 W panel, regulated 5 V USB output → `SOLAR_5V`
2. `SOLAR_5V` → **Adafruit bq25185 USB/DC/Solar Charger + 5V Boost board (PID 6106)**, `IN`
3. PKCELL 3.7 V LiPo → bq25185 `BAT+`
4. bq25185's boosted 5 V output → `SYSTEM_5V`
5. `SYSTEM_5V` → Feather M0 `VBUS`/USB power input, and → SEN0189 5 V supply

The external bq25185 board is the Rev A battery charger and power-path/boost board. This is an
**intentional design choice**, not an accidental deviation discovered after the fact — it was
made specifically to sidestep the Feather's onboard-charger/LiFePO₄ incompatibility flagged in
ADR-0001, by not using that onboard charger at all.

This remains a divergence from the EDD's specified LiFePO₄ chemistry that had not been written
down until now.

## Options

### Option A — LiFePO₄ (as specified in the EDD)

**Pros**
- Matches the EDD's existing power budget and BOM.
- Safer thermal runaway characteristics, more forgiving over wide temperature swings — relevant
  for an outdoor marine deployment.
- Longer cycle life for a buoy expected to stay deployed and recharge via solar for extended
  periods.

**Cons**
- 3.2 V nominal voltage is not what the bq25185's default LiPo/Li-ion regulation targets are
  tuned for as wired in Rev A; using LiFePO₄ would require reconfiguring the charger's
  regulation-voltage-setting resistor (or a different charge IC) to hit LiFePO₄'s charge
  profile.
- Fewer off-the-shelf small-form-factor options than LiPo.

### Option B — LiPo (as built in Rev A)

**Pros**
- Directly compatible with the bq25185's default charge profile as wired in Rev A — no
  reconfiguration needed.
- Wide off-the-shelf availability at the capacities SCOUT is likely to need.
- Fastest path to a working prototype design, which is what Rev A needed.

**Cons**
- Less thermally forgiving than LiFePO₄; typically needs protection circuitry for safe
  long-term unattended operation.
- Shorter cycle life than LiFePO₄ under repeated full-depth solar recharge cycles.
- Diverges from the EDD's power budget, which was computed against LiFePO₄ figures.

## Decision

**For the Rev A prototype electrical design:** LiPo is adopted — specifically a PKCELL 3.7 V,
500 mAh cell, charged and power-path-managed by the external Adafruit bq25185 board (PID 6106),
**not** the Feather M0's onboard charger.

This was a deliberate Rev A prototype decision to avoid the onboard-charger/chemistry conflict
identified in ADR-0001, not an accidental schematic deviation.

**This is not a final deployment decision.** The 500 mAh capacity is a reference/prototype
value chosen for bring-up convenience, not sized against SCOUT's actual duty cycle or
deployment duration. Final chemistry and final capacity for deployment hardware remain open.

## Consequences

- Rev A's power budget must be computed against actual LiPo + bq25185 figures — the EDD's
  LiFePO₄-based power budget (§15–17) does not apply as-is to Rev A hardware, and this decision
  does not itself perform that recomputation.
- If a future revision reopens LiFePO₄ (e.g., if the production platform in ADR-0001 moves to
  Option A / ESP32-C3, or for any other reason), the bq25185's regulation-voltage-setting
  resistor and charge profile will need to be reconfigured for that chemistry, or a different
  charge IC selected.
- Enclosure and mounting design should not assume a final battery form factor yet — 500 mAh
  PKCELL is a prototype stand-in, not a sized deployment cell.

## Open questions

1. What is SCOUT's actual required runtime between solar recharge cycles? This determines
   required capacity and is a prerequisite to any final chemistry decision.
2. Does the production platform decision in ADR-0001 (still open) push back toward LiFePO₄, or
   does the Rev A prototype's LiPo approach change that calculus?
3. What battery protection circuitry (if any beyond the bq25185's built-in protections) does a
   marine deployment require for the chosen chemistry?
4. Final battery sizing requires an updated power budget / duty-cycle analysis that does not
   yet exist for Rev A hardware.

## References

- [ADR-0001 — Microcontroller and LoRa Radio Selection](0001-mcu-and-radio-selection.md)
- [Engineering Design Document §15–17](../engineering/engineering-design-document.md) — original LiFePO₄-based power budget
- `hardware/datasheets/ti-bq25185-battery-charger.pdf` — TI BQ25185 chip datasheet (Adafruit's
  PID 6106 board-level guide is not yet in the repo; documentation gap, see
  `hardware/datasheets/README.md`)
- `hardware/datasheets/pkcell-lp503035-lipo-battery.pdf` — PKCELL LP503035, 3.7 V 500 mAh
