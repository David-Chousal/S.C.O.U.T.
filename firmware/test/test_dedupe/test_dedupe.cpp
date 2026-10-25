/* Shore-side duplicate filter (lib/scout_dedupe). */
#include <unity.h>

#include "scout_dedupe.h"

void test_first_copy_passes_and_repeat_is_dropped(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 42));
    TEST_ASSERT_FALSE(scout_dedupe_first_seen(&d, 1, 42));
}

void test_same_seq_from_another_buoy_is_not_a_duplicate(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 42));
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 2, 42));
}

void test_oldest_key_is_forgotten_when_full(void) {
    ScoutDedupe d;
    scout_dedupe_init(&d);
    for (uint32_t seq = 0; seq <= SCOUT_DEDUPE_CAPACITY; seq++) {
        TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, seq));
    }
    TEST_ASSERT_TRUE(scout_dedupe_first_seen(&d, 1, 0));  // evicted by the 17th key
    TEST_ASSERT_FALSE(scout_dedupe_first_seen(&d, 1, SCOUT_DEDUPE_CAPACITY));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_first_copy_passes_and_repeat_is_dropped);
    RUN_TEST(test_same_seq_from_another_buoy_is_not_a_duplicate);
    RUN_TEST(test_oldest_key_is_forgotten_when_full);
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
