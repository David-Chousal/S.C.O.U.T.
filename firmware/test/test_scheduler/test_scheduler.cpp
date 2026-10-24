/* Duty-cycle scheduling math (lib/scout_scheduler). */
#include <unity.h>

#include "scout_scheduler.h"

void test_next_wake_aligns_to_grid(void) {
    // 30-minute grid: 00:10 → 00:30, exactly-on-boundary → next boundary.
    TEST_ASSERT_EQUAL_UINT32(1800, scout_next_wake_epoch(600, 1800));
    TEST_ASSERT_EQUAL_UINT32(3600, scout_next_wake_epoch(1800, 1800));
    TEST_ASSERT_EQUAL_UINT32(100, scout_next_wake_epoch(100, 0));  // guard: interval 0
}

// Isabella's slot table (SCO-165): 00:10, 08:10, 16:10 UTC, as seconds after midnight.
static const uint32_t SLOTS[] = {600u, 29400u, 58200u};
static const uint32_t DAY0 = 1803859200u;  // 2027-03-01 00:00:00Z

void test_next_event_is_the_earlier_of_sample_and_slot(void) {
    // 00:00 → the 00:10 slot comes before the 00:30 sample.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 600u, scout_next_event_epoch(DAY0, 1800, SLOTS, 3));
    // 00:10 (in the slot) → next is the 00:30 sample, strictly after now.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 1800u, scout_next_event_epoch(DAY0 + 600u, 1800, SLOTS, 3));
    // 16:30 → next is the 17:00 sample.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 61200u, scout_next_event_epoch(DAY0 + 59400u, 1800, SLOTS, 3));
}

void test_next_event_wraps_to_tomorrows_first_slot(void) {
    // 23:59:59 with no sampling grid → tomorrow's 00:10 slot.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 86400u + 600u,
                             scout_next_event_epoch(DAY0 + 86399u, 0, SLOTS, 3));
}

void test_next_event_without_slots_is_the_sample_grid(void) {
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 1800u, scout_next_event_epoch(DAY0 + 5u, 1800, SLOTS, 0));
}

void test_tx_slot_index_matches_exact_slot_times_only(void) {
    TEST_ASSERT_EQUAL_INT(0, scout_tx_slot_index(DAY0 + 600u, SLOTS, 3));
    TEST_ASSERT_EQUAL_INT(2, scout_tx_slot_index(DAY0 + 86400u + 58200u, SLOTS, 3));  // next day
    TEST_ASSERT_EQUAL_INT(-1, scout_tx_slot_index(DAY0 + 601u, SLOTS, 3));
    TEST_ASSERT_EQUAL_INT(-1, scout_tx_slot_index(DAY0 + 1800u, SLOTS, 3));  // a sample, not a slot
}

void test_listen_window_is_two_minutes_either_side_of_a_slot(void) {
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + 600u, SLOTS, 3, 120));
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + 480u, SLOTS, 3, 120));   // 00:08:00
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + 720u, SLOTS, 3, 120));   // 00:12:00
    TEST_ASSERT_FALSE(scout_in_listen_window(DAY0 + 721u, SLOTS, 3, 120));
    TEST_ASSERT_FALSE(scout_in_listen_window(DAY0 + 479u, SLOTS, 3, 120));
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + 86400u + 58300u, SLOTS, 3, 120));  // next day
    TEST_ASSERT_FALSE(scout_in_listen_window(DAY0 + 600u, SLOTS, 0, 120));  // no slots
}

void test_listen_window_crosses_midnight(void) {
    static const uint32_t MIDNIGHT_SLOT[] = {30u};  // 00:00:30
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 - 60u, MIDNIGHT_SLOT, 1, 120));   // 23:59:00
    TEST_ASSERT_FALSE(scout_in_listen_window(DAY0 - 91u, MIDNIGHT_SLOT, 1, 120));
}

void test_sample_time_is_on_the_grid(void) {
    TEST_ASSERT_TRUE(scout_is_sample_time(DAY0 + 1800u, 1800));
    TEST_ASSERT_FALSE(scout_is_sample_time(DAY0 + 600u, 1800));  // the 00:10 slot
    TEST_ASSERT_FALSE(scout_is_sample_time(DAY0, 0));            // guard: interval 0
}

void test_slot_transmits_by_power_mode(void) {
    // NORMAL: every slot. CONSERVE with every-3rd: only slot 0 (3/day → 1/day). CRITICAL: none.
    TEST_ASSERT_TRUE(scout_slot_transmits(SCOUT_POWER_NORMAL, 2, 3));
    TEST_ASSERT_TRUE(scout_slot_transmits(SCOUT_POWER_CONSERVE, 0, 3));
    TEST_ASSERT_FALSE(scout_slot_transmits(SCOUT_POWER_CONSERVE, 1, 3));
    TEST_ASSERT_FALSE(scout_slot_transmits(SCOUT_POWER_CRITICAL, 0, 3));
    TEST_ASSERT_FALSE(scout_slot_transmits(SCOUT_POWER_NORMAL, -1, 3));  // not a slot
    TEST_ASSERT_TRUE(scout_slot_transmits(SCOUT_POWER_CONSERVE, 1, 0));  // guard: factor 0 → every slot
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

void test_power_mode_tiers(void) {
    // conserve_mv=3200, critical_mv=3100
    TEST_ASSERT_EQUAL(SCOUT_POWER_NORMAL, scout_power_mode(3300, 3200, 3100));
    TEST_ASSERT_EQUAL(SCOUT_POWER_NORMAL, scout_power_mode(3200, 3200, 3100));  // boundary
    TEST_ASSERT_EQUAL(SCOUT_POWER_CONSERVE, scout_power_mode(3150, 3200, 3100));
    TEST_ASSERT_EQUAL(SCOUT_POWER_CONSERVE, scout_power_mode(3100, 3200, 3100));  // boundary
    TEST_ASSERT_EQUAL(SCOUT_POWER_CRITICAL, scout_power_mode(3050, 3200, 3100));
}

void test_sensing_gates_by_mode(void) {
    TEST_ASSERT_TRUE(scout_sense_turbidity(SCOUT_POWER_NORMAL));
    TEST_ASSERT_TRUE(scout_sense_turbidity(SCOUT_POWER_CONSERVE));
    TEST_ASSERT_FALSE(scout_sense_turbidity(SCOUT_POWER_CRITICAL));  // paused
    TEST_ASSERT_TRUE(scout_sense_audio(SCOUT_POWER_NORMAL));
    TEST_ASSERT_FALSE(scout_sense_audio(SCOUT_POWER_CONSERVE));  // audio off first
    TEST_ASSERT_FALSE(scout_sense_audio(SCOUT_POWER_CRITICAL));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_next_wake_aligns_to_grid);
    RUN_TEST(test_next_event_is_the_earlier_of_sample_and_slot);
    RUN_TEST(test_next_event_wraps_to_tomorrows_first_slot);
    RUN_TEST(test_next_event_without_slots_is_the_sample_grid);
    RUN_TEST(test_tx_slot_index_matches_exact_slot_times_only);
    RUN_TEST(test_listen_window_is_two_minutes_either_side_of_a_slot);
    RUN_TEST(test_listen_window_crosses_midnight);
    RUN_TEST(test_sample_time_is_on_the_grid);
    RUN_TEST(test_slot_transmits_by_power_mode);
    RUN_TEST(test_battery_gate);
    RUN_TEST(test_audio_only_on_scheduled_hours);
    RUN_TEST(test_power_mode_tiers);
    RUN_TEST(test_sensing_gates_by_mode);
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
