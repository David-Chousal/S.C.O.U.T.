/*
 * scout_acoustic — the 14-byte acoustic summary of one recording (ADR-0010, SCO-233).
 *
 * While a recording streams to the SD card, each block of ADC samples also goes through
 * scout_acoustic_feed(); scout_acoustic_finalize() then yields the seven packet fields:
 * band levels (anthro 0–200 Hz, mixed 200–1,000 Hz, bio 1–8 kHz, broadband) in centi-dB re a
 * full-scale sine, an NDSI approximation, a snap count and a clip count.
 *
 * THIS IS A PORT OF analytics/utils/acoustic_summary.py, which is the specification. The two
 * must agree bit for bit; test/test_acoustic checks this against golden vectors that the Python
 * writes. Change the Python first, regenerate the vectors, then change this.
 *
 * Per-sample work is integer only (the SAMD21 has a single-cycle 32-bit multiply but no FPU):
 * 16×16 products, 64-bit accumulators, no division. finalize() runs once per recording and is
 * integer only too (an integer log2), so the firmware does not pull in libm.
 *
 * Hardware-free on purpose (only <stdint.h>/<stddef.h>), like scout_packet, so it builds and
 * unit-tests on the host (`pio test -e native`). The constants live in src/config.h and reach
 * the library through ScoutAcousticConfig (see src/acoustic_config.h).
 */
#ifndef SCOUT_ACOUSTIC_H
#define SCOUT_ACOUSTIC_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* anthro ×2 (4th-order low-pass), mixed high-pass + low-pass, bio high-pass + low-pass. */
#define SCOUT_ACOUSTIC_SECTIONS 6

/* One biquad: y = (gain·(x + c1·x1 + x2) − (a1·y1 + a2·y2)·2^(shift−14)) >> shift.
 * c1 is +2 (low-pass) or −2 (high-pass); a1/a2 are Q14; gain is scaled by 2^shift. */
typedef struct {
    int8_t c1;
    int32_t gain;
    int16_t a1;
    int16_t a2;
    uint8_t shift; /* 14..30 */
} ScoutBiquad;

typedef struct {
    uint8_t adc_bits;      /* 12 for the Feather's ADC on A2 */
    uint8_t input_shift;   /* centred sample << input_shift = working units */
    uint8_t dc_pole_shift; /* DC blocker pole at 1 − 2^-dc_pole_shift */
    uint8_t dc_frac_bits;  /* extra state precision in the DC blocker */
    ScoutBiquad sections[SCOUT_ACOUSTIC_SECTIONS];
    uint8_t snap_threshold_q4;       /* threshold = this/16 × running mean |bio|; ≤ 255 */
    uint16_t snap_min_abs;           /* absolute floor on the threshold, working units */
    uint16_t snap_refractory_samples;
    uint8_t snap_floor_shift;        /* floor time constant 2^shift samples */
    uint16_t snap_warmup_samples;    /* no detection until the floor has settled */
    uint8_t snap_warmup_shift;
    uint16_t clip_margin;            /* counts from either rail that count as clipped */
} ScoutAcousticConfig;

/* The packet fields, in ADR-0010 order. All zero means "no recording". */
typedef struct {
    int16_t lvl_anthro_cdb;
    int16_t lvl_mixed_cdb;
    int16_t lvl_bio_cdb;
    int16_t lvl_broad_cdb;
    int16_t ndsi_e4;
    uint16_t snap_count; /* saturates at 65,535 */
    uint16_t clip_count; /* saturates at 65,535 */
} ScoutAcousticSummary;

/* Level reported for digital silence (zero energy): below anything the ADC can resolve. */
#define SCOUT_ACOUSTIC_LEVEL_SILENT INT16_MIN

typedef struct {
    int16_t x1, x2, y1, y2;
    int32_t err; /* rounding remainder fed back into the next sample */
} ScoutBiquadState;

/* Streaming state for one recording (~150 bytes). Energies are 64-bit: a full-scale signal adds
 * < 2^30 per sample, so they hold for > 2^33 samples (about 4.5 days at 22,050 Hz). */
typedef struct {
    ScoutAcousticConfig cfg;
    ScoutBiquadState sections[SCOUT_ACOUSTIC_SECTIONS];
    uint8_t started;
    int32_t dc_x1;
    int32_t dc_acc;
    uint32_t samples;
    uint64_t energy_anthro, energy_mixed, energy_bio, energy_broad;
    uint16_t snap_count;
    uint16_t clip_count;
    int32_t floor_q8; /* running mean |bio| × 256 */
    uint16_t refractory;
    uint16_t warmup;
} ScoutAcoustic;

/* Reset `a` for a new recording. The config is copied. */
void scout_acoustic_init(ScoutAcoustic *a, const ScoutAcousticConfig *cfg);

/* Feed `n` raw ADC samples (0..2^adc_bits − 1). Blocks may be any size; the result does not
 * depend on how a recording is split. Out-of-range samples are clamped to the rails. */
void scout_acoustic_feed(ScoutAcoustic *a, const uint16_t *samples, size_t n);

/* The summary of everything fed so far. Does not change `a`. No samples → all zero. */
void scout_acoustic_finalize(const ScoutAcoustic *a, ScoutAcousticSummary *out);

/* Integer log2 as Q16, exactly as log2_q16() in the Python reference. `value` must be > 0. */
int32_t scout_acoustic_log2_q16(uint64_t value);

/* Which recording a transmit slot carries: the most recent one since the previous slot.
 * store() keeps the newest summary; take() hands it to the slot and clears it, so a slot with
 * no recording since the last one gets zeros and returns 0 (audio_present = 0). */
typedef struct {
    ScoutAcousticSummary summary;
    uint8_t valid;
} ScoutAcousticSlot;

void scout_acoustic_slot_store(ScoutAcousticSlot *slot, const ScoutAcousticSummary *summary);
uint8_t scout_acoustic_slot_take(ScoutAcousticSlot *slot, ScoutAcousticSummary *out);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_ACOUSTIC_H */
