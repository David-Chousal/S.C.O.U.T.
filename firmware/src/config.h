/*
 * config.h — build-time configuration: pin map, cadence, thresholds.
 *
 * ⚠️ Pin numbers below are the Feather M0 + RFM95 + Adalogger defaults and MUST be confirmed
 * against the ECE lead's GPIO assignment table (Team Timeline Phase 0) before wiring.
 */
#ifndef SCOUT_CONFIG_H
#define SCOUT_CONFIG_H

#include <stdint.h>

/* ── Identity ─────────────────────────────────────────────────────────────── */
static const uint16_t BUOY_ID = 1;  // CSV/label renders as SCOUT-01
#define FW_MAJOR 0
#define FW_MINOR 1
#define FW_PATCH 0

/* ── Cadence (seconds) ────────────────────────────────────────────────────── */
static const uint32_t SAMPLE_INTERVAL_S = 1800;         // 30-minute duty cycle
static const uint8_t SAMPLE_INTERVAL_MIN = 30;          // for the PCF8523 countdown timer
static const uint32_t TRANSMIT_PERIOD_S = 86400;        // one LoRa packet per day (EDD §10)
static const uint8_t AUDIO_HOURS_UTC[] = {0, 8, 16};    // 3 recordings/day (EDD §9)
static const uint16_t SENSOR_WARMUP_MS = 500;           // turbidity settle after power-on
static const uint16_t WDT_TIMEOUT_MS = 16384;           // watchdog reset if a cycle hangs
                                                        // (SAMD21 max; a healthy cycle is a few s)

/* ── Power thresholds (adaptive/graceful-degradation tiers) ───────────────────
 * NORMAL   ≥ CONSERVE_MV            all sensing, transmit each interval
 * CONSERVE CRITICAL_MV..CONSERVE_MV skip audio, transmit every Nth interval
 * CRITICAL < CRITICAL_MV           temperature + logging only; no TX, turbidity, or audio
 * Provisional millivolts — depend on the final battery/charging path (ADR-0002). */
static const uint16_t BATTERY_CONSERVE_MV = 3200;                  // drop into conserve below this
static const uint16_t BATTERY_CRITICAL_MV = 3100;                  // drop into critical below this
static const uint32_t TRANSMIT_CONSERVE_FACTOR = 3;                // conserve: transmit ×3 less often

/* ── Pin map (Feather M0 defaults — confirm with ECE) ─────────────────────── */
#define PIN_ONEWIRE 12     // DS18B20 data (4.7 kΩ pull-up to 3.3 V)
#define PIN_TURBIDITY A1    // SEN0189 analog out (through level-safe front end — see ADR-0002)
#define PIN_SENSOR_GATE 11  // MOSFET gate: HIGH powers the switched sensor rail
#define PIN_BATTERY A7      // Feather M0 onboard 2:1 battery divider
#define PIN_SD_CS 10        // Adalogger microSD chip-select
#define PIN_RFM95_CS 8      // Feather M0 RFM95 defaults
#define PIN_RFM95_RST 4
#define PIN_RFM95_INT 3
#define PIN_RTC_INT 5       // PCF8523 INT1 → wake the MCU from standby (wire on the Adalogger)

/* ── Radio ────────────────────────────────────────────────────────────────── */
static const float LORA_FREQUENCY_MHZ = 915.0f;  // US ISM (902–928 MHz)
/* +11 dBm, NOT the +14 dBm the EDD §2 assumed.
 *
 * The RFM95 module on the Feather M0 (PID 3178) carries a Single Modular Approval,
 * FCC ID 2ASEORFM95C (Shenzhen HOPE Microelectronics), and that grant certifies a
 * conducted output power of 0.0145 W = 11.6 dBm. FCC modular-approval rules require the
 * integrator to keep RF output power and transmission parameters within the certified
 * limits; exceeding them invalidates the grant and pushes the end product into full
 * intentional-radiator certification. +14 dBm was ~2.4 dB over. 11 leaves margin.
 *
 * Cost is 3 dB of link budget, against the 6.5 dB the BW500/SF12 change gained — so the
 * radio is still ~3.5 dB better off than the +14 dBm BW125/SF7 configuration it replaced,
 * and now inside the grant rather than outside it on two counts.
 *
 * ANTENNA CONSTRAINT, recorded here because it is easy to violate by accident: the grant
 * was tested with a 2.15 dBi whip, and permits "only those antennas tested with the device
 * or similar antennas with equal or lesser gain". A higher-gain antenna to chase range —
 * the obvious lever if SCO-14's over-water test disappoints — VOIDS the modular approval.
 * The same applies to the shore station if it uses this module. */
static const int8_t LORA_TX_POWER_DBM = 11;

/* Modem configuration: BW 500 kHz · SF12 · CR 4/8, explicit header, CRC on.
 *
 * The bandwidth is a COMPLIANCE requirement, not a performance choice. 47 CFR §15.247
 * allows two routes in 902–928 MHz: digital modulation with a 6 dB bandwidth of at least
 * 500 kHz (a)(2), or frequency hopping across at least 50 channels (a)(1). The previous
 * BW125 single-channel configuration met neither — see
 * docs/research/fcc-915-mhz-compliance.md (SCO-19). Widening to 500 kHz puts the link on
 * the digital-modulation route, which also removes the 400 ms per-channel dwell limit and
 * with it the cap on spreading factor.
 *
 * SF12 is then chosen because it is free to choose. Widening costs 6 dB of noise floor;
 * SF12's processing gain (−20 dB demodulator SNR limit vs SF7's −7.5) more than repays it,
 * leaving the compliant link ~6.5 dB MORE sensitive than the non-compliant one it replaces
 * — modelled −131.0 dBm vs −124.5 dBm, roughly 2× the free-space range. Airtime rises to
 * ~559 ms for a 30-byte frame, which is irrelevant at one packet per day: 0.0019% duty
 * cycle, ~20 mAh per YEAR. Reproduce with scripts/lora_airtime.py.
 *
 * Wider bandwidth also widens LoRa's carrier-frequency-offset tolerance (roughly ±25% of
 * bandwidth), which is a quiet win for a buoy whose crystal will swing with sea-surface
 * temperature. Symbol time at BW500/SF12 is 8.192 ms, under the 16 ms threshold, so
 * LowDataRateOptimize stays off.
 *
 * ⚠️ REGISTER VALUES ARE COMPUTED FROM THE SX1276 MAP, NOT YET BENCH-VERIFIED (SCO-98).
 *   0x1D MODEM_CONFIG1 = 0x98 → Bw=1001 (500 kHz), CodingRate=100 (4/8), ImplicitHeader=0
 *   0x1E MODEM_CONFIG2 = 0xC4 → SF=1100 (12), TxContinuous=0, RxPayloadCrcOn=1
 *   0x26 MODEM_CONFIG3 = 0x04 → LowDataRateOptimize=0, AgcAutoOn=1
 * Fall back to SF11 (0x1E = 0xB4) if SF12 misbehaves on real silicon; it still clears
 * compliance and is 4 dB better than the old configuration.
 *
 * The SHORE STATION MUST MATCH these three bytes exactly, and additionally needs the
 * SX1276 500 kHz receiver-sensitivity erratum (reg 0x36 = 0x02, reg 0x3A = 0x64) which
 * does not apply to this transmit-only node. Tracked on SCO-24. */
static const uint8_t LORA_MODEM_CONFIG1 = 0x98;
static const uint8_t LORA_MODEM_CONFIG2 = 0xC4;
static const uint8_t LORA_MODEM_CONFIG3 = 0x04;

/* ── ADC ──────────────────────────────────────────────────────────────────── */
static const uint8_t ADC_RESOLUTION_BITS = 12;   // SAMD21 12-bit
static const float ADC_VREF_V = 3.3f;

#endif /* SCOUT_CONFIG_H */
