/* End-to-end model of two buoys on one shore station (SCO-224 + SCO-315): each buoy's clock
 * drifts at the worst-case rate in opposite directions, the buoys transmit at their offset slots,
 * and the shore answers every packet with its time. Uses the real scheduler and correction code;
 * only the radio timing is modelled, in milliseconds of true time. */
#include <unity.h>

#include "scout_scheduler.h"
#include "scout_timeset.h"

static const uint32_t SLOTS[] = {600u, 29400u, 58200u};
static const int64_t DAY_MS = 86400000;
static const int64_t DRIFT_MS_PER_DAY = 2000;       // Adafruit: up to 2 s/day
static const int64_t UPLINK_MS = 756;               // 46-byte packet
static const int64_t SHORE_TURNAROUND_MS = 5;
static const int64_t TIME_FRAME_MS = 494;           // 26-byte frame at SF12/BW500
static const int64_t BUSY_MS = 1739 + 1000 + 1739;  // a buoy's whole on-air turn
static const int64_t WINDOW_MS = 120000;
static const int64_t CEILING_MS = 1739;

typedef struct {
    uint16_t id;
    int64_t clock_offset_ms;  // buoy clock minus true time
    int64_t drift_ms_per_day;
} Buoy;

static int64_t floor_div(int64_t a, int64_t b) {
    return a >= 0 ? a / b : -((-a + b - 1) / b);
}

/* True time at which `b` starts transmitting the slot `slot_sod` of day `day`. */
static int64_t tx_time_ms(const Buoy *b, int64_t day, uint32_t slot_sod) {
    int64_t buoy_reading_s = day * 86400 + slot_sod + scout_tx_slot_offset_s(b->id, 30, 4);
    return buoy_reading_s * 1000 - b->clock_offset_ms;
}

/* The shore hears the packet and answers with its time; the buoy corrects its clock. */
static void shore_answers(Buoy *b, int64_t tx_ms) {
    int64_t signed_ms = tx_ms + UPLINK_MS + SHORE_TURNAROUND_MS;
    uint32_t counter = (uint32_t)(signed_ms / 1000);
    int64_t heard_ms = signed_ms + TIME_FRAME_MS;
    uint32_t buoy_now = (uint32_t)floor_div(heard_ms + b->clock_offset_ms, 1000);
    int32_t step = scout_clock_correction_s(buoy_now, counter + 1u, 1, 30);
    if (step != 0) {
        b->clock_offset_ms = (int64_t)(buoy_now + step) * 1000 - heard_ms;  // set to a whole second
    }
}

static void drift(Buoy *b, int64_t ms) {
    b->clock_offset_ms += b->drift_ms_per_day * ms / DAY_MS;
}

/* Run `days`, the shore answering only when `shore_up`. Returns the smallest gap between the two
 * buoys' transmissions, and fails if a packet leaves the shore's listening window. */
static int64_t run(Buoy *a, Buoy *b, int days, bool shore_up) {
    int64_t smallest = INT64_MAX;
    int64_t last_ms = 0;
    for (int64_t day = 0; day < days; day++) {
        for (size_t i = 0; i < 3; i++) {
            int64_t slot_ms = (day * 86400 + SLOTS[i]) * 1000;
            drift(a, slot_ms - last_ms);
            drift(b, slot_ms - last_ms);
            last_ms = slot_ms;
            int64_t ta = tx_time_ms(a, day, SLOTS[i]);
            int64_t tb = tx_time_ms(b, day, SLOTS[i]);
            int64_t gap = ta > tb ? ta - tb : tb - ta;
            if (gap < smallest) {
                smallest = gap;
            }
            TEST_ASSERT_TRUE(ta - slot_ms >= -WINDOW_MS && ta - slot_ms + CEILING_MS <= WINDOW_MS);
            TEST_ASSERT_TRUE(tb - slot_ms >= -WINDOW_MS && tb - slot_ms + CEILING_MS <= WINDOW_MS);
            if (shore_up) {
                shore_answers(a, ta);
                shore_answers(b, tb);
            }
        }
    }
    return smallest;
}

void test_two_buoys_never_collide_over_a_90_day_deployment(void) {
    // The worst case: SCOUT-01 set 1 s slow and losing 2 s/day, SCOUT-02 (30 s later) set 1 s
    // fast and gaining 2 s/day, so their slots close in on each other.
    Buoy a = {1, -999, -DRIFT_MS_PER_DAY};
    Buoy b = {2, 999, DRIFT_MS_PER_DAY};
    TEST_ASSERT_TRUE(run(&a, &b, 90, true) > BUSY_MS);
}

void test_clocks_stay_within_a_few_seconds_of_the_shore(void) {
    Buoy a = {1, -999, -DRIFT_MS_PER_DAY};
    Buoy b = {2, 999, DRIFT_MS_PER_DAY};
    run(&a, &b, 90, true);
    TEST_ASSERT_TRUE(a.clock_offset_ms < 3000 && a.clock_offset_ms > -3000);
    TEST_ASSERT_TRUE(b.clock_offset_ms < 3000 && b.clock_offset_ms > -3000);
}

void test_a_badly_set_clock_converges_without_jumping(void) {
    // 100 s slow at boot, still inside the shore's window: 30 s steps bring it in over 4 slots.
    Buoy a = {1, -100000, 0};
    for (int i = 0; i < 5; i++) {
        shore_answers(&a, tx_time_ms(&a, 0, SLOTS[0]));
    }
    TEST_ASSERT_TRUE(a.clock_offset_ms < 2000 && a.clock_offset_ms > -2000);
}

void test_without_the_shore_two_buoys_collide_within_a_week(void) {
    // The failure SCO-315 fixes: the ~5.9-day estimate in shore-station.md.
    Buoy a = {1, -999, -DRIFT_MS_PER_DAY};
    Buoy b = {2, 999, DRIFT_MS_PER_DAY};
    TEST_ASSERT_TRUE(run(&a, &b, 5, false) > BUSY_MS);
    TEST_ASSERT_TRUE(run(&a, &b, 2, false) <= BUSY_MS);
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_two_buoys_never_collide_over_a_90_day_deployment);
    RUN_TEST(test_clocks_stay_within_a_few_seconds_of_the_shore);
    RUN_TEST(test_a_badly_set_clock_converges_without_jumping);
    RUN_TEST(test_without_the_shore_two_buoys_collide_within_a_week);
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
