/*
 * scout_capture — the hardware-free half of hydrophone capture (SCO-231, ADR-0011).
 *
 * The SAMD21 driver (src/drivers/audio_capture.h) samples the preamp on A2 into a ring of DMA
 * blocks. Everything here is the logic around that which can be tested off-target: the WAV
 * header the shore pipeline reads, the conversion from 12-bit ADC codes to 16-bit PCM, and the
 * ring accounting that detects dropped samples.
 *
 * WAV format: RIFF, PCM, mono, 16-bit, little-endian, 44-byte header. A 12-bit code becomes
 * (code − 2048) × 16, so the ADC's full scale is the file's full scale and the shore pipeline
 * (scikit-maad, which normalises int16 to ±1) sees the same levels the acoustic summary does.
 *
 * Only <stdint.h>/<stddef.h>, so it builds and unit-tests with `pio test -e native`.
 */
#ifndef SCOUT_CAPTURE_H
#define SCOUT_CAPTURE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_WAV_HEADER_SIZE 44

/* Write the 44-byte header for `n_samples` mono 16-bit samples at `sample_rate` Hz. */
void scout_wav_header(uint8_t out[SCOUT_WAV_HEADER_SIZE], uint32_t sample_rate,
                      uint32_t n_samples);

/* ADC codes (0..2^adc_bits − 1, larger values clamped) → signed 16-bit PCM, centred on
 * mid-scale and scaled so the ADC's full scale is int16 full scale. `out` may alias `in`: each
 * element is read before it is written and both are 2 bytes. */
void scout_wav_convert(const uint16_t *in, int16_t *out, size_t n, uint8_t adc_bits);

/* The DMA ring: `produced` blocks finished by the DMA, `consumed` blocks handled by the main
 * loop, `n_blocks` buffers in the ring. Counters are free-running and wrap safely. */

/* Blocks ready for the main loop. */
static inline uint32_t scout_capture_pending(uint32_t produced, uint32_t consumed) {
    return produced - consumed;
}

/* True once the DMA has started refilling a block the main loop has not consumed yet: the
 * samples in it are lost, so the recording is incomplete. */
static inline int scout_capture_overrun(uint32_t produced, uint32_t consumed, uint32_t n_blocks) {
    return (produced - consumed) >= n_blocks;
}

/* Samples in a recording of `seconds` at `sample_rate` Hz, and the DMA blocks it takes. */
static inline uint32_t scout_capture_expected_samples(uint32_t sample_rate, uint32_t seconds) {
    return sample_rate * seconds;
}
static inline uint32_t scout_capture_blocks_needed(uint32_t samples, uint32_t block_samples) {
    return (samples + block_samples - 1) / block_samples;
}

/* Timer period, in clock ticks, for the sample rate nearest `sample_rate` (rounded), and the
 * rate that period actually gives in mHz, so drift from the nominal rate is visible. */
static inline uint32_t scout_capture_timer_period(uint32_t clock_hz, uint32_t sample_rate) {
    return (clock_hz + sample_rate / 2) / sample_rate;
}
static inline uint32_t scout_capture_actual_rate_mhz(uint32_t clock_hz, uint32_t period) {
    return (uint32_t)(((uint64_t)clock_hz * 1000u + period / 2) / period);
}

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_CAPTURE_H */
