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

/* ── Power thresholds ─────────────────────────────────────────────────────── */
// Skip LoRa TX below this pack voltage. Provisional — depends on the final battery/charging
// path (ADR-0002). 3.1 V shown for a single LiFePO4 cell; revise once the pack is fixed.
static const uint16_t BATTERY_SKIP_TX_MV = 3100;

/* ── Pin map (Feather M0 defaults — confirm with ECE) ─────────────────────── */
#define PIN_ONEWIRE 12     // DS18B20 data (4.7 kΩ pull-up to 3.3 V)
#define PIN_TURBIDITY A0    // SEN0189 analog out (through level-safe front end — see ADR-0002)
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
