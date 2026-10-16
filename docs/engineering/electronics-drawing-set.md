# Electronics Drawing Set and Sensor Interface Review

> **Summary** — The S.C.O.U.T. electronics drawings, Rev B (2026-10-12):
> - a hydrophone selection;
> - a system block diagram;
> - the board stack-up and battery pack;
> - the pin map and cable schedule;
> - material and equipment takeoffs;
> - a table of every connection.
>
> A separate review package answers Dr. Shoba Krishnan's 2026-10-07 assignments: for each
> sensor, datasheet screenshots, a block diagram and a test protocol. Values marked † on the
> drawings are proposed and get confirmed on the bench.
>
> Owner: Isabella Rodriguez (ECEN). Build stages: [Electronics Build and Test Plan](electronics-build-and-test-plan.md).
> Costs: [Purchase Log](../planning/purchase-log.md).

---

## Files

| File | What it is |
|---|---|
| [`drawings/scout-electronics-drawing-set.html`](drawings/scout-electronics-drawing-set.html) | Drawing set SCOUT-E-100 Rev B, interactive (light and dark) |
| [`drawings/scout-electronics-drawing-set.pdf`](drawings/scout-electronics-drawing-set.pdf) | The same drawing set, print edition (US Letter landscape, light background) |
| [`drawings/scout-sensor-interface-review.pdf`](drawings/scout-sensor-interface-review.pdf) | Sensor Interface Review SCOUT-E-110, the package for Dr. Krishnan |

The drawing set has eight sheets:

| Sheet | Content |
|---|---|
| 0 | Hydrophone selection: Aquarian H2dM and the options compared |
| 1 | System block diagram |
| 2 | Controller stack-up and battery pack |
| 3 | Pin assignment and cable schedule |
| 4 | Material takeoff with section subtotals and totals |
| 5 | Equipment takeoff: everything borrowed from the lab, $0 expected spend (fallback cost shown only in case an item is missing) |
| 6 | General notes and sources checked |
| 7 | Every connection: parts, values, wires, how to join them, and the build order |

## Decisions recorded on 2026-10-12

- **Hydrophone: Aquarian H2dM with a 6 m cable.**
  - Runs on 3.5 mm plug-in power, needing at least 2 V at 0.7 mA (H2dM User's Guide).
  - It is biased from the 3.3 V rail through a 1.1 kΩ resistor, so no higher-voltage supply is needed.
  - $229 base plus the cable option. The purchase waits for funding.
- **Sensor power switches are high-side P-MOSFETs (DMG2305UX), each with a 100 kΩ gate pull-up.**
  - Gate LOW = sensor ON.
  - This keeps the sensor ground connected and holds the sensors off during boot and sleep.
  - The firmware polarity is flipped to match ([SCO-186](https://linear.app/scout1/issue/SCO-186)).
- **Pin map**:

| Pin | Use |
|---|---|
| D12 | DS18B20 data (1-Wire, 4.7 kΩ pull-up), unchanged from firmware |
| A1 | Turbidity signal |
| D11 | Turbidity power switch Q1 (LOW = on) |
| A2 | Hydrophone preamp output |
| A3 | Hydrophone power switch Q2 (LOW = on), used as a digital output |
| D5 | Free. Was the PCF8523 INT wake; standby wake moved to the SAMD21 RTC on 2026-10-16 ([SCO-196](https://linear.app/scout1/issue/SCO-196)) |
| D6 | Left free (reserved for the radio IO1 pad) |
| SDA, SCL | SHT40 (0x44) and PCF8523 (0x68) |
| D10 | microSD chip select |
| D8, D3, D4 | RFM95 CS, IRQ, RST (internal) |
| D9 / A7 | Battery divider (100 kΩ / 100 kΩ) |

## Hydrophone front-end values

These values are proposed and confirmed with a tap test on the bench.

- **Bias:** R9 100 Ω and C10 10 µF filter the supply, then R4 1.1 kΩ feeds the tip. The tip sits at about 2.46 V.
- **Coupling:** C3 1 µF.
- **Mid-rail:** 1.65 V from a 10 kΩ / 10 kΩ divider.
- **Stage 1:** gain 21 (20 kΩ / 1 kΩ + 10 µF).
- **Low-pass filter:** 1.5 kΩ / 10 nF, about 10.6 kHz.
- **Stage 2:** gain 11 (10 kΩ / 1 kΩ + 10 µF).
- **Total gain:** about 231 (47 dB). A 2.5 mV reef signal becomes about 0.6 V on A2.

## Regenerating the PDFs

Both PDFs were printed from the HTML with Microsoft Edge in headless mode (`--print-to-pdf`). The
print edition is the same page with the dark theme removed and one sheet per page. Edit the
HTML, reprint, and commit both together.
