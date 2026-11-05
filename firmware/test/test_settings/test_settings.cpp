/* The remote settings registry (lib/scout_settings). The digest vector is reproduced by
 * shore/scout_shore/settings.py and console/worker/buoy-settings.js; see their tests. */
#include <string.h>
#include <unity.h>

#include "scout_settings.h"

static const uint32_t BASE_SLOTS[3] = {600, 29400, 58200};
static const uint8_t BASE_HOURS[3] = {0, 8, 16};

static ScoutSettings defaults(void) {
    ScoutSettings s;
    scout_settings_defaults(&s);
    return s;
}

void setUp(void) {}
void tearDown(void) {}

void test_ids_match_their_table_rows(void) {
    for (uint8_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        TEST_ASSERT_EQUAL_UINT8(i + 1, SCOUT_SETTING_SPECS[i].id);
    }
}

void test_defaults_are_todays_firmware_and_valid(void) {
    ScoutSettings s = defaults();
    TEST_ASSERT_EQUAL_UINT16(3, scout_setting(&s, SCOUT_SET_TX_COUNT));
    TEST_ASSERT_EQUAL_UINT16(30, scout_setting(&s, SCOUT_SET_SAMPLE_MIN));
    TEST_ASSERT_EQUAL_UINT16(3200, scout_setting(&s, SCOUT_SET_CONSERVE_MV));
    TEST_ASSERT_TRUE(scout_settings_valid(&s));
}

void test_default_digest_is_the_shared_vector(void) {
    ScoutSettings s = defaults();
    TEST_ASSERT_EQUAL_HEX16(0xE674, scout_settings_digest(&s));
}

void test_digest_changes_with_any_value(void) {
    ScoutSettings a = defaults();
    ScoutSettings b = defaults();
    b.v[SCOUT_SET_HUMIDITY_PCT - 1] = 71;
    TEST_ASSERT_NOT_EQUAL(scout_settings_digest(&a), scout_settings_digest(&b));
}

void test_choice_settings_take_only_their_choices(void) {
    TEST_ASSERT_TRUE(scout_setting_value_ok(SCOUT_SET_SAMPLE_MIN, 15));
    TEST_ASSERT_TRUE(scout_setting_value_ok(SCOUT_SET_SAMPLE_MIN, 60));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_SAMPLE_MIN, 45));
    TEST_ASSERT_TRUE(scout_setting_value_ok(SCOUT_SET_AUDIO_CLIP_S, 0));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_AUDIO_CLIP_S, 20));
}

void test_range_settings_check_bounds_and_step(void) {
    TEST_ASSERT_TRUE(scout_setting_value_ok(SCOUT_SET_CONSERVE_MV, 3000));
    TEST_ASSERT_TRUE(scout_setting_value_ok(SCOUT_SET_CONSERVE_MV, 3600));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_CONSERVE_MV, 3605));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_CONSERVE_MV, 2990));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_TX_COUNT, 0));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SET_SLOT_PHASE, 8));
    TEST_ASSERT_FALSE(scout_setting_value_ok(0, 1));
    TEST_ASSERT_FALSE(scout_setting_value_ok(SCOUT_SETTINGS_COUNT + 1, 1));
}

void test_critical_must_sit_50_mv_under_conserve(void) {
    ScoutSettings s = defaults();
    s.v[SCOUT_SET_CONSERVE_MV - 1] = 3200;
    s.v[SCOUT_SET_CRITICAL_MV - 1] = 3150;
    TEST_ASSERT_TRUE(scout_settings_valid(&s));
    s.v[SCOUT_SET_CRITICAL_MV - 1] = 3160;
    TEST_ASSERT_FALSE(scout_settings_valid(&s));
}

void test_slots_follow_count_and_phase(void) {
    ScoutSettings s = defaults();
    uint32_t out[3];
    TEST_ASSERT_EQUAL(3, scout_settings_tx_slots(&s, BASE_SLOTS, out));
    TEST_ASSERT_EQUAL_UINT32(600, out[0]);
    s.v[SCOUT_SET_TX_COUNT - 1] = 2;
    s.v[SCOUT_SET_SLOT_PHASE - 1] = 7;
    TEST_ASSERT_EQUAL(2, scout_settings_tx_slots(&s, BASE_SLOTS, out));
    TEST_ASSERT_EQUAL_UINT32(600 + 7 * 3600, out[0]);
    TEST_ASSERT_EQUAL_UINT32(58200 + 7 * 3600, out[1]);
    TEST_ASSERT_TRUE(out[1] < 86400u);
}

void test_audio_hours_move_with_the_phase(void) {
    ScoutSettings s = defaults();
    s.v[SCOUT_SET_SLOT_PHASE - 1] = 5;
    uint8_t hours[3];
    scout_settings_audio_hours(&s, BASE_HOURS, 3, hours);
    TEST_ASSERT_EQUAL_UINT8(5, hours[0]);
    TEST_ASSERT_EQUAL_UINT8(13, hours[1]);
    TEST_ASSERT_EQUAL_UINT8(21, hours[2]);
}

void test_sample_interval_in_seconds(void) {
    ScoutSettings s = defaults();
    TEST_ASSERT_EQUAL_UINT32(1800, scout_settings_sample_interval_s(&s));
}

void test_block_round_trips(void) {
    ScoutSettings s = defaults();
    s.v[SCOUT_SET_TX_COUNT - 1] = 1;
    uint8_t block[SCOUT_SETTINGS_BLOCK_SIZE];
    TEST_ASSERT_EQUAL(SCOUT_SETTINGS_BLOCK_SIZE, scout_settings_block_encode(&s, 1803859200u, block));
    ScoutSettings read;
    uint32_t counter = 0;
    TEST_ASSERT_TRUE(scout_settings_block_decode(block, sizeof(block), &read, &counter));
    TEST_ASSERT_EQUAL_MEMORY(&s, &read, sizeof(s));
    TEST_ASSERT_EQUAL_UINT32(1803859200u, counter);
}

void test_block_refuses_erased_corrupt_or_invalid_flash(void) {
    ScoutSettings s = defaults();
    ScoutSettings untouched = defaults();
    uint32_t counter = 7;
    uint8_t block[SCOUT_SETTINGS_BLOCK_SIZE];
    memset(block, 0xFF, sizeof(block));  // erased flash
    TEST_ASSERT_FALSE(scout_settings_block_decode(block, sizeof(block), &s, &counter));
    scout_settings_block_encode(&s, 1, block);
    block[8] ^= 0x01;  // a flipped bit in a value
    TEST_ASSERT_FALSE(scout_settings_block_decode(block, sizeof(block), &s, &counter));
    TEST_ASSERT_EQUAL_MEMORY(&untouched, &s, sizeof(s));
    TEST_ASSERT_EQUAL_UINT32(7, counter);
    ScoutSettings bad = defaults();
    bad.v[SCOUT_SET_SAMPLE_MIN - 1] = 45;  // well-formed block, value the table refuses
    scout_settings_block_encode(&bad, 1, block);
    TEST_ASSERT_FALSE(scout_settings_block_decode(block, sizeof(block), &s, &counter));
}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_ids_match_their_table_rows);
    RUN_TEST(test_defaults_are_todays_firmware_and_valid);
    RUN_TEST(test_default_digest_is_the_shared_vector);
    RUN_TEST(test_digest_changes_with_any_value);
    RUN_TEST(test_choice_settings_take_only_their_choices);
    RUN_TEST(test_range_settings_check_bounds_and_step);
    RUN_TEST(test_critical_must_sit_50_mv_under_conserve);
    RUN_TEST(test_slots_follow_count_and_phase);
    RUN_TEST(test_audio_hours_move_with_the_phase);
    RUN_TEST(test_sample_interval_in_seconds);
    RUN_TEST(test_block_round_trips);
    RUN_TEST(test_block_refuses_erased_corrupt_or_invalid_flash);
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
