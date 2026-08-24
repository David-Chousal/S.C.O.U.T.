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
static const int8_t LORA_TX_POWER_DBM = 14;      // +14 dBm (EDD §2)

/* ── ADC ──────────────────────────────────────────────────────────────────── */
static const uint8_t ADC_RESOLUTION_BITS = 12;   // SAMD21 12-bit
static const float ADC_VREF_V = 3.3f;

#endif /* SCOUT_CONFIG_H */
