/* Boot state for over-the-air updates (lib/scout_fw_state), SCO-197: the record the scout_boot
 * stub and the application share, and every path through update, trial, confirm and rollback. */
#include <string.h>
#include <unity.h>

#include "scout_fw_state.h"

static const uint32_t V1 = 0x000100u;
static const uint32_t V2 = 0x000200u;

static ScoutFwState adopted(void) {
    ScoutFwState s;
    memset(&s, 0, sizeof(s));
    scout_fw_adopt(&s, V1, 60000, 0x11111111u);
    return s;
}

/* Write `s` into a STATE.BIN image the way the firmware does. */
static void store(uint8_t file[SCOUT_FW_STATE_FILE_BYTES], const ScoutFwState *s) {
    scout_fw_state_encode(s, file + scout_fw_state_offset(s));
}

static void test_crc32_matches_zlib(void) {
    const uint8_t text[] = "123456789";
    TEST_ASSERT_EQUAL_HEX32(0xCBF43926u, scout_crc32_update(0, text, 9));
    uint32_t chained = scout_crc32_update(scout_crc32_update(0, text, 4), text + 4, 5);
    TEST_ASSERT_EQUAL_HEX32(0xCBF43926u, chained);
}

static void test_newest_valid_copy_wins(void) {
    uint8_t file[SCOUT_FW_STATE_FILE_BYTES];
    memset(file, 0xFF, sizeof(file));
    ScoutFwState s = adopted();
    store(file, &s);
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    store(file, &s);

    ScoutFwState got;
    TEST_ASSERT_TRUE(scout_fw_state_load(file, sizeof(file), &got));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_PENDING, got.phase);
    TEST_ASSERT_EQUAL_UINT32(V2, got.new_version);
}

static void test_a_torn_write_leaves_the_previous_state(void) {
    uint8_t file[SCOUT_FW_STATE_FILE_BYTES];
    memset(file, 0xFF, sizeof(file));
    ScoutFwState s = adopted();
    store(file, &s);
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    store(file, &s);
    file[scout_fw_state_offset(&s) + 20] ^= 0xFF;  // power cut mid-write of the newer copy

    ScoutFwState got;
    TEST_ASSERT_TRUE(scout_fw_state_load(file, sizeof(file), &got));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_IDLE, got.phase);
    TEST_ASSERT_EQUAL_UINT32(V1, got.good_version);
}

static void test_empty_card_has_no_state_and_running_image_is_adopted(void) {
    uint8_t file[SCOUT_FW_STATE_FILE_BYTES];
    memset(file, 0, sizeof(file));
    ScoutFwState got;
    TEST_ASSERT_FALSE(scout_fw_state_load(file, sizeof(file), &got));
    TEST_ASSERT_FALSE(scout_fw_state_load(file, 10, &got));
    TEST_ASSERT_TRUE(scout_fw_needs_adopt(false, &got, V1));
    ScoutFwState s = adopted();
    TEST_ASSERT_FALSE(scout_fw_needs_adopt(true, &s, V1));
    TEST_ASSERT_TRUE(scout_fw_needs_adopt(true, &s, V2));  // a new version flashed over USB
}

static void test_update_trial_confirm_happy_path(void) {
    ScoutFwState s = adopted();
    TEST_ASSERT_EQUAL_UINT8(1, scout_fw_receive_slot(&s));
    scout_fw_stage(&s, V2, 61000, 0x22222222u);

    ScoutFwState next;
    TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_NEW, scout_fw_boot_begin(&s, &next));
    TEST_ASSERT_EQUAL_UINT8(1, next.attempts);
    s = next;
    TEST_ASSERT_EQUAL(SCOUT_BOOT_JUMP, scout_fw_boot_after(&s, SCOUT_BOOT_FLASH_NEW, SCOUT_FLASH_OK, &next));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_TRIAL, next.phase);
    TEST_ASSERT_EQUAL_UINT8(0, next.attempts);
    s = next;
    TEST_ASSERT_FALSE(scout_fw_needs_adopt(true, &s, V2));

    scout_fw_confirm(&s);
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_IDLE, s.phase);
    TEST_ASSERT_EQUAL_UINT8(1, s.good_slot);
    TEST_ASSERT_EQUAL_UINT32(V2, s.good_version);
    TEST_ASSERT_EQUAL_UINT8(0, scout_fw_receive_slot(&s));
}

static void test_trial_that_keeps_crashing_is_rolled_back_by_the_stub(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    ScoutFwState next;
    scout_fw_boot_begin(&s, &next);
    scout_fw_boot_after(&next, SCOUT_BOOT_FLASH_NEW, SCOUT_FLASH_OK, &s);

    for (uint8_t boot = 1; boot <= SCOUT_FW_MAX_ATTEMPTS; boot++) {
        TEST_ASSERT_EQUAL(SCOUT_BOOT_JUMP, scout_fw_boot_begin(&s, &next));
        s = next;
    }
    TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_GOOD, scout_fw_boot_begin(&s, &next));
    s = next;
    TEST_ASSERT_EQUAL(SCOUT_BOOT_JUMP, scout_fw_boot_after(&s, SCOUT_BOOT_FLASH_GOOD, SCOUT_FLASH_OK, &next));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_IDLE, next.phase);
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_RB_RESTORED, next.rolled_back);
    TEST_ASSERT_EQUAL_UINT8(0, next.good_slot);
    TEST_ASSERT_EQUAL_UINT32(V1, next.good_version);
}

static void test_trial_that_never_hears_confirm_asks_for_rollback(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    s.phase = SCOUT_FW_TRIAL;
    for (uint8_t slot = 1; slot <= SCOUT_FW_MAX_TRIAL_SLOTS; slot++) {
        TEST_ASSERT_FALSE(scout_fw_trial_slot_missed(&s));
    }
    TEST_ASSERT_TRUE(scout_fw_trial_slot_missed(&s));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_ROLLBACK, s.phase);
    ScoutFwState next;
    TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_GOOD, scout_fw_boot_begin(&s, &next));
}

static void test_bad_staged_file_is_discarded_without_touching_flash(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    ScoutFwState next;
    scout_fw_boot_begin(&s, &next);
    s = next;
    TEST_ASSERT_EQUAL(SCOUT_BOOT_JUMP,
                      scout_fw_boot_after(&s, SCOUT_BOOT_FLASH_NEW, SCOUT_FLASH_SOURCE_BAD, &next));
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_IDLE, next.phase);
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_RB_DISCARDED, next.rolled_back);
    TEST_ASSERT_EQUAL_UINT32(V1, next.good_version);
}

static void test_half_written_flash_is_restored_from_the_good_image(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    ScoutFwState next;
    scout_fw_boot_begin(&s, &next);
    TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_GOOD,
                      scout_fw_boot_after(&next, SCOUT_BOOT_FLASH_NEW, SCOUT_FLASH_FAILED, &s));
}

static void test_power_cut_during_pending_flash_retries_then_gives_up(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    ScoutFwState next;
    for (uint8_t boot = 1; boot <= SCOUT_FW_MAX_ATTEMPTS; boot++) {
        TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_NEW, scout_fw_boot_begin(&s, &next));
        s = next;  // persisted, then the power went before boot_after
    }
    TEST_ASSERT_EQUAL(SCOUT_BOOT_FLASH_GOOD, scout_fw_boot_begin(&s, &next));
}

static void test_missing_good_image_keeps_the_trial_image_as_good(void) {
    ScoutFwState s = adopted();
    scout_fw_stage(&s, V2, 61000, 0x22222222u);
    s.phase = SCOUT_FW_ROLLBACK;
    ScoutFwState next;
    scout_fw_boot_begin(&s, &next);
    s = next;
    scout_fw_boot_after(&s, SCOUT_BOOT_FLASH_GOOD, SCOUT_FLASH_SOURCE_BAD, &next);
    TEST_ASSERT_EQUAL_UINT8(SCOUT_FW_RB_GOOD_MISSING, next.rolled_back);
    TEST_ASSERT_EQUAL_UINT8(1, next.good_slot);
    TEST_ASSERT_EQUAL_UINT32(V2, next.good_version);
}

static void test_slot_paths_are_8_3_names(void) {
    TEST_ASSERT_EQUAL_STRING("FW/A.BIN", scout_fw_slot_path(0));
    TEST_ASSERT_EQUAL_STRING("FW/B.BIN", scout_fw_slot_path(1));
}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_crc32_matches_zlib);
    RUN_TEST(test_newest_valid_copy_wins);
    RUN_TEST(test_a_torn_write_leaves_the_previous_state);
    RUN_TEST(test_empty_card_has_no_state_and_running_image_is_adopted);
    RUN_TEST(test_update_trial_confirm_happy_path);
    RUN_TEST(test_trial_that_keeps_crashing_is_rolled_back_by_the_stub);
    RUN_TEST(test_trial_that_never_hears_confirm_asks_for_rollback);
    RUN_TEST(test_bad_staged_file_is_discarded_without_touching_flash);
    RUN_TEST(test_half_written_flash_is_restored_from_the_good_image);
    RUN_TEST(test_power_cut_during_pending_flash_retries_then_gives_up);
    RUN_TEST(test_missing_good_image_keeps_the_trial_image_as_good);
    RUN_TEST(test_slot_paths_are_8_3_names);
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
