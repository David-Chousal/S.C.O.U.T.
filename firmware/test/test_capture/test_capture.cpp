/* Hardware-free half of hydrophone capture (lib/scout_capture, SCO-231).
 *
 * GOLDEN_WAV_HEADER is what Python's standard `wave` module writes for one 60 s mono 16-bit clip
 * at 22,050 Hz (1,323,000 samples). analytics/utils/tests/test_acoustic_summary.py regenerates it
 * with `wave` and fails if this copy drifts, so the files the buoy writes are files the shore
 * pipeline can open. */
#include <unity.h>

#include "scout_capture.h"
#include "../../src/config.h"

static const uint8_t GOLDEN_WAV_HEADER[SCOUT_WAV_HEADER_SIZE] = {
    0x52, 0x49, 0x46, 0x46, 0x14, 0x60, 0x28, 0x00, 0x57, 0x41, 0x56,
    0x45, 0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x01, 0x00, 0x22, 0x56, 0x00, 0x00, 0x44, 0xac, 0x00, 0x00, 0x02,
    0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0xf0, 0x5f, 0x28, 0x00};

void test_wav_header_matches_python_wave_module(void) {
    uint8_t header[SCOUT_WAV_HEADER_SIZE];
    scout_wav_header(header, 22050, 1323000);
    TEST_ASSERT_EQUAL_HEX8_ARRAY(GOLDEN_WAV_HEADER, header, SCOUT_WAV_HEADER_SIZE);
}

void test_wav_header_for_the_configured_clip(void) {
    uint8_t header[SCOUT_WAV_HEADER_SIZE];
    uint32_t samples =
        scout_capture_expected_samples(ACOUSTIC_SAMPLE_RATE_HZ, ACOUSTIC_CLIP_SECONDS);
    scout_wav_header(header, ACOUSTIC_SAMPLE_RATE_HZ, samples);
    TEST_ASSERT_EQUAL_HEX8_ARRAY(GOLDEN_WAV_HEADER, header, SCOUT_WAV_HEADER_SIZE);
}

void test_convert_maps_adc_full_scale_to_int16_full_scale(void) {
    const uint16_t in[5] = {0, 2048, 4095, 1024, 5000};
    int16_t out[5];
    scout_wav_convert(in, out, 5, 12);
    TEST_ASSERT_EQUAL_INT16(-32768, out[0]);
    TEST_ASSERT_EQUAL_INT16(0, out[1]);
    TEST_ASSERT_EQUAL_INT16(32752, out[2]);
    TEST_ASSERT_EQUAL_INT16(-16384, out[3]);
    TEST_ASSERT_EQUAL_INT16(32752, out[4]);  /* out of range: clamped to the rail */
}

void test_convert_works_in_place(void) {
    uint16_t buf[3] = {0, 2048, 4095};
    scout_wav_convert(buf, (int16_t *)buf, 3, 12);
    TEST_ASSERT_EQUAL_INT16(-32768, (int16_t)buf[0]);
    TEST_ASSERT_EQUAL_INT16(0, (int16_t)buf[1]);
    TEST_ASSERT_EQUAL_INT16(32752, (int16_t)buf[2]);
}

void test_ring_accounting(void) {
    TEST_ASSERT_EQUAL_UINT32(0, scout_capture_pending(7, 7));
    TEST_ASSERT_EQUAL_UINT32(3, scout_capture_pending(10, 7));
    TEST_ASSERT_FALSE(scout_capture_overrun(10, 7, 4));  /* three full blocks waiting: fine */
    TEST_ASSERT_TRUE(scout_capture_overrun(11, 7, 4));   /* DMA is refilling block 7: lost */
    /* free-running counters wrap */
    TEST_ASSERT_EQUAL_UINT32(2, scout_capture_pending(1u, 0xFFFFFFFFu));
    TEST_ASSERT_FALSE(scout_capture_overrun(1u, 0xFFFFFFFFu, 4));
}

void test_one_minute_clip_sizes(void) {
    uint32_t samples = scout_capture_expected_samples(22050, 60);
    TEST_ASSERT_EQUAL_UINT32(1323000u, samples);  /* the dropped-sample check's target */
    TEST_ASSERT_EQUAL_UINT32(646u, scout_capture_blocks_needed(samples, 2048));
}

void test_timer_period_for_22050_hz_on_48_mhz(void) {
    uint32_t period = scout_capture_timer_period(48000000u, 22050u);
    TEST_ASSERT_EQUAL_UINT32(2177u, period);
    /* 48 MHz / 2177 = 22,048.69 Hz: 59 ppm slow, 0.08 s over a 60 s clip. */
    TEST_ASSERT_EQUAL_UINT32(22048691u, scout_capture_actual_rate_mhz(48000000u, period));
}

void test_config_buffers_fit_and_hold_more_than_a_slow_sd_write(void) {
    TEST_ASSERT_GREATER_OR_EQUAL_UINT32(3, AUDIO_DMA_BLOCKS);
    /* (blocks − 1) of audio can queue while one SD write stalls. */
    uint32_t slack_ms = (AUDIO_DMA_BLOCKS - 1) * AUDIO_DMA_BLOCK_SAMPLES * 1000u /
                        ACOUSTIC_SAMPLE_RATE_HZ;
    TEST_ASSERT_GREATER_OR_EQUAL_UINT32(250u, slack_ms);
    TEST_ASSERT_LESS_OR_EQUAL_UINT32(16384u, AUDIO_DMA_BLOCKS * AUDIO_DMA_BLOCK_SAMPLES * 2u);
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_wav_header_matches_python_wave_module);
    RUN_TEST(test_wav_header_for_the_configured_clip);
    RUN_TEST(test_convert_maps_adc_full_scale_to_int16_full_scale);
    RUN_TEST(test_convert_works_in_place);
    RUN_TEST(test_ring_accounting);
    RUN_TEST(test_one_minute_clip_sizes);
    RUN_TEST(test_timer_period_for_22050_hz_on_48_mhz);
    RUN_TEST(test_config_buffers_fit_and_hold_more_than_a_slow_sd_write);
    UNITY_END();
}

#ifdef ARDUINO
#include <Arduino.h>
void setup() {
    delay(2000);
    run_all();
}
void loop() {}
#else
int main() {
    run_all();
    return 0;
}
#endif
