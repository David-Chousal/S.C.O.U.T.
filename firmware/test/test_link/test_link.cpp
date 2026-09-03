/* Blind-repetition delivery policy (lib/scout_link). */
#include <unity.h>

#include "scout_link.h"

void test_repeat_count_follows_power_mode(void) {
    // Repeating costs energy, so it degrades with the pack alongside everything else.
    TEST_ASSERT_EQUAL_UINT8(3, scout_link_repeat_count(SCOUT_POWER_NORMAL, 3, 1));
    TEST_ASSERT_EQUAL_UINT8(1, scout_link_repeat_count(SCOUT_POWER_CONSERVE, 3, 1));
    // CRITICAL never transmits at all — main.cpp also gates on this, belt and braces.
    TEST_ASSERT_EQUAL_UINT8(0, scout_link_repeat_count(SCOUT_POWER_CRITICAL, 3, 1));
}

void test_gaps_widen_between_copies(void) {
    // Copies must be decorrelated in time: back-to-back frames share one fade.
    TEST_ASSERT_EQUAL_UINT32(2000, scout_link_repeat_delay_ms(1, 2000));
    TEST_ASSERT_EQUAL_UINT32(4000, scout_link_repeat_delay_ms(2, 2000));
    TEST_ASSERT_EQUAL_UINT32(0, scout_link_repeat_delay_ms(0, 2000));  // guard
}

void test_longest_unpetted_stretch(void) {
    // One transmission plus the widest gap that follows it.
    TEST_ASSERT_EQUAL_UINT32(6000, scout_link_max_segment_ms(3, 2000, 2000));
    TEST_ASSERT_EQUAL_UINT32(4000, scout_link_max_segment_ms(2, 2000, 2000));
    // A single copy has no gap after it — just the transmission.
    TEST_ASSERT_EQUAL_UINT32(2000, scout_link_max_segment_ms(1, 2000, 2000));
    TEST_ASSERT_EQUAL_UINT32(0, scout_link_max_segment_ms(0, 2000, 2000));
}

void test_shipped_policy_leaves_watchdog_headroom(void) {
    // The real numbers: 3 copies, 2 s base gap, 2 s TX budget, 16384 ms WDT.
    TEST_ASSERT_TRUE(scout_link_fits_watchdog(SCOUT_LINK_REPEATS_NORMAL,
                                              SCOUT_LINK_REPEAT_BASE_DELAY_MS,
                                              SCOUT_LINK_TX_BUDGET_MS, 16384));
}

void test_shipped_airtime_fits_the_transmit_budget(void) {
    // The modem config sets airtime; the budget bounds how long send() may block. If a
    // bandwidth or spreading-factor change ever pushes airtime past the budget, the failure
    // mode is a watchdog reboot mid-transmit, in the water, on a buoy nobody can reach.
    // Catch it here instead. Raised from 111 ms to 560 ms on 2026-09-01 when the modem moved
    // to BW500/SF12 for FCC compliance (SCO-19) — that change had ~3.6x of headroom.
    TEST_ASSERT_LESS_THAN_UINT32(SCOUT_LINK_TX_BUDGET_MS, SCOUT_LINK_AIRTIME_MS);

    // And the real airtime, not just the budget, must still leave watchdog headroom.
    TEST_ASSERT_TRUE(scout_link_fits_watchdog(SCOUT_LINK_REPEATS_NORMAL,
                                              SCOUT_LINK_REPEAT_BASE_DELAY_MS,
                                              SCOUT_LINK_AIRTIME_MS, 16384));
}

void test_an_overreaching_policy_is_rejected(void) {
    // This is the guard's whole purpose: a policy that would hang past the watchdog and
    // reboot the buoy mid-transmit must be caught here, not in the water.
    TEST_ASSERT_FALSE(scout_link_fits_watchdog(10, 5000, 2000, 16384));
    TEST_ASSERT_FALSE(scout_link_fits_watchdog(3, 2000, 2000, 8000));  // halve the WDT
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_repeat_count_follows_power_mode);
    RUN_TEST(test_gaps_widen_between_copies);
    RUN_TEST(test_longest_unpetted_stretch);
    RUN_TEST(test_shipped_policy_leaves_watchdog_headroom);
    RUN_TEST(test_shipped_airtime_fits_the_transmit_budget);
    RUN_TEST(test_an_overreaching_policy_is_rejected);
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
