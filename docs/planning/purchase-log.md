# Purchase Log

> **Summary** — Every S.C.O.U.T. purchase in one place: what was bought, from where, the exact
> amount, who paid, how it is split, and whether it has arrived. Below the log is the list of what
> still needs buying. Prototype parts are split three ways out of pocket (Isabella, David, John
> Ryan) until senior-design funding is available. Update this page in the same PR as any new order.
>
> Owner: Isabella Rodriguez (ECEN). Why each part exists: [Electronics Build and Test Plan](../engineering/electronics-build-and-test-plan.md).

---

## Spending summary

| | Amount |
|---|---|
| Spent so far | **$142.58** |
| Ordered but not yet charged / logged | Mouser (~$28 + shipping) |
| Still to buy, electronics (estimate) | ≈ $305–415 |
| Per person so far (÷ 3) | **$47.53** |

## Orders

| # | Date | Vendor | Order / invoice | Subtotal | Shipping | Tax | **Total** | Paid by | Split | Reimbursed | Delivery |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-07 | Adafruit | Invoice 3758294 | $122.90 | $7.70 (USPS Ground Advantage) | $11.98 | **$142.58** | Isabella | ÷ 3 → $47.53 each | David ☐ · John Ryan ☐ | Est. 4–7 business days → **2026-10-13 to 2026-10-16**, to SCU |
| 2 | — | Mouser | — | ~$28 | — | — | — | — | ÷ 3 | — | Not yet placed |

## Order 1 — Adafruit, invoice 3758294 (2026-10-07)

| Qty | PID | Part | Unit | Line | Role | Needed? |
|---|---|---|---|---|---|---|
| 1 | 3178 | Feather M0 with RFM95 LoRa 900 MHz | $34.95 | $34.95 | Buoy MCU + radio | **Crucial** |
| 1 | 2922 | Adalogger FeatherWing (RTC + SD) | $8.95 | $8.95 | Clock + data logging | **Crucial** |
| 3 | 2830 | Stacking headers for Feather | $1.25 | $3.75 | Stack Adalogger on M0, Proto on Adalogger, LoRa wing on ESP32-S3 | **Crucial** (third set only for the Proto stack) |
| 1 | 381 | Waterproof DS18B20 (includes 4.7k pull-up) | $9.95 | $9.95 | Water temperature | **Crucial** |
| 1 | 4654 | MiniBoost 5 V (TPS61023) | $3.95 | $3.95 | Backup if the Grove turbidity sensor needs 5 V | Backup |
| 1 | 5250 | 128 MB microSD | $3.95 | $3.95 | Bench logging | **Crucial** |
| 2 | 4269 | Simple spring antenna 915 MHz | $0.95 | $1.90 | Bench antennas, buoy + shore | **Crucial** (radio must never transmit without one) |
| 1 | 5477 | ESP32-S3 Feather, 4 MB flash / 2 MB PSRAM | $17.50 | $17.50 | Shore station MCU (SCO-86) | **Crucial** |
| 1 | 3231 | LoRa Radio FeatherWing RFM95W 900 MHz | $19.95 | $19.95 | Shore station radio | **Crucial** |
| 1 | 1661 | uFL SMT antenna connector | $0.75 | $0.75 | Outdoor antenna connection on the M0 | Needed at Stage 8 |
| 1 | 851 | SMA to uFL cable (panel-mount SMA) | $3.95 | $3.95 | Antenna feed through the lid | Needed at Stage 8 |
| 1 | 4885 | SHT40 temperature + humidity | $5.95 | $5.95 | Leak / state-of-health sensor (SCO-60) | Needed at Stage 8 |
| 1 | 4209 | STEMMA QT to male headers cable | $0.95 | $0.95 | Connects the SHT40 | Needed with SHT40 |
| 2 | 261 | JST PH 2-pin cable | $0.75 | $1.50 | Keyed battery plug + bench-supply lead (SCO-150) | **Crucial** for Stage 2 and 6 |
| 1 | 2884 | FeatherWing Proto | $4.95 | $4.95 | Soldered sensor-switch circuit | Needed at Stage 6–8 |
| 1 | 5719 | PCB coaster | $2.50 | $0.00 | Free promotion | — |

## Order 2 — Mouser (to place)

| Qty | Mouser # | Part | ≈ Price | Role |
|---|---|---|---|---|
| 1 | 713-101020752 | Seeed Grove Turbidity Sensor (3.3 V) | $20.80 | Turbidity |
| 1 | 713-110990210 | Grove to male jumper cable (5-pack) | $3.19 | Grove → breadboard |
| 1 | 658-CR1220 | Panasonic CR1220 coin cell | $1.01 | Adalogger RTC backup |
| 2 | 621-DMG2305UX-7 | P-MOSFET, SOT-23 | ~$0.80 | Turbidity power switch |
| 2 | SparkFun BOB-00717 | SOT-23 to DIP adapter (SparkFun if not on Mouser) | $2.50 | Breadboard the MOSFET |

## Still to buy

| Order | When | Items | ≈ Cost | Issue |
|---|---|---|---|---|
| A — power | After Stage 2 (~late Oct) | 2× Saft LS33600 D cell with tabs; 2× ideal-diode IC + adapters; PTC fuse; hazmat shipping | $60–100 | SCO-158 |
| B — audio | ~early Nov | Aquarian hydrophone, 3.5 mm plug-in-power; 3.3 V preamp parts; 16–32 GB industrial microSD | $210–260 | SCO-8, SCO-158 |
| C — housing | Dec–Jan | 915 MHz SMA whip ≤ 2.15 dBi; conformal coating; desiccant | $35–55 | SCO-158 |
| Optional | Before deployment | Spares: Feather M0, DS18B20, Grove sensor, microSD, antenna | ~$70 | — |
| Optional | Depends on shore site | Adalogger + CR1220 (no WiFi) or 350 mAh LiPo (unreliable power) | $6–16 | SCO-164 |

**Not bought, on purpose:** TPL5111 timer (standby + two D cells instead), DFRobot SEN0189 (Grove
3.3 V instead), MAX4466 mic amp (hydrophone arrives soon enough), Feather M0 Adalogger 2796
(duplicate MCU), PKCELL LiPo / PID 6106 / solar panel (superseded by the primary-cell plan).
