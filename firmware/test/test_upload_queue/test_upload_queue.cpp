/* Readings waiting for the console (lib/scout_upload_queue, SCO-237). */
#include <unity.h>

#include "scout_upload_queue.h"

static ScoutUploadQueue q;

static ScoutReading reading(uint32_t seq) {
    ScoutReading r = {};
    r.buoy_id = 1;
    r.record_seq = seq;
    return r;
}

void setUp(void) { scout_upload_queue_init(&q); }
void tearDown(void) {}

void test_readings_come_out_oldest_first_and_stay_until_popped(void) {
    for (uint32_t seq = 1; seq <= 3; seq++) {
        ScoutReading r = reading(seq);
        scout_upload_queue_push(&q, &r);
    }
    ScoutReading out[5];
    TEST_ASSERT_EQUAL(2, scout_upload_queue_peek(&q, out, 2));
    TEST_ASSERT_EQUAL_UINT32(1, out[0].record_seq);
    TEST_ASSERT_EQUAL_UINT32(2, out[1].record_seq);
    TEST_ASSERT_EQUAL(3, q.count);
    scout_upload_queue_pop(&q, 2);
    TEST_ASSERT_EQUAL(1, scout_upload_queue_peek(&q, out, 5));
    TEST_ASSERT_EQUAL_UINT32(3, out[0].record_seq);
}

void test_a_full_queue_drops_the_oldest_and_counts_it(void) {
    for (uint32_t seq = 1; seq <= SCOUT_UPLOAD_QUEUE_CAPACITY + 2; seq++) {
        ScoutReading r = reading(seq);
        scout_upload_queue_push(&q, &r);
    }
    ScoutReading out[1];
    scout_upload_queue_peek(&q, out, 1);
    TEST_ASSERT_EQUAL(SCOUT_UPLOAD_QUEUE_CAPACITY, q.count);
    TEST_ASSERT_EQUAL_UINT32(3, out[0].record_seq);
    TEST_ASSERT_EQUAL_UINT32(2, q.dropped);
}

void test_a_refused_reading_is_removed_and_the_rest_keep_their_order(void) {
    for (uint32_t seq = 1; seq <= 4; seq++) {
        ScoutReading r = reading(seq);
        scout_upload_queue_push(&q, &r);
    }
    scout_upload_queue_remove(&q, 1);
    ScoutReading out[4];
    TEST_ASSERT_EQUAL(3, scout_upload_queue_peek(&q, out, 4));
    TEST_ASSERT_EQUAL_UINT32(1, out[0].record_seq);
    TEST_ASSERT_EQUAL_UINT32(3, out[1].record_seq);
    TEST_ASSERT_EQUAL_UINT32(4, out[2].record_seq);
}

void test_popping_more_than_is_queued_empties_it(void) {
    ScoutReading r = reading(1);
    scout_upload_queue_push(&q, &r);
    scout_upload_queue_pop(&q, 10);
    TEST_ASSERT_EQUAL(0, q.count);
}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_readings_come_out_oldest_first_and_stay_until_popped);
    RUN_TEST(test_a_full_queue_drops_the_oldest_and_counts_it);
    RUN_TEST(test_a_refused_reading_is_removed_and_the_rest_keep_their_order);
    RUN_TEST(test_popping_more_than_is_queued_empties_it);
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
