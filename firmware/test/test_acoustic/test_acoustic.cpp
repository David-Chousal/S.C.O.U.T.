/* Acoustic summary (lib/scout_acoustic) against the Python reference.
 *
 * analytics/utils/acoustic_summary.py is the specification. golden_vectors.h holds its outputs
 * for synthetic inputs (regenerated here by the same integer generator) and for a real 200 ms
 * Sesoko excerpt. The tolerance is zero: every field must match bit for bit, because both sides
 * are integer arithmetic. A mismatch means the port has drifted from the reference. */
#include <unity.h>

#include "scout_acoustic.h"
#include "../../src/acoustic_config.h"
#include "golden_vectors.h"

static ScoutAcousticConfig g_cfg;

/* Same generator as synth() in acoustic_summary.py. */
typedef struct {
    int kind;
    uint32_t p1, p2, p3;
    uint32_t phase, state, i;
} Synth;

static Synth synth_start(int kind, uint32_t p1, uint32_t p2, uint32_t p3) {
    Synth s = {kind, p1, p2, p3, 0, p1 ? p1 : 1u, 0};
    return s;
}

static uint16_t synth_next(Synth *g) {
    int32_t s = 0;
    switch (g->kind) {
        case SCOUT_SYNTH_SILENCE:
            s = (int32_t)g->p1;
            break;
        case SCOUT_SYNTH_TONE:
            s = 2048 + (((int32_t)g->p2 * GOLDEN_SINE_Q15[g->phase >> 24]) >> 15);
            g->phase += g->p1;
            break;
        case SCOUT_SYNTH_NOISE:
        case SCOUT_SYNTH_IMPULSES: {
            g->state ^= g->state << 13;
            g->state ^= g->state >> 17;
            g->state ^= g->state << 5;
            int32_t amplitude = g->kind == SCOUT_SYNTH_NOISE ? (int32_t)g->p2 : 4;
            s = 2048 + ((((int32_t)(g->state >> 20) - 2048) * amplitude) >> 11);
            if (g->kind == SCOUT_SYNTH_IMPULSES && g->i % g->p3 == g->p3 / 2) {
                s += (int32_t)g->p2;
            }
            break;
        }
        case SCOUT_SYNTH_SQUARE:
            s = ((g->i / g->p1) % 2 == 0) ? 4095 : 0;
            break;
    }
    g->i++;
    return (uint16_t)(s < 0 ? 0 : s > 4095 ? 4095 : s);
}

/* Feed `n` synthesised samples in blocks of `block` (≤ 512). */
static void feed_synth(ScoutAcoustic *a, Synth *g, uint32_t n, uint32_t block) {
    uint16_t buf[512];
    while (n > 0) {
        uint32_t take = n < block ? n : block;
        for (uint32_t i = 0; i < take; i++) {
            buf[i] = synth_next(g);
        }
        scout_acoustic_feed(a, buf, take);
        n -= take;
    }
}

static ScoutAcousticSummary summarize_synth(int kind, uint32_t n, uint32_t p1, uint32_t p2,
                                            uint32_t p3, uint32_t block) {
    ScoutAcoustic a;
    scout_acoustic_init(&a, &g_cfg);
    Synth g = synth_start(kind, p1, p2, p3);
    feed_synth(&a, &g, n, block);
    ScoutAcousticSummary r;
    scout_acoustic_finalize(&a, &r);
    return r;
}

static void assert_summary(const int16_t expect[5], uint16_t snaps, uint16_t clips,
                           const ScoutAcousticSummary *r, const char *name) {
    TEST_ASSERT_EQUAL_INT16_MESSAGE(expect[0], r->lvl_anthro_cdb, name);
    TEST_ASSERT_EQUAL_INT16_MESSAGE(expect[1], r->lvl_mixed_cdb, name);
    TEST_ASSERT_EQUAL_INT16_MESSAGE(expect[2], r->lvl_bio_cdb, name);
    TEST_ASSERT_EQUAL_INT16_MESSAGE(expect[3], r->lvl_broad_cdb, name);
    TEST_ASSERT_EQUAL_INT16_MESSAGE(expect[4], r->ndsi_e4, name);
    TEST_ASSERT_EQUAL_UINT16_MESSAGE(snaps, r->snap_count, name);
    TEST_ASSERT_EQUAL_UINT16_MESSAGE(clips, r->clip_count, name);
}

void test_synthetic_vectors_match_python_bit_for_bit(void) {
    for (size_t v = 0; v < sizeof(GOLDEN_SYNTH) / sizeof(GOLDEN_SYNTH[0]); v++) {
        const GoldenSynth *g = &GOLDEN_SYNTH[v];
        ScoutAcousticSummary r = summarize_synth(g->kind, g->n, g->p1, g->p2, g->p3, 256);
        assert_summary(g->expect, g->expect_snaps, g->expect_clips, &r, g->name);
    }
}

void test_real_sesoko_excerpt_matches_python_bit_for_bit(void) {
    ScoutAcoustic a;
    scout_acoustic_init(&a, &g_cfg);
    scout_acoustic_feed(&a, GOLDEN_REAL, sizeof(GOLDEN_REAL) / sizeof(GOLDEN_REAL[0]));
    ScoutAcousticSummary r;
    scout_acoustic_finalize(&a, &r);
    assert_summary(GOLDEN_REAL_EXPECT, GOLDEN_REAL_SNAPS, GOLDEN_REAL_CLIPS, &r, "real");
}

void test_result_does_not_depend_on_block_size(void) {
    const GoldenSynth *g = &GOLDEN_SYNTH[5]; /* impulses: exercises every stateful stage */
    ScoutAcousticSummary one = summarize_synth(g->kind, g->n, g->p1, g->p2, g->p3, 1);
    ScoutAcousticSummary odd = summarize_synth(g->kind, g->n, g->p1, g->p2, g->p3, 37);
    assert_summary(g->expect, g->expect_snaps, g->expect_clips, &one, "block 1");
    assert_summary(g->expect, g->expect_snaps, g->expect_clips, &odd, "block 37");
}

void test_no_samples_gives_all_zero_fields(void) {
    ScoutAcoustic a;
    scout_acoustic_init(&a, &g_cfg);
    ScoutAcousticSummary r;
    scout_acoustic_finalize(&a, &r);
    const int16_t zero[5] = {0, 0, 0, 0, 0};
    assert_summary(zero, 0, 0, &r, "empty");
}

void test_silence_reads_as_silent_with_no_events(void) {
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_SILENCE, 22050, 2048, 0, 0, 512);
    TEST_ASSERT_EQUAL_INT16(SCOUT_ACOUSTIC_LEVEL_SILENT, r.lvl_broad_cdb);
    TEST_ASSERT_EQUAL_INT16(SCOUT_ACOUSTIC_LEVEL_SILENT, r.lvl_bio_cdb);
    TEST_ASSERT_EQUAL_INT16(0, r.ndsi_e4);
    TEST_ASSERT_EQUAL_UINT16(0, r.snap_count);
    TEST_ASSERT_EQUAL_UINT16(0, r.clip_count);
}

void test_full_scale_sine_is_zero_dbfs_broadband(void) {
    uint32_t inc = (uint32_t)(1000.0 / 22050.0 * 4294967296.0 + 0.5);
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_TONE, 22050, inc, 2047, 0, 512);
    TEST_ASSERT_INT16_WITHIN(5, 0, r.lvl_broad_cdb);
}

/* A tone must read loudest in its own band, by at least 10 dB over the other two. */
static void assert_tone_lands_in_band(double freq_hz, int band) {
    uint32_t inc = (uint32_t)(freq_hz / 22050.0 * 4294967296.0 + 0.5);
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_TONE, 22050, inc, 1000, 0, 512);
    int16_t levels[3] = {r.lvl_anthro_cdb, r.lvl_mixed_cdb, r.lvl_bio_cdb};
    for (int other = 0; other < 3; other++) {
        if (other != band) {
            TEST_ASSERT_GREATER_THAN_INT16(levels[other] + 1000, levels[band]);
        }
    }
    /* amplitude 1000 of 2047 counts is −6.2 dBFS; allow the mixed band's 0.4 dB skirt loss */
    TEST_ASSERT_INT16_WITHIN(60, -622, levels[band]);
}

void test_pure_tone_in_each_band(void) {
    assert_tone_lands_in_band(100.0, 0);
    assert_tone_lands_in_band(500.0, 1);
    assert_tone_lands_in_band(3000.0, 2);
}

void test_ndsi_sign_follows_the_dominant_band(void) {
    TEST_ASSERT_LESS_THAN_INT16(-9900, GOLDEN_SYNTH[1].expect[4]); /* 100 Hz: anthro */
    TEST_ASSERT_GREATER_THAN_INT16(9900, GOLDEN_SYNTH[3].expect[4]); /* 3 kHz: bio */
}

void test_full_scale_square_clips_every_sample(void) {
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_SQUARE, 5000, 11, 0, 0, 512);
    TEST_ASSERT_EQUAL_UINT16(5000, r.clip_count);
}

void test_clip_margin_edges(void) {
    const uint16_t inside[4] = {0, 16, 4079, 4095};
    const uint16_t outside[4] = {17, 2048, 4078, 3000};
    ScoutAcoustic a;
    ScoutAcousticSummary r;
    scout_acoustic_init(&a, &g_cfg);
    scout_acoustic_feed(&a, inside, 4);
    scout_acoustic_finalize(&a, &r);
    TEST_ASSERT_EQUAL_UINT16(4, r.clip_count);
    scout_acoustic_init(&a, &g_cfg);
    scout_acoustic_feed(&a, outside, 4);
    scout_acoustic_finalize(&a, &r);
    TEST_ASSERT_EQUAL_UINT16(0, r.clip_count);
}

void test_out_of_range_samples_are_clamped_to_the_rail(void) {
    const uint16_t wild[3] = {4096, 60000, 4095};
    ScoutAcoustic a;
    ScoutAcousticSummary r;
    scout_acoustic_init(&a, &g_cfg);
    scout_acoustic_feed(&a, wild, 3);
    scout_acoustic_finalize(&a, &r);
    TEST_ASSERT_EQUAL_UINT16(3, r.clip_count);
}

void test_clip_count_saturates(void) {
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_SILENCE, 70000, 4095, 0, 0, 512);
    TEST_ASSERT_EQUAL_UINT16(UINT16_MAX, r.clip_count);
}

void test_impulse_train_counts_each_impulse_once(void) {
    /* One spike every 200 samples for 1 s; detection starts after the 2,048-sample warm-up. */
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_IMPULSES, 22050, 99, 1500, 200, 512);
    uint32_t after_warmup = 0;
    for (uint32_t i = ACOUSTIC_SNAP_WARMUP_SAMPLES; i < 22050; i++) {
        after_warmup += (i % 200 == 100);
    }
    TEST_ASSERT_EQUAL_UINT16(after_warmup, r.snap_count);
}

void test_refractory_window_merges_close_impulses(void) {
    /* Pairs of spikes 30 samples apart (inside the 66-sample window), pairs 400 apart. */
    uint16_t buf[400];
    ScoutAcoustic a;
    scout_acoustic_init(&a, &g_cfg);
    Synth g = synth_start(SCOUT_SYNTH_NOISE, 5, 4, 0);
    uint32_t pairs = 0;
    for (uint32_t block = 0; block < 60; block++) {
        for (uint32_t i = 0; i < 400; i++) {
            buf[i] = synth_next(&g);
        }
        buf[100] += 1500;
        buf[130] += 1500;
        scout_acoustic_feed(&a, buf, 400);
        pairs += (block * 400 + 100 >= ACOUSTIC_SNAP_WARMUP_SAMPLES);
    }
    ScoutAcousticSummary r;
    scout_acoustic_finalize(&a, &r);
    TEST_ASSERT_EQUAL_UINT16(pairs, r.snap_count);
}

void test_white_noise_alone_counts_no_snaps(void) {
    ScoutAcousticSummary r = summarize_synth(SCOUT_SYNTH_NOISE, 22050 * 5, 4242, 600, 0, 512);
    TEST_ASSERT_EQUAL_UINT16(0, r.snap_count);
}

void test_snap_count_saturates(void) {
    /* One spike every 80 samples (> the 66-sample window) for 80 × 70,000 samples. */
    ScoutAcousticSummary r =
        summarize_synth(SCOUT_SYNTH_IMPULSES, 80u * 70000u, 3, 1500, 80, 512);
    TEST_ASSERT_EQUAL_UINT16(UINT16_MAX, r.snap_count);
}

void test_finalize_leaves_state_unchanged(void) {
    ScoutAcoustic a;
    scout_acoustic_init(&a, &g_cfg);
    Synth g = synth_start(SCOUT_SYNTH_NOISE, 9, 300, 0);
    feed_synth(&a, &g, 3000, 512);
    ScoutAcousticSummary first, second;
    scout_acoustic_finalize(&a, &first);
    scout_acoustic_finalize(&a, &second);
    TEST_ASSERT_EQUAL_MEMORY(&first, &second, sizeof(first));
}

void test_log2_q16_matches_python(void) {
    TEST_ASSERT_EQUAL_INT32(0, scout_acoustic_log2_q16(1));
    TEST_ASSERT_EQUAL_INT32(65536, scout_acoustic_log2_q16(2));
    TEST_ASSERT_EQUAL_INT32(103872, scout_acoustic_log2_q16(3));
    TEST_ASSERT_EQUAL_INT32(2612470, scout_acoustic_log2_q16(1000000000000ULL));
    TEST_ASSERT_EQUAL_INT32(4128768, scout_acoustic_log2_q16((1ULL << 63) + 12345));
}

void test_slot_carries_the_latest_recording_once(void) {
    ScoutAcousticSlot slot = {ScoutAcousticSummary(), 0};
    ScoutAcousticSummary out;
    TEST_ASSERT_EQUAL_UINT8(0, scout_acoustic_slot_take(&slot, &out)); /* nothing recorded */
    TEST_ASSERT_EQUAL_INT16(0, out.lvl_broad_cdb);

    ScoutAcousticSummary older = ScoutAcousticSummary();
    older.snap_count = 5;
    ScoutAcousticSummary newer = ScoutAcousticSummary();
    newer.snap_count = 9;
    scout_acoustic_slot_store(&slot, &older);
    scout_acoustic_slot_store(&slot, &newer);
    TEST_ASSERT_EQUAL_UINT8(1, scout_acoustic_slot_take(&slot, &out));
    TEST_ASSERT_EQUAL_UINT16(9, out.snap_count); /* most recent wins */

    TEST_ASSERT_EQUAL_UINT8(0, scout_acoustic_slot_take(&slot, &out)); /* next slot: zeros */
    TEST_ASSERT_EQUAL_UINT16(0, out.snap_count);
}

static void run_all() {
    g_cfg = scout_acoustic_build_config();
    UNITY_BEGIN();
    RUN_TEST(test_synthetic_vectors_match_python_bit_for_bit);
    RUN_TEST(test_real_sesoko_excerpt_matches_python_bit_for_bit);
    RUN_TEST(test_result_does_not_depend_on_block_size);
    RUN_TEST(test_no_samples_gives_all_zero_fields);
    RUN_TEST(test_silence_reads_as_silent_with_no_events);
    RUN_TEST(test_full_scale_sine_is_zero_dbfs_broadband);
    RUN_TEST(test_pure_tone_in_each_band);
    RUN_TEST(test_ndsi_sign_follows_the_dominant_band);
    RUN_TEST(test_full_scale_square_clips_every_sample);
    RUN_TEST(test_clip_margin_edges);
    RUN_TEST(test_out_of_range_samples_are_clamped_to_the_rail);
    RUN_TEST(test_clip_count_saturates);
    RUN_TEST(test_impulse_train_counts_each_impulse_once);
    RUN_TEST(test_refractory_window_merges_close_impulses);
    RUN_TEST(test_white_noise_alone_counts_no_snaps);
    RUN_TEST(test_snap_count_saturates);
    RUN_TEST(test_finalize_leaves_state_unchanged);
    RUN_TEST(test_log2_q16_matches_python);
    RUN_TEST(test_slot_carries_the_latest_recording_once);
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
