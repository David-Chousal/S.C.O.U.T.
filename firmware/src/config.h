/*
 * config.h — build-time configuration: pin map, cadence, thresholds.
 *
 * ⚠️ Pin numbers below are the Feather M0 + RFM95 + Adalogger defaults and MUST be confirmed
 * against the ECE lead's GPIO assignment table (Team Timeline Phase 0) before wiring.
 */
#ifndef SCOUT_CONFIG_H
#define SCOUT_CONFIG_H

#include <stddef.h>
#include <stdint.h>

/* ── Identity ─────────────────────────────────────────────────────────────── */
static const uint16_t BUOY_ID = 1;  // CSV/label renders as SCOUT-01
#define FW_MAJOR 0
#define FW_MINOR 1
#define FW_PATCH 0

/* ── Cadence (seconds) ────────────────────────────────────────────────────── */
#ifdef SCOUT_BENCH
/* BENCH BUILD ONLY (env feather_m0_bench): sample every minute and transmit after every sample,
 * so the bench link test (SCO-155) gets a frame a minute instead of three a day. Never deploy. */
static const uint32_t SAMPLE_INTERVAL_S = 60;
static const bool TX_EVERY_SAMPLE = true;
#else
static const uint32_t SAMPLE_INTERVAL_S = 1800;         // 30-minute duty cycle (:00 and :30)
static const bool TX_EVERY_SAMPLE = false;
#endif
/* Fixed LoRa transmit slots, seconds after midnight UTC: 00:10, 08:10, 16:10 (SCO-165,
 * decided 2026-10-16). Each sits 10 min after a sample so the radio never overlaps a sensor
 * read, and the shore station listens on the same table. Change slot times here only. */
static const uint32_t TX_SLOTS_SOD[] = {600, 29400, 58200};
static const size_t TX_SLOT_COUNT = sizeof(TX_SLOTS_SOD) / sizeof(TX_SLOTS_SOD[0]);
// Audio: one 60 s clip at 00:00, 08:00 and 16:00 UTC (ADR-0011), so each transmit slot 10 min
// later carries the clip just before it. Clip length is ACOUSTIC_CLIP_SECONDS below.
static const uint8_t AUDIO_HOURS_UTC[] = {0, 8, 16};
/* Housing humidity alert (SCO-205). ⚠️ PROVISIONAL: a placeholder until the calibration in
 * SCO-204 (sealed chamber, known water added) gives a threshold from data. Rows at or above it
 * carry HUMIDITY_HIGH, which reaches the dashboard as a fault. */
static const float HUMIDITY_ALERT_RH_PCT = 70.0f;
static const uint16_t SENSOR_WARMUP_MS = 500;           // turbidity settle after power-on
/* Bench clock set (SCO-201): at boot, wait this long for USB and then for a "T<unix-epoch>"
 * line. Only at power-on/reset, never on a wake, so the battery cost is one ~8 s window. */
static const uint32_t TIME_SET_WINDOW_MS = 8000;
static const uint32_t MIN_VALID_EPOCH = 1767225600;     // 2026-01-01T00:00:00Z
static const uint16_t WDT_TIMEOUT_MS = 16384;           // watchdog reset if a cycle hangs
                                                        // (SAMD21 max; a healthy cycle is a few s)

/* ── Power thresholds (adaptive/graceful-degradation tiers) ───────────────────
 * NORMAL   ≥ CONSERVE_MV            all sensing, transmit in every slot
 * CONSERVE CRITICAL_MV..CONSERVE_MV skip audio, transmit in every Nth slot
 * CRITICAL < CRITICAL_MV           temperature + logging only; no TX, turbidity, or audio
 * Provisional millivolts — depend on the final battery/charging path (ADR-0002). */
static const uint16_t BATTERY_CONSERVE_MV = 3200;                  // drop into conserve below this
static const uint16_t BATTERY_CRITICAL_MV = 3100;                  // drop into critical below this
static const uint32_t TRANSMIT_CONSERVE_EVERY = 3;                 // conserve: every 3rd slot (1/day)

/* ── Pin map (Feather M0 defaults — confirm with ECE) ─────────────────────── */
#define PIN_ONEWIRE 12     // DS18B20 data (4.7 kΩ pull-up to 3.3 V)
#define PIN_TURBIDITY A1    // Seeed Grove 101020752 analog out — runs at 3.3 V, wired direct, no divider
#define PIN_SENSOR_GATE 11  // Sensor-rail P-FET gate (DMG2305UX, 100k pull-up) — see SENSOR_ON/OFF
#define PIN_AUDIO_GATE A3   // Hydrophone preamp P-FET gate, digital out, same LOW = on logic
#define PIN_AUDIO_PREAMP A2 // Hydrophone preamp analog out
#define PIN_BATTERY A7      // Feather M0 onboard 2:1 battery divider
#define PIN_SD_CS 10        // Adalogger microSD chip-select
#define PIN_RFM95_CS 8      // Feather M0 RFM95 defaults
#define PIN_RFM95_RST 4
#define PIN_RFM95_INT 3

/* Both power gates are high-side P-channel MOSFETs, so the logic is inverted: pulling the
 * gate LOW turns the sensor ON. High-side keeps the sensor ground tied to the ADC ground,
 * and the 100k pull-up holds the sensors off through boot and reset (SCO-186). */
#define SENSOR_ON LOW
#define SENSOR_OFF HIGH

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
 * ~559 ms for a 30-byte frame (690 ms for the 44-byte v3 packet), irrelevant at one packet
 * a day: 0.0019% duty cycle, ~20 mAh per YEAR. Reproduce with scripts/lora_airtime.py.
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

/* ── Acoustic summary (ADR-0010, SCO-233) ─────────────────────────────────────
 * The 14-byte summary of each recording that rides in the next packet. Computed by
 * lib/scout_acoustic, a port of analytics/utils/acoustic_summary.py (the specification).
 * EVERY VALUE HERE MUST EQUAL AcousticConfig / SECTIONS IN THAT FILE;
 * analytics/utils/tests/test_acoustic_summary.py parses this block and fails on drift.
 *
 * Audio capture parameters are settled by ADR-0011 (2026-10-25): 3 × 60 s clips a day, 22,050 Hz,
 * the Feather's 12-bit ADC on A2. The PCM1808 is the EDD's production-target ADC only; if a
 * build ever moves to it, ACOUSTIC_ADC_BITS, the clip margin and the snap floor change, and the
 * filter coefficients must be regenerated (acoustic_summary.py --print-config) for any other
 * sample rate. Each transmit slot carries the most recent recording since the previous slot
 * (ScoutAcousticSlot). */
static const uint32_t ACOUSTIC_SAMPLE_RATE_HZ = 22050;  // the coefficients below assume this
static const uint16_t ACOUSTIC_CLIP_SECONDS = 60;       // one recording (ADR-0011)
static const uint8_t ACOUSTIC_ADC_BITS = ADC_RESOLUTION_BITS;
// Centred sample << 3: a full-scale 12-bit swing becomes ±16,384, leaving the filters 6 dB of
// headroom inside int16 before they saturate.
static const uint8_t ACOUSTIC_INPUT_SHIFT = 3;
// DC blocker y += Δx − y/2^9: pole at 1 − 1/512, −3 dB at ≈ 6.9 Hz. Removes the preamp's
// mid-rail bias without touching the 0–200 Hz anthro band. 8 extra state bits keep its own
// rounding from leaving a DC residue.
static const uint8_t ACOUSTIC_DC_POLE_SHIFT = 9;
static const uint8_t ACOUSTIC_DC_FRAC_BITS = 8;
// Band filters: bilinear Butterworth biquads at 22,050 Hz, generated by
// `python -m utils.acoustic_summary --print-config` (run from analytics/). Rows are
// {c1, gain, a1, a2, shift}: c1 = +2 low-pass / −2 high-pass, a1 a2 in Q14, gain × 2^shift.
//   0–1  anthro: 4th-order low-pass at 200 Hz (Q 0.541, 1.307)
//   2–3  mixed:  2nd-order high-pass at 200 Hz, then low-pass at 1,000 Hz
//   4–5  bio:    2nd-order high-pass at 1,000 Hz, then low-pass at 8,000 Hz
// Bands equal analytics/utils/acoustic_indices.py (ANTHRO 0–200, MIXED 200–1,000, BIO
// 1,000–8,000 Hz). The mixed band reads ≈ 0.4 dB low at its centre: two 2nd-order skirts.
static const int32_t ACOUSTIC_BIQUADS[6][5] = {
    {2, 26112, -31079, 14746, 25},
    {2, 26624, -32017, 15685, 25},
    {-2, 31474, -31448, 15115, 15},
    {2, 17648, -26232, 10951, 20},
    {-2, 26784, -26232, 10951, 15},
    {2, 17601, 13880, 4938, 15},
};
// Snap detector on the bio band (decision log 2026-10-25). A snap is a bio-band sample above
// 8× the running mean |bio| (Q4: 128 = 8.0). 8× keeps Gaussian noise (mean |x| ≈ 0.8σ, so
// 6.4σ) from ever counting while still catching the louder, nearer clicks in the chorus: on the
// Sesoko clips it counts 26–70 snaps/s (docs/analysis/acoustic-summary-validation.md).
static const uint8_t ACOUSTIC_SNAP_THRESHOLD_Q4 = 128;
// Absolute floor on that threshold: 8 ADC LSB in working units, so near-silence (where the
// running mean is a fraction of an LSB) does not count quantisation noise as snaps.
static const uint16_t ACOUSTIC_SNAP_MIN_ABS = 64;
// Refractory window after a snap: 66 samples = 3.0 ms. Covers the click and its filter ringing
// and early reflections, so one snap counts once; caps the count at ≈ 334 snaps/s.
static const uint16_t ACOUSTIC_SNAP_REFRACTORY_SAMPLES = 66;
// Running floor: time constant 2^12 samples ≈ 186 ms, not updated during a snap or its window.
static const uint8_t ACOUSTIC_SNAP_FLOOR_SHIFT = 12;
// First 2,048 samples (≈ 93 ms) only train the floor (faster, 2^7) and never count.
static const uint16_t ACOUSTIC_SNAP_WARMUP_SAMPLES = 2048;
static const uint8_t ACOUSTIC_SNAP_WARMUP_SHIFT = 7;
// Clip counter: a sample within 16 counts (0.4% of full scale) of either rail. Allows for the
// SAMD21 ADC's few-LSB offset and gain error and a preamp that cannot quite reach the rails.
// Counts in ADC codes, so it depends on ACOUSTIC_ADC_BITS.
static const uint16_t ACOUSTIC_CLIP_MARGIN = 16;

/* ── Audio capture (SCO-231, ADR-0011; drivers/audio_capture.h) ───────────────
 * TC3 overflows at ACOUSTIC_SAMPLE_RATE_HZ (48 MHz / 2177 = 22,048.7 Hz, 59 ppm slow; the WAV
 * header says 22,050), each overflow starts one ADC conversion on PIN_AUDIO_PREAMP through the
 * event system, and the DMA moves every result into a ring of blocks. The main loop feeds each
 * full block to the acoustic summary, converts it to 16-bit PCM and appends it to the WAV file.
 * ⚠️ Written against the SAMD21 datasheet; not yet run on hardware (no hydrophone or preamp). */
// 4 blocks of 2,048 samples (93 ms each, 16 KB of SRAM): up to 3 blocks (279 ms) can queue
// while one SD write stalls before any sample is lost. Raise the block count, not the size, if
// the bench shows longer SD stalls; the sample-count check reports any loss either way.
static const uint16_t AUDIO_DMA_BLOCK_SAMPLES = 2048;
static const uint8_t AUDIO_DMA_BLOCKS = 4;
// Preamp settle time after the A3 gate turns it on, before the clip starts. ⚠️ PROVISIONAL:
// set from the chosen amplifier's start-up (SCO-216) once it is on the bench.
static const uint16_t AUDIO_PREAMP_WARMUP_MS = 200;
// A recording is abandoned if no DMA block arrives for this long: the ADC or DMA is not running.
static const uint16_t AUDIO_STALL_TIMEOUT_MS = 1000;

#endif /* SCOUT_CONFIG_H */
