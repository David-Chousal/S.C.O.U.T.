# ADR-0006 — Rev A Prototype Battery Chemistry and Power Path

- **Status:** 🟢 Accepted — **Rev A prototype scope only.** Deployment chemistry, capacity, and
  charging path are **not** decided here; those remain open under
  [ADR-0002](0002-lifepo4-charging-path.md) and [SCO-10](https://linear.app/scout1/issue/SCO-10)
- **Date raised:** 2026-08-18
- **Date decided (Rev A prototype scope):** 2026-08-18 · **recorded:** 2026-08-25
- **Owners:** ECE lead
- **Blocks:** nothing on its own. It *informs* the deployment power budget, battery sizing, and
  the enclosure battery-bay dimensions ([SCO-49](https://linear.app/scout1/issue/SCO-49))

---

## Why this is a separate record from ADR-0002

[ADR-0002](0002-lifepo4-charging-path.md) asks *how to charge LiFePO₄ on the Feather M0*. This
ADR answers a question one level up and earlier in time: *what chemistry and power path did the
Rev A prototype actually get built with, and why does it differ from the EDD?*

They are deliberately not merged, because collapsing them would make a prototype convenience
choice look like it had settled the deployment question. It has not.
[`hardware/README.md`](../../hardware/README.md) has recorded the Rev A path as *"evidence, not
yet a documented decision"* since PR #102; this ADR is that missing record, and it changes
nothing about ADR-0002's status.

## Context

The Engineering Design Document specifies a **3.2 V LiFePO₄** cell as the project's battery
chemistry, used throughout its BOM and power budget (EDD §15–17).
[ADR-0001](0001-mcu-and-radio-selection.md) noted that the Feather M0's *onboard* LiPo charger
is not compatible with that chemistry.

Rev A's KiCad schematic
([`hardware/schematics/scout-reva.kicad_sch`](../../hardware/schematics/), reviewed against
manufacturer documentation, ERC-clean) does not use the Feather's onboard charger at all —
confirmed by direct inspection of the schematic source, which shows the Feather's BAT/VBAT pin
explicitly unconnected. Instead, Rev A's power architecture is:

1. FlexSolar 10 W panel, regulated 5 V USB output → `SOLAR_5V`
2. `SOLAR_5V` → **Adafruit PID 6106 board**, `IN` — a **BQ25185** charge/power-path stage
   feeding a **separate TPS61023 boost converter**
3. PKCELL 3.7 V LiPo → BQ25185 `BAT+`
4. The board's boost output → `SYSTEM_5V`, a genuinely regulated **5 V**. (Not ~4.5 V: that
   figure comes from the bare BQ25185's internal SYS spec and does not describe this board's
   exposed output. Corrected against Adafruit's own PID 6106 guide — thanks to the Rev A
   reconciliation in [PR #107](https://github.com/David-Chousal/S.C.O.U.T./pull/107).)
5. `SYSTEM_5V` → Feather M0 `VBUS`/USB power input, and → SEN0189 5 V supply

The external bq25185 board is the Rev A battery charger and power-path/boost board. This is an
**intentional design choice**, not an accidental deviation discovered after the fact — it was
made specifically to sidestep the Feather's onboard-charger/LiFePO₄ incompatibility flagged in
ADR-0001, by not using that onboard charger at all.

This remains a divergence from the EDD's specified LiFePO₄ chemistry.

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
- Wide off-the-shelf availability at the capacities S.C.O.U.T. is likely to need.
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

**This is not a final deployment decision.** The 500 mAh capacity is a reference/prototype value
chosen for bring-up convenience, not sized against S.C.O.U.T.'s actual duty cycle or deployment
duration. Final chemistry and final capacity for deployment hardware remain open under
[ADR-0002](0002-lifepo4-charging-path.md) / [SCO-10](https://linear.app/scout1/issue/SCO-10),
and **[`facts.md`](../hub/facts.md) still records LiFePO₄ as the canonical deployment
chemistry** — that is intentional, not a contradiction this ADR overrides.

## Consequences

- Rev A's power budget must be computed against actual LiPo + bq25185 figures — the EDD's
  LiFePO₄-based power budget (§15–17) does not apply as-is to Rev A hardware, and this decision
  does not itself perform that recomputation.
- If a future revision reopens LiFePO₄ (e.g. if the production platform in ADR-0001 moves to
  ESP32-C3, or for any other reason), the bq25185's regulation-voltage-setting resistor and
  charge profile will need reconfiguring for that chemistry, or a different charge IC selected.
- Enclosure and mounting design should not assume a final battery form factor yet — the 500 mAh
  PKCELL is a prototype stand-in, not a sized deployment cell. This matters for
  [SCO-49](https://linear.app/scout1/issue/SCO-49), where the battery is one of the two items
  setting the lower bound on housing volume.
- Firmware battery thresholds in `config.h` are provisional against LiFePO₄ figures and were not
  written for a 3.7 V LiPo. They need revisiting before Rev A bench bring-up.

## Open questions

1. What is S.C.O.U.T.'s actual required runtime between solar recharge cycles? This determines
   required capacity and is a prerequisite to any final chemistry decision.
2. Does the production platform decision in ADR-0001 push back toward LiFePO₄, or does the Rev A
   prototype's LiPo approach change that calculus?
3. What battery protection circuitry (if any beyond the bq25185's built-in protections) does a
   marine deployment require for the chosen chemistry?
4. Final battery sizing requires an updated power budget / duty-cycle analysis that does not yet
   exist for Rev A hardware.

## References

- [ADR-0001 — Microcontroller and LoRa Radio Selection](0001-mcu-and-radio-selection.md)
- [ADR-0002 — LiFePO₄ Charging Path on the Feather M0](0002-lifepo4-charging-path.md) — still open
- [Engineering Design Document §15–17](../engineering/engineering-design-document.md) — original
  LiFePO₄-based power budget
- [`hardware/README.md`](../../hardware/README.md) — Rev A prototype schematic and the power-path note
- `hardware/datasheets/ti-bq25185-battery-charger.pdf` — TI BQ25185 chip datasheet (Adafruit's
  PID 6106 board-level guide is not yet in the repo; documentation gap, see
  [`hardware/datasheets/README.md`](../../hardware/datasheets/README.md))
- `hardware/datasheets/pkcell-lp503035-lipo-battery.pdf` — PKCELL LP503035, 3.7 V 500 mAh
- Extracted from [PR #100](https://github.com/David-Chousal/S.C.O.U.T./pull/100), which was
  closed as superseded — see that PR for the original draft
