/* Duty-cycle scheduling math (lib/scout_scheduler). */
#include <unity.h>

#include "scout_scheduler.h"

void test_next_wake_aligns_to_grid(void) {
    // 30-minute grid: 00:10 → 00:30, exactly-on-boundary → next boundary.
    TEST_ASSERT_EQUAL_UINT32(1800, scout_next_wake_epoch(600, 1800));
    TEST_ASSERT_EQUAL_UINT32(3600, scout_next_wake_epoch(1800, 1800));
    TEST_ASSERT_EQUAL_UINT32(100, scout_next_wake_epoch(100, 0));  // guard: interval 0
}

void test_transmit_cycle_is_daily(void) {
    TEST_ASSERT_TRUE(scout_is_transmit_cycle(1000, 0, 86400));       // never sent → send
    TEST_ASSERT_FALSE(scout_is_transmit_cycle(90000, 87000, 86400)); // <24h since last
    TEST_ASSERT_TRUE(scout_is_transmit_cycle(87000 + 86400, 87000, 86400)); // exactly 24h
    TEST_ASSERT_FALSE(scout_is_transmit_cycle(500, 1000, 86400));    // clock went backwards
}

void test_battery_gate(void) {
    TEST_ASSERT_TRUE(scout_battery_ok(3100, 3100));
    TEST_ASSERT_TRUE(scout_battery_ok(3300, 3100));
    TEST_ASSERT_FALSE(scout_battery_ok(3099, 3100));
}

void test_audio_only_on_scheduled_hours(void) {
    const uint8_t hours[] = {0, 8, 16};
    // 2027-03-01 08:00:00Z = 1803859200 + 8*3600.
    uint32_t at_0800 = 1803859200u + 8u * 3600u;
    TEST_ASSERT_TRUE(scout_should_record_audio(at_0800, hours, 3));
    TEST_ASSERT_FALSE(scout_should_record_audio(at_0800 + 1800, hours, 3));  // 08:30, not on hour
    TEST_ASSERT_FALSE(scout_should_record_audio(1803859200u + 9u * 3600u, hours, 3));  // 09:00
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_next_wake_aligns_to_grid);
    RUN_TEST(test_transmit_cycle_is_daily);
    RUN_TEST(test_battery_gate);
    RUN_TEST(test_audio_only_on_scheduled_hours);
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
