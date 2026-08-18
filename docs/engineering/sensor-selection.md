# Sensor Selection & Prioritization

> **Summary** — Candidate sensors tiered by priority (V1 / V1.5 / future) with cost, interface, power draw, and vendor links.
>
> **Source document** — `Sensor List.docx`

---

A couple big takeaways:

- **Hydrophone:** reef ecology, fish populations, human activity.

- **Turbidity:** runoff, sedimentation, reef stress.

- **Temperature:** bleaching.

- **Chlorophyll:** extremely interesting because satellites struggle in shallow water.

- **Surface light + turbidity:** potentially lets you estimate light reaching coral.

- **DO:** nice to have but maybe not first priority.

Also, the chlorophyll sensor you’re thinking of is almost certainly a **fluorometer**. Chlorophyll fluoresces when excited by a specific wavelength of light, and fluorometers measure that emitted light to estimate chlorophyll concentration.

## HIGH PRIORITY (Version 1 / MVP)

| **Sensor** | **Purpose** | **Cost** | **Interface** | **Power** | **Link** |
|----|----|----|----|----|----|
| DS18B20 Waterproof Temp Probe | Coral bleaching, thermal stress | $7 | 1-Wire | ~1.5 mA active | [https://www.adafruit.com/product/381?utm_source=chatgpt.com](https://www.adafruit.com/product/381?utm_source=chatgpt.com) |
| DFRobot SEN0189 Turbidity | Sediment, runoff, water clarity | $14.90 | Analog | ~40 mA | [https://www.dfrobot.com/product-1394.html?utm_source=chatgpt.com](https://www.dfrobot.com/product-1394.html?utm_source=chatgpt.com) |
| Hydrophone (Aquarian H2a-XLR) | Fish populations, reef soundscape | ~$180 - $229 | Analog audio | Low while recording | [https://www.aquarianaudio.com/h2d-hydrophone.html](https://www.aquarianaudio.com/h2d-hydrophone.html) |

#### Recommendation:

**Temperature + Turbidity + Hydrophone = S.C.O.U.T. V1**

## MEDIUM PRIORITY (V1.5)

> **Dissolved oxygen was excluded from V1 on 2026-08-17** — see
> [ADR-0005](../decisions/0005-v1-sensing-payload.md). NOAA has largely stopped using DO for
> reef monitoring because a point reading is too locally sensitive to represent reef-wide
> health. It may return later via the lab's existing **infrared DO sensor**, not the Atlas kit
> priced below.


| **Sensor** | **Purpose** | **Cost** | **Interface** | **Power** | **Link** |
|----|----|----|----|----|----|
| Atlas Scientific DO Kit | Reef respiration and oxygen stress | $175–355 | I2C/UART | ~35 mA | [https://atlas-scientific.com/kits/ezo-complete-do-kit/?utm_source=chatgpt.com](https://atlas-scientific.com/kits/ezo-complete-do-kit/?utm_source=chatgpt.com) |
| Turner Cyclops Chlorophyll Fluorometer | Chlorophyll-a concentration | ~$2,000+ | Analog/Serial | Moderate |  |
| TriOS MicroFlu Chlorophyll | Chlorophyll fluorescence | ~$2,000–5,000 | RS485 | Moderate |  |

#### Important:

Chlorophyll sensors become expensive extremely quickly.

They’re not measuring chlorophyll directly. They use:

- excitation light (usually blue)

- fluorescence measurement

- calibration to chlorophyll-a concentration

This is why satellites use chlorophyll as a productivity proxy.

The NOAA person got excited because shallow reefs are a known weakness of satellite chlorophyll measurements.

## LOW PRIORITY / FUTURE VERSIONS

| **Sensor** | **Purpose** | **Cost** | **Interface** | **Power** | **Link** |
|----|----|----|----|----|----|
| BH1750 Light Sensor | Surface sunlight | $5 | I2C | 0.1 mA | [https://www.adafruit.com/product/4681?utm_source=chatgpt.com](https://www.adafruit.com/product/4681?utm_source=chatgpt.com) |
| TSL2591 High Dynamic Light | Surface irradiance | $7.50 | I2C | 0.4 mA | [https://www.adafruit.com/product/1980?utm_source=chatgpt.com](https://www.adafruit.com/product/1980?utm_source=chatgpt.com) |
| Atlas Conductivity Probe | Salinity proxy | $175–300 | I2C/UART | Moderate | Atlas Conductivity Kit⁠ |
| Atlas pH Kit | Ocean acidification | ~$175 | I2C/UART | Moderate | [https://atlas-scientific.com/kits/ezo-complete-ph-kit/?utm_source=chatgpt.com](https://atlas-scientific.com/kits/ezo-complete-ph-kit/?utm_source=chatgpt.com) |
