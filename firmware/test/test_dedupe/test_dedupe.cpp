/* Shore-side duplicate filter (lib/scout_dedupe). */
#include <unity.h>

#include "scout_dedupe.h"

static const uint32_t T0 = 1772323200u;  // 2026-03-01T00:00:00Z

void test_first_copy_passes_and_repeat_is_dropped(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 42, T0));
    TEST_ASSERT_FALSE(scout_dedupe_first_seen(&d, 1, 42, T0));
}

void test_same_seq_from_another_buoy_is_not_a_duplicate(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 42, T0));
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 2, 42, T0));
}

void test_oldest_key_is_forgotten_when_full(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    for (uint32_t seq = 0; seq <= SCOUT_DEDUPE_CAPACITY; seq++) {
        TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, seq, T0));
    }
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 0, T0));  // evicted by the 17th key
    TEST_ASSERT_FALSE(scout_dedupe_first_seen(&d, 1, SCOUT_DEDUPE_CAPACITY, T0));
}

void test_seq_reused_after_a_power_loss_is_not_a_duplicate(void) {
    // A cold start restarts record_seq at 0; the later reading has a later timestamp.
    ScoutDedupe d;
    scout_dedupe_init(&d);
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 0, T0));
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 0, T0 + 9u * 3600u));
    TEST_ASSERT_FALSE(scout_dedupe_first_seen(&d, 1, 0, T0 + 9u * 3600u));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_first_copy_passes_and_repeat_is_dropped);
    RUN_TEST(test_same_seq_from_another_buoy_is_not_a_duplicate);
    RUN_TEST(test_oldest_key_is_forgotten_when_full);
    RUN_TEST(test_seq_reused_after_a_power_loss_is_not_a_duplicate);
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
