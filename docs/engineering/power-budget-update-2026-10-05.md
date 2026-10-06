# Power Budget Update — 2026-10-05 (Draft)

> **Summary** — Working power budget for the S.C.O.U.T. buoy as of **2026-10-05**, prepared for
> the review with Dr. Shoba Krishnan that afternoon. **This is a dated update, not a final
> document.** It proposes powering the buoy from a sealed **3.6 V Li-SOCl₂ primary D cell with
> no solar**. The board's **sleep current sets battery life**: about 90% of the daily draw. One
> D cell lasts about 13 months with the hydrophone on the best estimate, but only about 7 months
> on the pessimistic one. To make 12 months robust, the plan is **power-gating between wake-ups
> with a TPL5111 timer board** (fallback: **two D cells**). Every number marked *estimate* is
> replaced by a bench measurement once parts arrive.
>
> Owner: Isabella Rodriguez (ECEN). Decision record: [ADR-0007](../decisions/0007-primary-cell-power-source.md)
> (🟡 Open). Linear: [SCO-10](https://linear.app/scout1/issue/SCO-10),
> [SCO-116](https://linear.app/scout1/issue/SCO-116),
> [SCO-115](https://linear.app/scout1/issue/SCO-115).

---

> **Update 2026-10-06** — this snapshot stays as written; what changed the next day:
> - **Plan moved to two D cells + firmware standby, no TPL5111 timer.** Standby + two cells
>   gives ≈ 26 months best case and ≈ 14 months pessimistic with the hydrophone (table below,
>   "2 D cells" column), with no extra parts.
> - **Gated floor corrected to ≈ 55 µA, not ≈ 20 µA.** The Feather M0 schematic shows a 100k
>   pull-up on EN, which draws 36 µA while a timer holds EN low. Power-gated with the hydrophone
>   is then ≈ 19.7 mAh/day ≈ 20 months on one cell (was ≈ 21). Only matters if gating returns.
> - **Turbidity sensor moves to the 3.3 V Seeed Grove 101020752**, so the default build has no
>   5 V boost or divider; the MiniBoost is kept as a backup.
> - Bench parts ordered 2026-10-06. Full staged plan and benchmarks:
>   [Electronics Build and Test Plan](electronics-build-and-test-plan.md).

## Status of this document

| Item | State on 2026-10-05 |
|---|---|
| Power source | **Working decision:** primary Li-SOCl₂ D cell(s), no solar. Pending Dr. Krishnan's review; recorded as 🟡 Open in [ADR-0007](../decisions/0007-primary-cell-power-source.md) |
| Priority | Make the system work on D cells and last **12 months** (10–11 months is the floor, not the target) |
| Parts order | Placed with Dr. Krishnan ~1:30 PM after the review ([SCO-115](https://linear.app/scout1/issue/SCO-115)). **Not ordered:** hydrophone, solar panels, the PKCELL LiPo / PID 6106 charger path |
| Numbers | Datasheet-checked where marked; everything else is an estimate until measured (see [Measure first](#what-gets-measured-first)) |
| Next revision | After bench measurements of sleep current and the turbidity/boost chain |

## The proposal

1. **Power source:** one sealed 3.6 V lithium-thionyl-chloride (Li-SOCl₂) D cell, the chemistry
   used in 10-year alarms, replacing solar + a rechargeable battery. No panel, no charger,
   nothing exposed above the waterline. The Rev A LiPo path ([ADR-0006](../decisions/0006-rev-a-battery-chemistry.md))
   stays a prototype-only record.
2. **Regulation:** the Feather M0's onboard 3.3 V regulator (500 mA peak). From 3.6 V a linear
   regulator is about 92% efficient, so no regulator needs designing.
3. **Switching:** firmware decides *when*; hardware does the switching. The DS18B20 is powered
   from a GPIO pin. The SEN0189 sits behind a logic-level **P-MOSFET** on the 3.3 V rail ahead of a
   **5 V boost board** (TPS61023).
4. **Make 12 months robust:** a **TPL5111 timer board** holds the Feather's EN pin low between
   wake-ups, so the whole 3.3 V rail (SD card included) is off. Fallback: two D cells in a
   factory parallel pack.
5. **Safety designed in:** the Feather's onboard LiPo charger must never see a primary cell.
   See [Fire safety](#making-a-fire-hazard-physically-impossible).

## What was checked against datasheets

| Part | Values confirmed | Where |
|---|---|---|
| DS18B20 (Maxim, rev 042208) | VDD 3.0–5.5 V · IDD 1 typ / 1.5 max mA · standby 750 typ / 1000 max nA · tCONV 750 ms at 12-bit | p. 19–20 |
| SEN0189 (DFRobot) | 5 V · 40 mA max · response < 500 ms · analog out 0–4.5 V · clear water ≈ 4.1 ± 0.3 V, output **drops** as turbidity rises · probe top not waterproof · rated 5–90 °C | p. 2–4 |
| SX1276 (Semtech, rev 4) | supply 1.8–3.7 V · sleep 0.2 typ / 1 max µA · standby 1.6 mA · TX 87–90 mA at +17 dBm, 120 mA at +20 dBm · PA current limit default 100 mA · time-on-air formula · LowDataRateOptimize only when Tsym > 16 ms | p. 13–14, 19, 31, 95 |
| Feather M0 LoRa guide (Adafruit) | ≈ 300 µA full sleep · ≈ 11 mA MCU awake · 3.3 V regulator 500 mA peak · built-in 100 mA LiPo charger that charges BAT whenever USB is present · non-LiPo chemistries not to be used on BAT · EN pin disables the regulator · 100k/100k divider on A7 · 7.8 cm wire antenna | p. 7–8, 10–11, 24, 28–32 |
| Adalogger FeatherWing schematic | SD card VDD tied straight to 3.3 V (no switch) · PCF8523 RTC on 3.3 V with CR1220 backup | schematic |
| PKCELL LP503035 (solar option only) | 500 mAh, 3.7 V, 3.0 V cut-off · charge only 0–45 °C | p. 2 |

**Corrected after checking:** board sleep current was first estimated bottom-up at 79 µA, but
Adafruit's own figure is ≈ 300 µA (this raises the daily budget by about 65%). The regulator
limit is 500 mA, not 600 mA. The MCU draws 11 mA awake, not 12 mA.

**Still estimates:** SD card idle and write current; TPS61023 boost efficiency; AP2112K dropout
and quiescent current; Li-SOCl₂ capacity, pulse limits and derating (Saft LS33600 datasheet to
pull); PCM1808 power and H2dM bias; TPL5111 floor; UL 1642 wording.

## Voltage levels

| Rail | Voltage | Feeds | Note |
|---|---|---|---|
| Cell | 3.6 V nominal | Feather BAT pin, through the protections below | Bench: current-limited bench supply at 3.6 V instead of a cell |
| 3.3 V | 3.3 V, 500 mA peak | SAMD21, RFM95 (1.8–3.7 V), Adalogger, DS18B20 (3.0–5.5 V) | Feather onboard regulator |
| Switched 5 V | 5 V | SEN0189 only (40 mA max) | P-FET → TPS61023 boost |

**Linear regulator efficiency** (energy conservation + KCL, Iin = Iout + IQ):
η = Vout / Vin = 3.3 / 3.6 ≈ **91.7%**. A 9 V alarm battery would give 3.3/9 = 37%. A 3.0 V
CR123A sits below the output voltage and would not work.

**Turbidity divider** (Ohm + KVL): Vadc = 4.5 V × 20k / (10k + 20k) = **3.0 V max**, under the
3.3 V ADC. Divider current is 4.5 V / 30 kΩ = 0.15 mA, only while the sensor is on. The divider
is **non-inverting**, which matters because clear water reads high and the analysis pipeline
assumes that direction ([SCO-47](https://linear.app/scout1/issue/SCO-47)).

**Regulator dropout margin:** AP2112 dropout ≈ 250 mV at 600 mA (*estimate, to verify*), i.e.
≈ 0.42 Ω. At a 112 mA peak that is ≈ 47 mV, so the cell must stay ≥ ≈ 3.35 V during transmit.
This is an open question for the review.

## Every load, worked out

Base case: wake every 30 min (48 per day), read both sensors, write to SD, send 3 packets per
day. Hydrophone off. Current is measured at the battery. Charge per load: Q = I × t, and
mA·s ÷ 3600 = mAh.

| Load | Current | On-time | × per day | mA·s per day | mAh per day | Share | Source |
|---|---|---|---|---|---|---|---|
| SAMD21 awake (sample + log) | 11 mA | 1.5 s | 48 | 792 | 0.220 | 1.7% | guide p. 32; time *estimate* |
| DS18B20 conversion | 1.5 mA | 0.75 s | 48 | 54 | 0.015 | 0.1% | DS18B20 p. 19–20 |
| SEN0189 via boost | 71.3 mA | 1.0 s | 48 | 3,422 | 0.951 | 7.1% | 40 mA @ 5 V; boost η 85% *estimate* |
| SD card write | 50 mA | 0.1 s | 48 | 240 | 0.067 | 0.5% | *estimate* |
| RFM95 transmit (+11 dBm) | ≤ 100 mA | 0.559 s | 3 | 168 | 0.047 | 0.3% | PA limit 100 mA |
| SAMD21 awake during TX | 11 mA | 0.559 s | 3 | 18 | 0.005 | 0.0% | guide p. 32 |
| Sleep floor | 501 µA | 24 h | 1 | 43,286 | 12.024 | 90.2% | 300 µA board (guide p. 8) + SD + RTC |
| **Total** | | | | **47,981** | **13.33** | 100% | avg ≈ 0.56 mA · ≈ 48 mWh/day at 3.6 V |

**Boost** (P = V × I, Pin = Pout / η): 5 V × 40 mA = 200 mW → 200 / 0.85 = 235 mW →
235 / 3.3 V = **71.3 mA** on the 3.3 V rail.

**LoRa time on air** (SX1276 p. 31): SF12, BW 500 kHz, CR 4/8, CRC on, explicit header, 8-symbol
preamble, 30 B payload + 4 B RadioHead header = 34 B. Tsym = 4096 / 500,000 = 8.192 ms (< 16 ms,
so LowDataRateOptimize off). Tpreamble = 12.25 × 8.192 = 100.4 ms.
npayload = 8 + ⌈(272 − 48 + 28 + 16) / 48⌉ × 8 = 56 symbols. Tpacket = 100.4 + 56 × 8.192 =
**559 ms**. The radio barely matters to the budget.

**Two mistakes that would drain any battery:**

- Turbidity sensor never switched off: 71.3 mA × 24 h = **1,711 mAh/day**. A D cell would last
  about a week.
- Radio left in standby instead of sleep: 1.6 mA × 24 h = **38 mAh/day**, about 3× the whole budget.

## The sleep floor, and how to cut it

Everything that stays powered draws in parallel (KCL), so the currents add: board in full sleep
≈ 300 µA + SD idle ≈ 200 µA (*estimate*) + PCF8523 ≈ 1 µA = **≈ 501 µA**, which is 12.0 mAh/day
and 90% of everything. The SD card is wired straight to 3.3 V on the Adalogger, so it cannot be
switched off without modifying the board.

**Power-gating (TPL5111 on EN):** the Feather's EN pin turns the 3.3 V regulator off (guide
p. 30). A nano-power timer board holds EN low for 30 min, then releases it. Everything on 3.3 V
is off between wake-ups, and the PCF8523 keeps time on its coin cell.

| Term | Value |
|---|---|
| Remaining floor | battery divider 3.6 V / 200 kΩ ≈ 18 µA (+ timer < 1 µA) ≈ 20 µA → 0.48 mAh/day |
| Cost | cold boot every wake ≈ 1 s × 11 mA × 48 = 528 mA·s ≈ 0.15 mAh/day |
| Base system | **13.3 → ≈ 1.9 mAh/day** |
| Firmware consequence | Starts fresh every wake; state must be saved to flash/SD ([SCO-25](https://linear.app/scout1/issue/SCO-25)) |

## Hydrophone (not ordered yet)

| Part while recording | Battery-side | How it was worked out |
|---|---|---|
| H2dM bias (plug-in power) | ≈ 2.3 mA | 2.5 V / 1.1 kΩ (Aquarian manual, to recheck) |
| PCM1808 audio ADC | ≈ 21.4 mA | ≈ 43 mW analog at 5 V via boost + ≈ 20 mW digital at 3.3 V (*estimate*) |
| SAMD21 streaming I²S | 11 mA | guide p. 32 |
| SD card writing | ≈ 40 mA | *estimate* |
| **Total while recording** | **≈ 75 mA** | KCL sum 74.7 mA; 75.7 mA used as a small margin |

**Recording schedule**, set by the acoustic pipeline's method (validated on the Sesoko dataset,
[`lin-2021`](../hub/research/sources.md)): five indices per file, the median per session, and a
trend test over time.

| Rule | Why | Schedule |
|---|---|---|
| Same time every day | Reef sound changes across day, dusk and night | Fixed windows |
| Several files per window | The median only rejects the ~1-in-5 file spoiled by rain or boats if there are several | ≥ 5 one-minute files |
| A dusk window | Fish choruses peak around dusk and track lunar cycles ([`staaterman-2014`](../hub/research/sources.md)) | Window tied to sunset |
| Fixed clip length | Indices like ACI accumulate over time | 1 min, never changed |
| Sample rate ≥ 16 kHz | Analysis band up to 8 kHz; Nyquist fs ≥ 2 fmax | 22.05 kHz |
| Check representativeness | Catches seasonal timing shifts | 1 "diel day" per week: 1 min every hour |

Midnight 5 min + dusk 5 min + 24 min / 7 = **13.43 min/day = 806 s**. Q = 75.7 mA × 806 s ≈
**16.9 mAh/day**. Storage: 44.1 kB/s × 806 s ≈ 35.5 MB/day ≈ 13 GB/year.

**Audio stays on the SD card.** At our settings the LoRa bit rate is Rb = 12 × (500,000 / 4096)
× 4/8 = 732 bit/s, so one 1-min clip (21.2 Mbit) would take ≈ 8 h of airtime (≈ 800 mAh). About
10 bytes/day of band levels go over LoRa instead.

## Will it last 10, 11 or 12 months?

Battery life = usable capacity / daily draw. One D Li-SOCl₂ ≈ 17 Ah (*to verify on the Saft
datasheet*), derated to 70% for pulses, aging and cut-off: **11,900 mAh usable**. Allowed per
day: 32.6 mAh for 12 months, 35.5 for 11, 39.1 for 10.

| Scenario (hydrophone 13.4 min/day) | mAh/day | 1 D cell | 2 D cells | Verdict |
|---|---|---|---|---|
| Best estimate, always-on board | 30.3 | 393 d (12.9 mo) | 786 d | 1 cell: ≈ 7% margin. Thin |
| Pessimistic, always-on (SD idle 1 mA, MCU 20 mA, hydrophone 100 mA) | 55.1 | 216 d (7.1 mo) | 432 d (14.2 mo) | 1 cell fails; 2 cells pass |
| Best estimate, power-gated | 18.9 | 631 d (20.7 mo) | ≈ 3.5 yr | Comfortable |
| Pessimistic, power-gated | 24.6 | 484 d (15.9 mo) | ≈ 2.6 yr | Still passes 12 months |
| Sensors only, no hydrophone (always-on) | 13.3 | 893 d (2.4 yr) | ≈ 4.9 yr | Easy |

**Reading:** shortening the target to 10–11 months buys only 10–20% more budget per day.
Power-gating or a second cell buys 60–100%. **Proposal: one D cell + power-gating, fallback two D
cells, and keep 12 months as the design target.** The ~10-week Hawaii deployment is covered many
times over by every row.

**Two D cells:** use a factory **parallel** pack with diodes (series would give 7.2 V, too high
for the 3.3 V regulator and the RFM95). Each D cell weighs about 100 g, so the battery bay must
fit 1–2 cells ([SCO-49](https://linear.app/scout1/issue/SCO-49)).

**Solar comparison (not ordered):** Rev A's solar path converts twice, costing ≈ 1.45× more energy.
E ≈ 30.3 mAh × 3.6 V × 1.45 ≈ 158 mWh/day. P = E / (PSH 4 × 0.67 × 0.95 × 0.70) ≈ **89 mW**.
Storage for 5 days ≈ 297 mAh. A 1 W panel + the 500 mAh LiPo would cover it with no lifetime
limit, but it adds an exposed panel, a LiPo that cannot charge above 45 °C, and ≈ 40% conversion
loss.

## Making a fire hazard physically impossible

The Feather's built-in 100 mA LiPo charger charges whatever is on BAT whenever USB is connected
(guide p. 7, 28), and Adafruit warns against non-LiPo chemistries there (p. 31). Charging a
primary lithium cell can make it overheat, vent, or catch fire. A shorted D cell can deliver amps.
A rule like "never plug in USB" is not enough on its own, so each layer below removes one way to fail:

| Layer | What it does | Why it works |
|---|---|---|
| 1. Remove the charger IC on the deployment Feather | No charging circuit at all; USB still powers the board for programming | No circuit, no charge current (*confirm on the Adafruit schematic that nothing else feeds BAT*) |
| 2. One-way element at the cell | Ideal-diode controller (or redundant diodes) so current only flows out of the cell | Primary-lithium practice (UL 1642 guidance, *to verify*) calls for redundant charge protection; a plain Schottky's ~0.3 V drop eats the regulator margin |
| 3. Fuse or PTC at the cell | Opens on a short | Limits short-circuit energy at the source; some packs include it |
| 4. Keyed connector + disconnect plug | Cell plugs in one way, through a "remove before programming" plug | Prevents reverse polarity; makes "battery off during USB work" physical |
| 5. No primary cell on the bench | Bench uses a current-limited 3.6 V supply | The battery path gets tested without a real lithium cell near USB |
| 6. Housing | Cell vent faces away from the electronics; bay has pressure relief; ship as lithium-metal cells | A venting cell cannot pressurise the sealed bay (*check cell maker's guidance*) |

## Switching sensors on at set times

- **DS18B20 (≤ 1.5 mA):** powered straight from a GPIO pin, with the 4.7 kΩ pull-up on the same
  pin (*confirm the SAMD21 pin drive*).
- **SEN0189 (≈ 71 mA on the 3.3 V side):** logic-level P-FET on the + side of the 3.3 V rail
  ahead of the boost, with a 100k gate pull-up so it stays **off** while the MCU boots or sleeps.
  GPIO high → VGS = 0 → off; GPIO low → VGS = −3.3 V → on.
  - Switch the + side, not ground, because cutting an analog sensor's ground corrupts its reference.
  - Put the FET before the boost so the gate needs no level shifting.
  - Do not rely on the boost's EN pin alone: many synchronous boosts leak input to output when
    disabled (*check TPS61023*).
  - FET loss by P = I²R at 71 mA with 0.1 Ω is 0.5 mW, which is negligible.

**Firmware sequence per wake:** timer/RTC wakes the board → temperature and turbidity power on →
start the DS18B20 conversion (750 ms) → wait ≈ 1 s → read A1 many times and average → read
the DS18B20 → both sensors off → (scheduled windows) record hydrophone clip → write SD →
(TX slot) transmit, then radio sleep → back to sleep / power off. Transmit never overlaps
sensor reads, so the peak stays ≈ 112 mA instead of ≈ 185 mA.

## What can change once it is built

| What | Why | How we would see it | What we would do |
|---|---|---|---|
| Inrush when the boost turns on | I = C·dV/dt: 22 µF to 3.3 V in 10 µs ≈ 7 A for an instant | 3.3 V rail dips; MCU resets | Slow the FET turn-on (gate RC), bulk capacitance, scope the rail |
| Battery sag on transmit | V = Voc − I·Rint; at 5 Ω, 0.112 A drops 0.56 V | Brownout late in battery life | Capacitor or hybrid-capacitor pack across the cell; measure Rint |
| Li-SOCl₂ passivation | Film on the lithium after long idle raises resistance on the first pulse | First transmit sags harder | Same capacitor fix; cell maker's notes |
| Boost ripple on the ADC | ≈ MHz switching leaves tens of mV on 5 V | Jumpy turbidity | RC filter at A1, average many reads |
| ADC reference sag | Readings scale with the 3.3 V rail: 50 mV ≈ 1.5% | Turbidity shifts with other loads | Internal reference; no TX or SD write during reads |
| SD card spikes and idle current | 100–200 mA write bursts; idle varies by brand | Sleep far off the estimate | Measure several cards; power-gating removes idle |
| Back-powering through I/O pins | "Off" sensor fed via its data pin's protection diodes | Higher sleep current | Pins low or input when off |
| Sensor warm-up longer than spec | "< 500 ms" is typical, not guaranteed | Drift in the first second | Log A1 after power-on to find the real settle time |
| Temperature | Capacity, Rint, offsets all shift; SEN0189 rated only from 5 °C | Shorter life, drift | Internal temp/humidity sensor, derating margin, shade the bay |
| Hot-plug overshoot | Lead inductance + ceramic caps ring up to ≈ 2× | A part dies on connect | No hot-plugging; series resistor or TVS |
| Long cables into seawater | Capacitance slows 1-Wire; surges and ESD | CRC errors, damaged inputs | Stronger pull-up; TVS at cable entries |
| Water on the turbidity board | SEN0189 probe top is not waterproof | Leakage, wrong readings | Pot or seal the probe top |
| Part tolerances | Resistors ±1–5%; unit variation | Offsets between units | 1% resistors; calibrate each unit |
| Firmware leaves something on | Crash before the "off" step | Battery drains in days | Watchdog, re-assert "off" every wake; power-gating limits damage to one cycle |
| Moisture and corrosion | Condensation leakage; salt raises contact resistance | Creeping sleep current | Humidity alarm, conformal coat, sealed connectors |

## Parts order (2026-10-05, with Dr. Krishnan)

Final quantities are set at the review; the Adafruit product IDs are verified at checkout.

| Part | Purpose | Status |
|---|---|---|
| Adafruit Feather M0 RFM95 LoRa 900 MHz (PID 3178) | MCU + radio | Ordering today |
| Adafruit Adalogger FeatherWing (PID 2922) + CR1220 + microSD | RTC + logging | Ordering today |
| DS18B20 waterproof probe (Adafruit PID 381) | Temperature | Ordering today |
| DFRobot SEN0189 | Turbidity | Ordering today |
| 5 V MiniBoost, TPS61023 (Adafruit PID 4654) | 5 V for SEN0189 | Ordering today |
| TPL5111 timer breakout (Adafruit PID 3435) | Power-gating test | Ordering today |
| Logic-level P-MOSFET, 1% resistors, capacitors, wire | Switching, divider | Labs / order as needed |
| Li-SOCl₂ D cell(s), fused pack if available | Deployment power | Decided at the review; stays sealed until the safety layers are built |
| Hydrophone (H2dM front-runner), solar panel, PKCELL LiPo + PID 6106 | — | **Not ordered** ([SCO-8](https://linear.app/scout1/issue/SCO-8) open) |

**Before parts arrive:** current-limited bench supply and a µA-range multimeter reserved;
breadboard layout for the P-FET + boost + divider; firmware sleep and power-pin sequence ready
from David ([SCO-25](https://linear.app/scout1/issue/SCO-25),
[SCO-98](https://linear.app/scout1/issue/SCO-98)); charger-IC location identified on the
Feather schematic.

## What gets measured first

1. Sleep current of the Feather + Adalogger, with and without the SD card, using a µA meter in
   series with a 3.6 V bench supply. Jumper across the shunt during wake to avoid a brownout
   ([SCO-23](https://linear.app/scout1/issue/SCO-23)).
2. Power-gated floor with the TPL5111 holding EN low.
3. SEN0189 current and settle time at 5 V, logging A1 every 10 ms after power-on.
4. Boost efficiency with the sensor as the load: η = (5 V × Iout) / (3.3 V × Iin).
5. Inrush: scope the 3.3 V rail while the FET switches on.
6. Transmit current at +11 dBm across a 1 Ω shunt.
7. Turbidity direction: clear water must read higher than turbid water.

## Questions for Dr. Krishnan

1. Is a primary Li-SOCl₂ cell a sound replacement for solar + rechargeable, given the hydrophone numbers?
2. Power-gating with a timer board vs a second D cell: which, and is a cold boot every 30 min a concern?
3. Is ≈ 50 mV of regulator dropout margin at the 112 mA peak acceptable?
4. Is removing the charger IC + an ideal diode + a fuse at the cell enough charge protection?
5. How should transmit pulses be buffered: a capacitor across the cell, or a hybrid-capacitor pack?
6. Is a P-FET ahead of the boost the right way to switch the turbidity sensor?
7. Are 85% boost efficiency and 70% usable cell capacity reasonable planning numbers?
8. Does ≈ 75 mA while recording sound right for the hydrophone chain?

## Equations and sources

| Law / formula | Equation | Used for | Source |
|---|---|---|---|
| Ohm's law | V = I·R | Divider, dropout, bias, sag, shunt | Hambley, *Electrical Engineering: Principles & Applications* |
| Electric power | P = V·I = I²R | Sensor power, converters, FET loss | Same |
| Current / charge | I = dQ/dt → Q = ΣI·t | Every mA·s and mAh | Same |
| Energy | E = V·Q | Primary vs solar comparison | Same |
| KCL | ΣIin = ΣIout | Sleep floor, hydrophone total | Same |
| Voltage divider | Vout = Vin·R2/(R1+R2) | Turbidity to ADC | Same |
| Converter efficiency | Pin = Pout/η | Boost current, solar penalty | TI TPS61023 datasheet (to pull) |
| Linear regulator efficiency | η = Vout/Vin | 92% from 3.6 V | TI app note SLVA079 |
| LoRa time on air | T = (npre + 4.25)·Tsym + npay·Tsym | Transmit energy | Semtech SX1276 rev 4, p. 31 |
| LoRa bit rate | Rb = SF·(BW/2^SF)·CR | Why audio is not transmitted | Semtech SX1276, p. 28 |
| Battery life | t = C·k / Qday | 10/11/12-month check | Cell maker's derating curves (Saft LS33600, to pull) |
| PV sizing / autonomy | P = E/(PSH·η·k); C = E·D/(V·DoD·k) | Solar comparison | NREL irradiance; Sandia SAND87-7023 |
| Nyquist–Shannon | fs ≥ 2·fmax | Hydrophone sample rate | Oppenheim & Willsky, *Signals and Systems* |
| Capacitor current | I = C·dV/dt | Inrush | Hambley |

Datasheets checked: Maxim DS18B20 rev 042208; DFRobot SEN0189; Semtech SX1276/77/78/79 rev 4;
Adafruit Feather M0 Radio with LoRa guide; Adafruit Adalogger FeatherWing schematic; PKCELL
LP503035 spec. Acoustic method: [`lin-2021`](../hub/research/sources.md),
[`staaterman-2014`](../hub/research/sources.md). Not included: shore-station power, GPS/tamper
option, internal temp/humidity sensor (µA-level).
