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

void test_boot_hello_only_on_a_real_power_on(void) {
    TEST_ASSERT_TRUE(scout_boot_hello_transmits(SCOUT_POWER_NORMAL, false));
    TEST_ASSERT_TRUE(scout_boot_hello_transmits(SCOUT_POWER_CONSERVE, false));
    TEST_ASSERT_FALSE(scout_boot_hello_transmits(SCOUT_POWER_CRITICAL, false));  // no TX at all
    TEST_ASSERT_FALSE(scout_boot_hello_transmits(SCOUT_POWER_NORMAL, true));     // reset loop guard
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

void test_tx_count_range_is_one_to_three(void) {
    TEST_ASSERT_FALSE(scout_tx_count_valid(0));
    TEST_ASSERT_TRUE(scout_tx_count_valid(1));
    TEST_ASSERT_TRUE(scout_tx_count_valid(3));
    TEST_ASSERT_FALSE(scout_tx_count_valid(4));
    TEST_ASSERT_TRUE(scout_tx_count_valid(SCOUT_TX_COUNT_DEFAULT));
}

void test_select_slots_follows_the_agreed_rule(void) {
    uint32_t out[3];
    TEST_ASSERT_EQUAL_UINT(1, scout_select_tx_slots(SLOTS, 3, 1, out));
    TEST_ASSERT_EQUAL_UINT32(600u, out[0]);  // 00:10
    TEST_ASSERT_EQUAL_UINT(2, scout_select_tx_slots(SLOTS, 3, 2, out));
    TEST_ASSERT_EQUAL_UINT32(600u, out[0]);    // 00:10
    TEST_ASSERT_EQUAL_UINT32(58200u, out[1]);  // 16:10
    TEST_ASSERT_EQUAL_UINT(3, scout_select_tx_slots(SLOTS, 3, 3, out));
    TEST_ASSERT_EQUAL_UINT32(29400u, out[1]);
    TEST_ASSERT_EQUAL_UINT(0, scout_select_tx_slots(SLOTS, 3, 0, out));
    TEST_ASSERT_EQUAL_UINT(0, scout_select_tx_slots(SLOTS, 3, 4, out));
}

void test_every_used_slot_follows_a_recording_by_ten_minutes(void) {
    // ADR-0011: clips at 00/08/16 UTC, so each packet carries the clip just before it.
    const uint8_t hours[] = {0, 8, 16};
    uint32_t out[3];
    for (uint8_t n = 1; n <= 3; n++) {
        size_t used = scout_select_tx_slots(SLOTS, 3, n, out);
        for (size_t i = 0; i < used; i++) {
            TEST_ASSERT_TRUE(scout_should_record_audio(DAY0 + out[i] - 600u, hours, 3));
        }
    }
}

void test_conserve_never_sends_more_than_the_setting(void) {
    // CONSERVE transmits in active slot 0 only, which is in every count's slot set.
    uint32_t out[3];
    for (uint8_t n = 1; n <= 3; n++) {
        size_t used = scout_select_tx_slots(SLOTS, 3, n, out);
        size_t normal = 0;
        size_t conserve = 0;
        for (size_t i = 0; i < used; i++) {
            normal += scout_slot_transmits(SCOUT_POWER_NORMAL, (int)i, 3) ? 1 : 0;
            conserve += scout_slot_transmits(SCOUT_POWER_CONSERVE, (int)i, 3) ? 1 : 0;
        }
        TEST_ASSERT_EQUAL_UINT(n, normal);
        TEST_ASSERT_EQUAL_UINT(1, conserve);
        TEST_ASSERT_EQUAL_UINT32(600u, out[0]);  // and that one send is 00:10
    }
}

void test_listen_window_follows_the_selected_slots(void) {
    uint32_t out[3];
    size_t used = scout_select_tx_slots(SLOTS, 3, 2, out);
    TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + 58200u, out, used, 120));   // 16:10 in
    TEST_ASSERT_FALSE(scout_in_listen_window(DAY0 + 29400u, out, used, 120));  // 08:10 out
}

// Per-buoy slot offset (SCO-224): 30 s steps, 4 positions, so the last one (+90 s) still ends
// its ceiling-size packet (1.739 s) well inside the shore's ±2 min window.
static const uint32_t STEP_S = 30u;
static const uint32_t POSITIONS = 4u;
static const uint32_t CEILING_AIRTIME_MS = 1739u;

void test_slot_offset_steps_by_buoy_id(void) {
    TEST_ASSERT_EQUAL_UINT32(0u, scout_tx_slot_offset_s(1, STEP_S, POSITIONS));  // SCOUT-01 unchanged
    TEST_ASSERT_EQUAL_UINT32(30u, scout_tx_slot_offset_s(2, STEP_S, POSITIONS));
    TEST_ASSERT_EQUAL_UINT32(60u, scout_tx_slot_offset_s(3, STEP_S, POSITIONS));
    TEST_ASSERT_EQUAL_UINT32(90u, scout_tx_slot_offset_s(4, STEP_S, POSITIONS));
}

void test_slot_offset_wraps_to_stay_inside_the_listen_window(void) {
    TEST_ASSERT_EQUAL_UINT32(0u, scout_tx_slot_offset_s(5, STEP_S, POSITIONS));
    TEST_ASSERT_EQUAL_UINT32(30u, scout_tx_slot_offset_s(6, STEP_S, POSITIONS));
    TEST_ASSERT_EQUAL_UINT32(90u, scout_tx_slot_offset_s(0, STEP_S, POSITIONS));  // no underflow
    TEST_ASSERT_EQUAL_UINT32(0u, scout_tx_slot_offset_s(3, STEP_S, 0));           // guard
}

void test_offset_slots_shift_and_wrap_past_midnight(void) {
    static const uint32_t LATE[] = {600u, 86390u};
    uint32_t out[2];
    scout_offset_tx_slots(LATE, 2, 30u, out);
    TEST_ASSERT_EQUAL_UINT32(630u, out[0]);
    TEST_ASSERT_EQUAL_UINT32(20u, out[1]);  // 23:59:50 + 30 s → 00:00:20
}

void test_two_buoys_in_a_group_never_share_an_airtime_window(void) {
    // A buoy is on air for its uplink, its 1 s downlink listen, and a downlink frame received to
    // its end. Any two buoys within one group of POSITIONS must start further apart than that.
    const uint32_t busy_ms = CEILING_AIRTIME_MS + 1000u + CEILING_AIRTIME_MS;
    for (uint16_t a = 1; a <= POSITIONS; a++) {
        for (uint16_t b = (uint16_t)(a + 1); b <= POSITIONS; b++) {
            uint32_t sa[3], sb[3];
            scout_offset_tx_slots(SLOTS, 3, scout_tx_slot_offset_s(a, STEP_S, POSITIONS), sa);
            scout_offset_tx_slots(SLOTS, 3, scout_tx_slot_offset_s(b, STEP_S, POSITIONS), sb);
            for (size_t i = 0; i < 3; i++) {
                uint32_t gap_s = sa[i] > sb[i] ? sa[i] - sb[i] : sb[i] - sa[i];
                TEST_ASSERT_TRUE(gap_s * 1000u > busy_ms);
            }
        }
    }
}

void test_every_offset_packet_ends_inside_the_shore_window(void) {
    for (uint16_t id = 1; id <= POSITIONS; id++) {
        uint32_t shifted[3];
        scout_offset_tx_slots(SLOTS, 3, scout_tx_slot_offset_s(id, STEP_S, POSITIONS), shifted);
        for (size_t i = 0; i < 3; i++) {
            uint32_t end_s = shifted[i] + (CEILING_AIRTIME_MS + 999u) / 1000u;
            TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + shifted[i], SLOTS, 3, 120));
            TEST_ASSERT_TRUE(scout_in_listen_window(DAY0 + end_s, SLOTS, 3, 120));
        }
    }
}

void test_offset_slots_drive_the_wake_and_slot_match(void) {
    uint32_t shifted[3];
    scout_offset_tx_slots(SLOTS, 3, 30u, shifted);  // SCOUT-02
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 630u, scout_next_event_epoch(DAY0 + 600u, 1800, shifted, 3));
    TEST_ASSERT_EQUAL_INT(0, scout_tx_slot_index(DAY0 + 630u, shifted, 3));
    TEST_ASSERT_EQUAL_INT(-1, scout_tx_slot_index(DAY0 + 600u, shifted, 3));  // SCOUT-01's second
}

// A clock corrected backwards just after a slot must not send that slot again (SCO-315).
void test_next_event_after_a_backward_step_skips_the_slot_just_handled(void) {
    // Handled the 00:10 slot; the shore then set the clock back 3 s, to 00:09:57.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 1800u,
                             scout_next_event_after(DAY0 + 597u, DAY0 + 600u, 1800, SLOTS, 3));
    // A forward step plans from the new time, as before.
    TEST_ASSERT_EQUAL_UINT32(DAY0 + 1800u,
                             scout_next_event_after(DAY0 + 605u, DAY0 + 600u, 1800, SLOTS, 3));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_next_event_after_a_backward_step_skips_the_slot_just_handled);
    RUN_TEST(test_slot_offset_steps_by_buoy_id);
    RUN_TEST(test_slot_offset_wraps_to_stay_inside_the_listen_window);
    RUN_TEST(test_offset_slots_shift_and_wrap_past_midnight);
    RUN_TEST(test_two_buoys_in_a_group_never_share_an_airtime_window);
    RUN_TEST(test_every_offset_packet_ends_inside_the_shore_window);
    RUN_TEST(test_offset_slots_drive_the_wake_and_slot_match);
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
    RUN_TEST(test_tx_count_range_is_one_to_three);
    RUN_TEST(test_select_slots_follows_the_agreed_rule);
    RUN_TEST(test_every_used_slot_follows_a_recording_by_ten_minutes);
    RUN_TEST(test_conserve_never_sends_more_than_the_setting);
    RUN_TEST(test_listen_window_follows_the_selected_slots);
    RUN_TEST(test_boot_hello_only_on_a_real_power_on);
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
