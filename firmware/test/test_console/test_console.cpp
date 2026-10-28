/* The shore station's console rows and replies (lib/scout_console, SCO-237).
 *
 * row_vectors.h is generated from shore/scout_shore/schema.py reading_to_row, so these tests hold
 * the S3's rows to the Python's character for character, rounding included. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unity.h>

#include "row_vectors.h"
#include "scout_console.h"
#include "scout_packet.h"

#define COUNT(a) (sizeof(a) / sizeof((a)[0]))

static size_t from_hex(const char *hex, uint8_t *out) {
    size_t n = strlen(hex) / 2;
    for (size_t i = 0; i < n; i++) {
        char pair[3] = {hex[2 * i], hex[2 * i + 1], '\0'};
        out[i] = (uint8_t)strtoul(pair, nullptr, 16);
    }
    return n;
}

static ScoutReading decoded(const char *hex) {
    uint8_t buf[64];
    size_t len = from_hex(hex, buf);
    ScoutReading r;
    TEST_ASSERT_EQUAL(SCOUT_DECODE_OK, scout_packet_decode(buf, len, &r));
    return r;
}

void test_every_vector_row_matches_the_python(void) {
    char row[SCOUT_CONSOLE_ROW_MAX];
    for (size_t i = 0; i < COUNT(SCOUT_ROW_VECTORS); i++) {
        ScoutReading r = decoded(SCOUT_ROW_VECTORS[i].packet_hex);
        size_t n = scout_console_row(&r, row, sizeof(row));
        TEST_ASSERT_EQUAL_STRING_MESSAGE(SCOUT_ROW_VECTORS[i].row_json, row, SCOUT_ROW_VECTORS[i].name);
        TEST_ASSERT_EQUAL(strlen(row), n);
    }
}

static void check_sweep(const char *const *expected, size_t count, int32_t first, int32_t step,
                        double divisor, unsigned decimals, bool turbidity) {
    char text[24];
    char where[48];
    for (size_t i = 0; i < count; i++) {
        int32_t raw = first + (int32_t)i * step;
        double value = turbidity ? (double)raw / 4095.0 * 3.3 : (double)raw / divisor;
        TEST_ASSERT_NOT_EQUAL(0, scout_format_fixed(value, decimals, text, sizeof(text)));
        snprintf(where, sizeof(where), "raw=%ld", (long)raw);
        TEST_ASSERT_EQUAL_STRING_MESSAGE(expected[i], text, where);
    }
}

void test_every_battery_millivolt_formats_like_python(void) {
    check_sweep(SCOUT_BATTERY_V, COUNT(SCOUT_BATTERY_V), SCOUT_BATTERY_V_FIRST, 1, 1000.0, 2, false);
}

void test_every_turbidity_count_formats_like_python(void) {
    check_sweep(SCOUT_TURBIDITY_V, COUNT(SCOUT_TURBIDITY_V), 0, 1, 0, 3, true);
}

void test_water_temperatures_format_like_python(void) {
    check_sweep(SCOUT_TEMP_C, COUNT(SCOUT_TEMP_C), SCOUT_TEMP_C_FIRST, SCOUT_TEMP_C_STEP, 100.0, 2,
                false);
}

void test_a_negative_value_that_rounds_to_zero_keeps_its_sign(void) {
    char text[16];
    scout_format_fixed(-0.001, 2, text, sizeof(text));
    TEST_ASSERT_EQUAL_STRING("-0.00", text);
}

void test_a_row_that_does_not_fit_writes_nothing(void) {
    ScoutReading r = decoded(SCOUT_ROW_VECTORS[0].packet_hex);
    char small[40];
    TEST_ASSERT_EQUAL(0, scout_console_row(&r, small, sizeof(small)));
    TEST_ASSERT_EQUAL_STRING("", small);
}

void test_a_batch_takes_the_rows_that_fit(void) {
    ScoutReading rows[3];
    for (size_t i = 0; i < 3; i++) {
        rows[i] = decoded(SCOUT_ROW_VECTORS[i].packet_hex);
    }
    char one[SCOUT_CONSOLE_ROW_MAX + 16];
    size_t len = 0;
    TEST_ASSERT_EQUAL(1, scout_console_batch(rows, 3, one, sizeof(one), &len));
    TEST_ASSERT_EQUAL(strlen(one), len);
    TEST_ASSERT_EQUAL(0, strncmp(one, "{\"rows\":[{", 10));
    TEST_ASSERT_EQUAL_STRING("}]}", one + len - 3);

    static char all[3 * SCOUT_CONSOLE_ROW_MAX];
    TEST_ASSERT_EQUAL(3, scout_console_batch(rows, 3, all, sizeof(all), &len));
    TEST_ASSERT_NOT_NULL(strstr(all, "},{"));
}

void test_the_console_names_the_bad_row(void) {
    TEST_ASSERT_EQUAL(3, scout_console_bad_row("{\"ok\":false,\"error\":\"row 3 is not a valid schema row\"}"));
    TEST_ASSERT_EQUAL(-1, scout_console_bad_row("{\"ok\":false,\"error\":\"unauthorized\"}"));
}

void test_settings_reply_sets_listed_buoys_and_clears_the_rest(void) {
    uint8_t requested[9] = {0, 3, 3, 0, 0, 0, 0, 0, 3};
    int n = scout_console_parse_settings(
        "{\"buoys\":[{\"buoy_id\":1,\"tx_count_requested\":2},{\"buoy_id\":20,\"tx_count_requested\":1},"
        "{\"buoy_id\":3,\"tx_count_requested\":7}]}",
        requested, sizeof(requested));
    TEST_ASSERT_EQUAL(1, n);
    const uint8_t want[9] = {0, 2, 0, 0, 0, 0, 0, 0, 0};
    TEST_ASSERT_EQUAL_UINT8_ARRAY(want, requested, 9);
}

void test_an_empty_settings_reply_clears_every_request(void) {
    uint8_t requested[3] = {0, 2, 1};
    TEST_ASSERT_EQUAL(0, scout_console_parse_settings("{\"buoys\":[]}", requested, 3));
    const uint8_t want[3] = {0, 0, 0};
    TEST_ASSERT_EQUAL_UINT8_ARRAY(want, requested, 3);
}

void test_a_reply_that_is_not_settings_changes_nothing(void) {
    uint8_t requested[3] = {0, 2, 1};
    TEST_ASSERT_EQUAL(-1, scout_console_parse_settings("{\"ok\":false,\"error\":\"unauthorized\"}", requested, 3));
    const uint8_t want[3] = {0, 2, 1};
    TEST_ASSERT_EQUAL_UINT8_ARRAY(want, requested, 3);
}

void setUp(void) {}
void tearDown(void) {}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_every_vector_row_matches_the_python);
    RUN_TEST(test_every_battery_millivolt_formats_like_python);
    RUN_TEST(test_every_turbidity_count_formats_like_python);
    RUN_TEST(test_water_temperatures_format_like_python);
    RUN_TEST(test_a_negative_value_that_rounds_to_zero_keeps_its_sign);
    RUN_TEST(test_a_row_that_does_not_fit_writes_nothing);
    RUN_TEST(test_a_batch_takes_the_rows_that_fit);
    RUN_TEST(test_the_console_names_the_bad_row);
    RUN_TEST(test_settings_reply_sets_listed_buoys_and_clears_the_rest);
    RUN_TEST(test_an_empty_settings_reply_clears_every_request);
    RUN_TEST(test_a_reply_that_is_not_settings_changes_nothing);
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
