# Pin Assignments

> The authoritative values live in [`src/config.h`](../src/config.h). This table is the
> human-readable mirror. **⚠️ These are Feather M0 + RFM95 + Adalogger defaults and must be
> confirmed against the ECE lead's GPIO table (Team Timeline Phase 0) before wiring.**

| Signal | Pin (`config.h`) | Peripheral | Notes |
|---|---|---|---|
| DS18B20 data | `PIN_ONEWIRE` = 12 | 1-Wire temperature | 4.7 kΩ pull-up to 3.3 V |
| Turbidity analog | `PIN_TURBIDITY` = A0 | SEN0189 | Through a level-safe front end (≤3.3 V; ADR-0002) |
| Sensor power gate | `PIN_SENSOR_GATE` = 11 | MOSFET | HIGH = switched sensor rail on |
| Battery sense | `PIN_BATTERY` = A7 | onboard 2:1 divider | Feather M0 default; revisit with ADR-0002 |
| microSD CS | `PIN_SD_CS` = 10 | Adalogger microSD | SPI shared with LoRa |
| LoRa CS | `PIN_RFM95_CS` = 8 | RFM95 | Feather M0 RFM95 default |
| LoRa RST | `PIN_RFM95_RST` = 4 | RFM95 | Manual reset pulse at boot |
| LoRa IRQ | `PIN_RFM95_INT` = 3 | RFM95 (G0) | |
| RTC wake IRQ | `PIN_RTC_INT` = 5 | PCF8523 INT1 | Wire the Adalogger INT to wake from standby |

## Shared SPI bus

The RFM95 radio and the microSD share the SPI bus (MOSI/MISO/SCK). Only one chip-select may be
LOW at a time — the drivers open and close each transaction so they never overlap. Verify this
on the bench (EDD/timeline call it out as a risk).

## I²C

The PCF8523 RTC is on the Feather's I²C bus (SDA/SCL) via the Adalogger. No pin config needed
beyond the default Wire pins.

## Still to confirm (ECE)

- Whether A7 battery sensing survives the final LiFePO₄ charging topology (ADR-0002).
- The turbidity analog front end that keeps SEN0189's output within the 3.3 V ADC range.
- The exact GPIO for the sensor power gate and RTC INT once the harness is drawn.
