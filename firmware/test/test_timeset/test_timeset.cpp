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

void test_a_clock_is_trusted_only_when_the_rtc_answers_kept_power_and_reads_a_real_date(void) {
    const uint32_t now = 1803859200u; /* 2027-02-28 */
    TEST_ASSERT_TRUE(scout_clock_trusted(true, false, now, MIN_EPOCH));
}

void test_a_clock_that_lost_power_is_not_trusted_even_if_its_date_looks_plausible(void) {
    /* The oscillator stopped at some point, so the time is behind by an unknown amount. */
    TEST_ASSERT_FALSE(scout_clock_trusted(true, true, 1803859200u, MIN_EPOCH));
}

void test_a_clock_reading_before_the_project_began_is_not_trusted(void) {
    /* A PCF8523 that lost power restarts at 2000-01-01. */
    TEST_ASSERT_FALSE(scout_clock_trusted(true, false, 946684800u, MIN_EPOCH));
}

void test_no_rtc_means_no_trusted_clock(void) {
    TEST_ASSERT_FALSE(scout_clock_trusted(false, false, 1803859200u, MIN_EPOCH));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_accepts_a_unix_epoch_after_T);
    RUN_TEST(test_ignores_trailing_line_endings);
    RUN_TEST(test_rejects_anything_that_is_not_the_command);
    RUN_TEST(test_rejects_times_before_the_project_began);
    RUN_TEST(test_rejects_values_that_overflow_32_bits);
    RUN_TEST(test_a_clock_is_trusted_only_when_the_rtc_answers_kept_power_and_reads_a_real_date);
    RUN_TEST(test_a_clock_that_lost_power_is_not_trusted_even_if_its_date_looks_plausible);
    RUN_TEST(test_a_clock_reading_before_the_project_began_is_not_trusted);
    RUN_TEST(test_no_rtc_means_no_trusted_clock);
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
