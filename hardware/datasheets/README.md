# Datasheets

Manufacturer documentation for components actually selected in the Rev A schematic. See the
component table in [../README.md](../README.md) for what's used where.

| File | Component |
|---|---|
| `adafruit-feather-m0-radio-with-lora-radio-module.pdf` | Feather M0 + RFM95 (controller/radio) |
| `ti-sx1276-77-78-79-lora-transceiver.pdf` | SX1276 radio chip underlying the RFM95 module |
| `adafruit-adalogger-featherwing.pdf` | Adalogger FeatherWing guide (RTC + microSD) |
| `adafruit-adalogger-featherwing-reference-schematic.png` | Adafruit's own reference schematic for the Adalogger FeatherWing — confirms the PCF8523 RTC and SD_CS→D10 wiring |
| `maxim-ds18b20-digital-thermometer.pdf` | DS18B20 temperature probe |
| `dfrobot-sen0189-turbidity-sensor.pdf` | SEN0189 turbidity sensor |
| `ti-bq25185-battery-charger.pdf` | BQ25185 charger IC (bare chip datasheet — see gap below) |
| `pkcell-lp503035-lipo-battery.pdf` | PKCELL LiPo battery |

## Excluded on purpose

Not included in this directory because they are not part of the Rev A design:

- **DS3231 RTC documentation** (chip datasheet and Adafruit breakout guide) — Rev A's Adalogger
  FeatherWing uses a **PCF8523** RTC, confirmed by Adafruit's own reference schematic above.
  The DS3231 material appears to document a different/earlier candidate component.
- **IRFZ44N MOSFET datasheet** — earlier candidate part, not in Rev A.
- **LC709203F battery monitor datasheet** — earlier candidate part, not in Rev A.

## Documentation gaps

Not fabricated or substituted — flagged as missing until authoritative sources are available:

- **Adafruit bq25185 PID 6106 board-level guide.** Only the bare TI BQ25185 chip datasheet is
  on file. U3 in the Rev A schematic represents the Adafruit breakout board, not the bare IC —
  board-specific behavior (VIN vs. VUSB, EN default state, boost-converter relationship to the
  charger) is not yet confirmed against Adafruit's own documentation.
- **FlexSolar 10W panel manufacturer specification.** No authoritative manufacturer datasheet
  or manual is on file. A retail listing screenshot is not treated as a datasheet and is not
  included here. Panel behavior in `hardware/README.md` is documented as reference/unverified
  until proper manufacturer documentation is available.
