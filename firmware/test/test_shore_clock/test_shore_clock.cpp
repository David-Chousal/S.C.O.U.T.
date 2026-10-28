/* Where the shore station's time came from (lib/scout_shore_clock, SCO-237). */
#include <unity.h>

#include "scout_shore_clock.h"

static const uint32_t MIN_VALID = 1767225600u; /* 2026-01-01 */
static const uint32_t NOW = 1803859200u;

void setUp(void) {}
void tearDown(void) {}

void test_power_on_with_no_time_is_unset_and_wants_ntp(void) {
    ScoutShoreClock c;
    scout_clock_boot(&c, 5, MIN_VALID);
    TEST_ASSERT_FALSE(scout_clock_valid(&c));
    TEST_ASSERT_TRUE(scout_clock_ntp_due(&c, 5));
    TEST_ASSERT_EQUAL_STRING("unset", scout_clock_source_name(c.source));
}

void test_a_clock_that_survived_a_reset_is_kept_but_still_wants_ntp(void) {
    ScoutShoreClock c;
    scout_clock_boot(&c, NOW, MIN_VALID);
    TEST_ASSERT_TRUE(scout_clock_valid(&c));
    TEST_ASSERT_EQUAL_STRING("kept", scout_clock_source_name(c.source));
    TEST_ASSERT_TRUE(scout_clock_ntp_due(&c, NOW));
}

void test_a_manual_set_is_valid_and_ntp_still_replaces_it(void) {
    ScoutShoreClock c;
    scout_clock_boot(&c, 5, MIN_VALID);
    scout_clock_set(&c, SCOUT_CLOCK_MANUAL, NOW);
    TEST_ASSERT_TRUE(scout_clock_valid(&c));
    TEST_ASSERT_TRUE(scout_clock_ntp_due(&c, NOW));
}

void test_ntp_is_due_again_only_after_the_resync_interval(void) {
    ScoutShoreClock c;
    scout_clock_set(&c, SCOUT_CLOCK_NTP, NOW);
    TEST_ASSERT_FALSE(scout_clock_ntp_due(&c, NOW + SCOUT_CLOCK_NTP_RESYNC_S - 1));
    TEST_ASSERT_TRUE(scout_clock_ntp_due(&c, NOW + SCOUT_CLOCK_NTP_RESYNC_S));
}

void test_a_clock_moved_backwards_wants_ntp(void) {
    ScoutShoreClock c;
    scout_clock_set(&c, SCOUT_CLOCK_NTP, NOW);
    TEST_ASSERT_TRUE(scout_clock_ntp_due(&c, NOW - 10));
}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_power_on_with_no_time_is_unset_and_wants_ntp);
    RUN_TEST(test_a_clock_that_survived_a_reset_is_kept_but_still_wants_ntp);
    RUN_TEST(test_a_manual_set_is_valid_and_ntp_still_replaces_it);
    RUN_TEST(test_ntp_is_due_again_only_after_the_resync_interval);
    RUN_TEST(test_a_clock_moved_backwards_wants_ntp);
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
