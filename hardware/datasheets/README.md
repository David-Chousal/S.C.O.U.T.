# Datasheets

Local manufacturer documentation for components in the Rev A prototype schematic
([`../schematics/`](../schematics/)). These supplement, rather than replace, the online
[Datasheet / source index](../README.md#datasheet--source-index) in `hardware/README.md`.

| File | Component |
|---|---|
| `adafruit-feather-m0-radio-with-lora-radio-module.pdf` | Feather M0 + RFM95 (build platform, per [ADR-0001](../../docs/decisions/0001-mcu-and-radio-selection.md)) |
| `semtech-sx1276-77-78-79-lora-transceiver.pdf` | SX1276 radio chip underlying the RFM95 module — **Rev 7, May 2020** (replaced Rev 4 on 2026-10-16; Rev 6 added the `RegHighBwOptimize1/2` registers the 500 kHz erratum writes). Was misnamed `ti-…`; it is a Semtech part |
| `semtech-an1200-62-fcc-best-practices.pdf` | Semtech AN1200.62 Rev 1.0, "Best Practices for FCC — Pre-Compliance Testing of LoRaWAN Modules": §15.247 rules and Semtech's own measurements of 500 kHz LoRa (6 dB bandwidth 635 kHz, PSD, band edge). Vendor application note, kept with the vendor datasheets — see [FCC Review Brief](../../docs/research/fcc-review-brief.md) |
| `adafruit-adalogger-featherwing.pdf` | Adalogger FeatherWing guide (RTC + microSD) |
| `adafruit-adalogger-featherwing-reference-schematic.png` | Adafruit's own reference schematic for the Adalogger FeatherWing — confirms the PCF8523 RTC and SD chip-select on `D10` |
| `maxim-ds18b20-digital-thermometer.pdf` | DS18B20 temperature probe |
| `dfrobot-sen0189-turbidity-sensor.pdf` | SEN0189 turbidity sensor — includes the manufacturer's polarity statement referenced by [`facts.md`](../../docs/hub/facts.md#sensing-single-point-per-modality--see-adr-0003) and [SCO-47](https://linear.app/scout1/issue/SCO-47) |
| `dfrobot-sen0189-probe-dimension.png` | SEN0189 **probe body** mechanical drawing (as opposed to the adapter board covered by the datasheet above) — manufacturer drawing, saved 2026-09-13 from [DFRobot's official wiki](https://wiki.dfrobot.com/Turbidity_sensor_SKU__SEN0189) → `Probe_Dimension` link (hosted at `github.com/Arduinolibrary/DFRobot_Turbidity_sensor`). Feeds [Sensor Pod Packing Budget](../../docs/engineering/sensor-pod-packing-budget.md) |
| `ti-bq25185-battery-charger.pdf` | BQ25185 charger IC used on the Rev A schematic's external charger board — bare chip datasheet only; see gap below |
| `pkcell-lp503035-lipo-battery.pdf` | PKCELL LiPo battery used in the Rev A prototype |

## Not a decision record

These files support the Rev A schematic review; they are not, by themselves, a resolution of
any open issue. In particular:

- **[SCO-10](https://linear.app/scout1/issue/SCO-10)** (LiFePO₄ charging path) and
  **[ADR-0002](../../docs/decisions/0002-lifepo4-charging-path.md)** remain open. The Rev A
  schematic's LiPo + external-charger path is evidence toward a decision, not the decision
  itself.
- **[SCO-47](https://linear.app/scout1/issue/SCO-47)** (SEN0189 non-inverting front end) is
  largely moot since 2026-10-06: the prototype uses the **Seeed Grove 101020752** at 3.3 V with
  no front end. Seeed publishes no PDF datasheet for it, only a
  [wiki page](https://wiki.seeedstudio.com/Grove-Turbidity-Sensor-Meter-for-Arduino-V1.0/)
  (registered as `grove-turbidity-wiki`). The SEN0189 files here remain the record of the
  original choice; the polarity bench check now applies to the Grove sensor
  ([SCO-25](https://linear.app/scout1/issue/SCO-25)).

## Excluded on purpose

Not included in this directory because they are not part of the Rev A design:

- **DS3231 RTC documentation** — Rev A's Adalogger FeatherWing uses a **PCF8523** RTC,
  confirmed by Adafruit's own reference schematic above. The DS3231 material documents a
  different/earlier candidate component.
- **IRFZ44N MOSFET datasheet** — earlier candidate part, not in Rev A.
- **LC709203F battery monitor datasheet** — earlier candidate part, not in Rev A.

## Documentation gaps

Not fabricated or substituted — flagged as missing until authoritative sources are available:

- **Adafruit bq25185 board-level guide.** Only the bare TI BQ25185 chip datasheet is on file.
  The Rev A schematic's charger symbol represents Adafruit's breakout board, not the bare IC —
  board-specific behavior (VIN vs. VUSB, boost-enable default state) is not yet confirmed
  against Adafruit's own documentation.
- **FlexSolar 10W panel manufacturer specification.** No authoritative manufacturer datasheet
  or manual is on file. A retail listing is not treated as a datasheet and is not included
  here.
