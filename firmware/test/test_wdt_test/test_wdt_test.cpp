/* Forced watchdog reset for the Stage 5 bench test (lib/scout_wdt_test, gate G6). */
#include <unity.h>

#include "scout_wdt_test.h"

void test_hangs_on_the_chosen_cycle_after_a_normal_boot(void) {
    TEST_ASSERT_TRUE(scout_wdt_test_should_hang(false, SCOUT_WDT_TEST_HANG_CYCLE,
                                                SCOUT_WDT_TEST_HANG_CYCLE));
}

void test_does_not_hang_on_other_cycles(void) {
    TEST_ASSERT_FALSE(scout_wdt_test_should_hang(false, 0, SCOUT_WDT_TEST_HANG_CYCLE));
    TEST_ASSERT_FALSE(scout_wdt_test_should_hang(false, 2, SCOUT_WDT_TEST_HANG_CYCLE));
    TEST_ASSERT_FALSE(scout_wdt_test_should_hang(false, 1000, SCOUT_WDT_TEST_HANG_CYCLE));
}

void test_never_hangs_after_a_watchdog_reset(void) {
    // Otherwise the board would reset forever and the test would never show a clean boot.
    for (uint32_t cycle = 0; cycle < 4; cycle++) {
        TEST_ASSERT_FALSE(scout_wdt_test_should_hang(true, cycle, SCOUT_WDT_TEST_HANG_CYCLE));
    }
}

void test_hang_cycle_logs_a_reading_first(void) {
    // Cycle 0 samples and logs, so record_seq has something to continue from after the reset.
    TEST_ASSERT_GREATER_THAN_UINT32(0, SCOUT_WDT_TEST_HANG_CYCLE);
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_hangs_on_the_chosen_cycle_after_a_normal_boot);
    RUN_TEST(test_does_not_hang_on_other_cycles);
    RUN_TEST(test_never_hangs_after_a_watchdog_reset);
    RUN_TEST(test_hang_cycle_logs_a_reading_first);
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
