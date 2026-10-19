/* Bench clock-set command (lib/scout_timeset), SCO-201. */
#include <unity.h>

#include "scout_timeset.h"

static const uint32_t MIN_EPOCH = 1767225600u;  // 2026-01-01T00:00:00Z

void test_accepts_a_unix_epoch_after_T(void) {
    uint32_t epoch = 0;
    TEST_ASSERT_TRUE(scout_parse_time_command("T1792440000", MIN_EPOCH, &epoch));
    TEST_ASSERT_EQUAL_UINT32(1792440000u, epoch);
}

void test_ignores_trailing_line_endings(void) {
    uint32_t epoch = 0;
    TEST_ASSERT_TRUE(scout_parse_time_command("T1792440000\r\n", MIN_EPOCH, &epoch));
    TEST_ASSERT_EQUAL_UINT32(1792440000u, epoch);
}

void test_rejects_anything_that_is_not_the_command(void) {
    uint32_t epoch = 42;
    TEST_ASSERT_FALSE(scout_parse_time_command("hello", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command("T", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command("T17924a0000", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command("", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command(NULL, MIN_EPOCH, &epoch));
    TEST_ASSERT_EQUAL_UINT32(42u, epoch);  // untouched on failure
}

void test_rejects_times_before_the_project_began(void) {
    uint32_t epoch = 0;
    // 1970 is what an unset clock reports; accepting it would hide the very fault this fixes.
    TEST_ASSERT_FALSE(scout_parse_time_command("T0", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command("T1767225599", MIN_EPOCH, &epoch));
}

void test_rejects_values_that_overflow_32_bits(void) {
    uint32_t epoch = 0;
    TEST_ASSERT_FALSE(scout_parse_time_command("T4294967296", MIN_EPOCH, &epoch));
    TEST_ASSERT_FALSE(scout_parse_time_command("T99999999999999", MIN_EPOCH, &epoch));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_accepts_a_unix_epoch_after_T);
    RUN_TEST(test_ignores_trailing_line_endings);
    RUN_TEST(test_rejects_anything_that_is_not_the_command);
    RUN_TEST(test_rejects_times_before_the_project_began);
    RUN_TEST(test_rejects_values_that_overflow_32_bits);
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
