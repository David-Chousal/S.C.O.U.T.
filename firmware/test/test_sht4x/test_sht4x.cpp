/* SHT40 housing humidity/temperature: frame parsing and the alert test (lib/scout_sht4x),
 * SCO-205. */
#include <unity.h>

#include "scout_sht4x.h"

void test_crc_matches_the_sensirion_example(void) {
    // Sensirion's datasheet example: CRC-8 (poly 0x31, init 0xFF) of 0xBEEF is 0x92.
    const uint8_t word[2] = {0xBE, 0xEF};
    TEST_ASSERT_EQUAL_HEX8(0x92, scout_sht4x_crc8(word, 2));
}

static void make_frame(uint16_t t_raw, uint16_t rh_raw, uint8_t frame[6]) {
    frame[0] = (uint8_t)(t_raw >> 8);
    frame[1] = (uint8_t)(t_raw & 0xFF);
    frame[2] = scout_sht4x_crc8(frame, 2);
    frame[3] = (uint8_t)(rh_raw >> 8);
    frame[4] = (uint8_t)(rh_raw & 0xFF);
    frame[5] = scout_sht4x_crc8(frame + 3, 2);
}

void test_parses_temperature_and_humidity(void) {
    uint8_t frame[6];
    make_frame(0x6666, 0x8000, frame);  // datasheet formulas: 25.0 °C, 56.5 %RH
    float temp_c = 0.0f, rh_pct = 0.0f;
    TEST_ASSERT_TRUE(scout_sht4x_parse(frame, &temp_c, &rh_pct));
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 25.0f, temp_c);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 56.50f, rh_pct);
}

void test_humidity_is_cropped_to_0_100(void) {
    // The datasheet formula runs from -6 to 119 %RH; Sensirion says to crop to 0-100.
    uint8_t frame[6];
    float temp_c = 0.0f, rh_pct = 50.0f;
    make_frame(0x6666, 0x0000, frame);
    TEST_ASSERT_TRUE(scout_sht4x_parse(frame, &temp_c, &rh_pct));
    TEST_ASSERT_EQUAL_FLOAT(0.0f, rh_pct);
    make_frame(0x6666, 0xFFFF, frame);
    TEST_ASSERT_TRUE(scout_sht4x_parse(frame, &temp_c, &rh_pct));
    TEST_ASSERT_EQUAL_FLOAT(100.0f, rh_pct);
}

void test_a_corrupted_frame_is_rejected_and_outputs_untouched(void) {
    uint8_t frame[6];
    make_frame(0x6666, 0x8000, frame);
    frame[4] ^= 0x01;  // one bit flipped on the I2C bus
    float temp_c = -99.0f, rh_pct = -99.0f;
    TEST_ASSERT_FALSE(scout_sht4x_parse(frame, &temp_c, &rh_pct));
    TEST_ASSERT_EQUAL_FLOAT(-99.0f, temp_c);
    TEST_ASSERT_EQUAL_FLOAT(-99.0f, rh_pct);
}

void test_alert_at_or_above_the_threshold(void) {
    TEST_ASSERT_FALSE(scout_humidity_high(69.9f, 70.0f));
    TEST_ASSERT_TRUE(scout_humidity_high(70.0f, 70.0f));
    TEST_ASSERT_TRUE(scout_humidity_high(95.0f, 70.0f));
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_crc_matches_the_sensirion_example);
    RUN_TEST(test_parses_temperature_and_humidity);
    RUN_TEST(test_humidity_is_cropped_to_0_100);
    RUN_TEST(test_a_corrupted_frame_is_rejected_and_outputs_untouched);
    RUN_TEST(test_alert_at_or_above_the_threshold);
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
