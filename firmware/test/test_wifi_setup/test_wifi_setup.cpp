/* The shore station's WiFi setup from a phone (lib/scout_wifi_setup, SCO-310). */
#include <string.h>
#include <unity.h>

#include "scout_wifi_setup.h"

static const char *TOKEN = "scd_abcdefghijklmnop";

void setUp(void) {}
void tearDown(void) {}

static ScoutWifiConfig saved(const char *ssid, const char *password, const char *token) {
    ScoutWifiConfig c;
    memset(&c, 0, sizeof(c));
    strcpy(c.ssid, ssid);
    strcpy(c.password, password);
    strcpy(c.token, token);
    return c;
}

/* ---- The setup form ---- */

void test_a_new_network_with_password_and_token_is_accepted(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(nullptr, "Lab", "password1", TOKEN, &out));
    TEST_ASSERT_EQUAL_STRING("Lab", out.ssid);
    TEST_ASSERT_EQUAL_STRING("password1", out.password);
    TEST_ASSERT_EQUAL_STRING(TOKEN, out.token);
}

void test_an_iphone_hotspot_name_with_a_curly_apostrophe_is_kept_byte_for_byte(void) {
    const char *name = "David\xE2\x80\x99s iPhone"; /* David’s iPhone */
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(nullptr, name, "hotspot99", TOKEN, &out));
    TEST_ASSERT_EQUAL_STRING(name, out.ssid);
}

void test_an_empty_network_name_is_refused(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_SSID_EMPTY, scout_wifi_form_apply(nullptr, "", "password1", TOKEN, &out));
}

void test_a_network_name_over_32_bytes_is_refused(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_SSID_TOO_LONG,
                      scout_wifi_form_apply(nullptr, "123456789012345678901234567890123", "password1", TOKEN, &out));
}

void test_a_password_under_8_characters_is_refused(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_PASSWORD_TOO_SHORT, scout_wifi_form_apply(nullptr, "Lab", "short", TOKEN, &out));
}

void test_a_64_character_hex_key_is_accepted_but_64_other_characters_are_not(void) {
    char hex[65], text[65];
    memset(hex, 'a', 64);
    hex[64] = '\0';
    memset(text, 'z', 64);
    text[64] = '\0';
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(nullptr, "Lab", hex, TOKEN, &out));
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_PASSWORD_TOO_LONG, scout_wifi_form_apply(nullptr, "Lab", text, TOKEN, &out));
}

void test_an_open_network_needs_no_password(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(nullptr, "Cafe", "", TOKEN, &out));
    TEST_ASSERT_EQUAL_STRING("", out.password);
}

void test_a_blank_password_for_the_saved_network_keeps_the_saved_password(void) {
    ScoutWifiConfig current = saved("Lab", "password1", TOKEN);
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(&current, "Lab", "", "", &out));
    TEST_ASSERT_EQUAL_STRING("password1", out.password);
}

void test_a_blank_token_keeps_the_saved_token(void) {
    ScoutWifiConfig current = saved("Lab", "password1", TOKEN);
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(&current, "Hotspot", "hotspot99", "", &out));
    TEST_ASSERT_EQUAL_STRING(TOKEN, out.token);
}

void test_a_first_setup_without_a_token_is_refused(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_TOKEN_MISSING, scout_wifi_form_apply(nullptr, "Lab", "password1", "", &out));
}

void test_a_token_that_is_not_a_station_token_is_refused(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_TOKEN_BAD, scout_wifi_form_apply(nullptr, "Lab", "password1", "sct_apikey", &out));
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_TOKEN_BAD, scout_wifi_form_apply(nullptr, "Lab", "password1", "scd_has space", &out));
}

void test_spaces_pasted_around_a_token_are_trimmed(void) {
    ScoutWifiConfig out;
    TEST_ASSERT_EQUAL(SCOUT_WIFI_FORM_OK, scout_wifi_form_apply(nullptr, "Lab", "password1", "  scd_abc123\n", &out));
    TEST_ASSERT_EQUAL_STRING("scd_abc123", out.token);
}

void test_every_form_error_has_a_message(void) {
    for (int e = SCOUT_WIFI_FORM_OK + 1; e <= SCOUT_WIFI_FORM_TOKEN_BAD; e++) {
        TEST_ASSERT_TRUE(strlen(scout_wifi_form_message((ScoutWifiFormError)e)) > 0);
    }
}

/* ---- The network list ---- */

static ScoutWifiNetwork net(const char *ssid, int rssi, bool secured) {
    ScoutWifiNetwork n;
    memset(&n, 0, sizeof(n));
    strcpy(n.ssid, ssid);
    n.rssi = (int8_t)rssi;
    n.secured = secured;
    return n;
}

void test_the_list_drops_hidden_networks_merges_repeats_and_puts_the_strongest_first(void) {
    ScoutWifiNetwork in[] = {net("Lab", -80, true), net("", -40, true), net("Phone", -50, true),
                             net("Lab", -60, true)};
    ScoutWifiNetwork out[4];
    size_t n = scout_wifi_scan_tidy(in, 4, out, 4);
    TEST_ASSERT_EQUAL(2, n);
    TEST_ASSERT_EQUAL_STRING("Phone", out[0].ssid);
    TEST_ASSERT_EQUAL_STRING("Lab", out[1].ssid);
    TEST_ASSERT_EQUAL(-60, out[1].rssi);
}

void test_the_list_json_escapes_quotes_and_keeps_utf8(void) {
    ScoutWifiNetwork in[] = {net("a\"b\\c", -50, true), net("David\xE2\x80\x99s iPhone", -70, false)};
    char buf[200];
    size_t len = scout_wifi_scan_json(in, 2, buf, sizeof(buf));
    TEST_ASSERT_EQUAL_STRING("[{\"ssid\":\"a\\\"b\\\\c\",\"rssi\":-50,\"secured\":true},"
                             "{\"ssid\":\"David\xE2\x80\x99s iPhone\",\"rssi\":-70,\"secured\":false}]",
                             buf);
    TEST_ASSERT_EQUAL(strlen(buf), len);
}

void test_the_list_json_keeps_only_whole_entries_when_the_buffer_is_short(void) {
    ScoutWifiNetwork in[] = {net("One", -50, true), net("Two", -60, true)};
    char buf[50];
    scout_wifi_scan_json(in, 2, buf, sizeof(buf));
    TEST_ASSERT_EQUAL_STRING("[{\"ssid\":\"One\",\"rssi\":-50,\"secured\":true}]", buf);
}

void test_control_characters_in_a_name_are_escaped(void) {
    ScoutWifiNetwork in[] = {net("a\x01", -50, true)};
    char buf[80];
    scout_wifi_scan_json(in, 1, buf, sizeof(buf));
    TEST_ASSERT_EQUAL_STRING("[{\"ssid\":\"a\\u0001\",\"rssi\":-50,\"secured\":true}]", buf);
}

/* ---- Names and reasons ---- */

void test_the_setup_network_is_named_from_the_last_two_mac_bytes(void) {
    const uint8_t mac[6] = {0x24, 0x0a, 0xc4, 0x12, 0x1a, 0x2b};
    char name[24];
    scout_wifi_ap_name(mac, name, sizeof(name));
    TEST_ASSERT_EQUAL_STRING("SCOUT-Setup-1A2B", name);
}

void test_a_failed_handshake_reads_as_a_wrong_password(void) {
    TEST_ASSERT_EQUAL_STRING("wrong_password", scout_wifi_reason_name(15));
    TEST_ASSERT_EQUAL_STRING("wrong_password", scout_wifi_reason_name(202));
    TEST_ASSERT_EQUAL_STRING("not_found", scout_wifi_reason_name(201));
    TEST_ASSERT_EQUAL_STRING("failed", scout_wifi_reason_name(8));
}

/* ---- When the setup network opens and the station tries to join ---- */

static ScoutWifiActions step(ScoutWifiWatch *w, bool configured, bool connected, bool clients, uint32_t now) {
    ScoutWifiInputs in = {configured, connected, clients, now};
    return scout_wifi_step(w, &in);
}

void test_a_station_with_nothing_saved_opens_setup_at_once_and_never_tries_to_join(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    ScoutWifiActions a = step(&w, false, false, false, 100);
    TEST_ASSERT_TRUE(a.open_portal);
    TEST_ASSERT_FALSE(a.begin_join);
    TEST_ASSERT_TRUE(w.portal_open);
}

void test_a_configured_station_joins_at_boot_without_opening_setup(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    ScoutWifiActions a = step(&w, true, false, false, 100);
    TEST_ASSERT_TRUE(a.begin_join);
    TEST_ASSERT_FALSE(a.open_portal);
}

void test_setup_opens_after_90_s_without_a_connection(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, true, false, false, 100);
    TEST_ASSERT_FALSE(step(&w, true, false, false, SCOUT_WIFI_PORTAL_AFTER_MS - 1).open_portal);
    TEST_ASSERT_TRUE(step(&w, true, false, false, SCOUT_WIFI_PORTAL_AFTER_MS).open_portal);
}

void test_a_join_attempt_is_stopped_after_its_window_and_retried_later(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, true, false, false, 0);
    TEST_ASSERT_TRUE(step(&w, true, false, false, SCOUT_WIFI_JOIN_WINDOW_MS).stop_join);
    uint32_t stopped = SCOUT_WIFI_JOIN_WINDOW_MS;
    TEST_ASSERT_FALSE(step(&w, true, false, false, stopped + SCOUT_WIFI_JOIN_RETRY_MS - 1).begin_join);
    TEST_ASSERT_TRUE(step(&w, true, false, false, stopped + SCOUT_WIFI_JOIN_RETRY_MS).begin_join);
}

void test_no_new_join_starts_while_a_phone_is_on_the_setup_network(void) {
    /* A join attempt scans channels, which drops the phone off the setup network mid-typing. */
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, true, false, false, 0);
    step(&w, true, false, false, SCOUT_WIFI_JOIN_WINDOW_MS);
    step(&w, true, false, false, SCOUT_WIFI_PORTAL_AFTER_MS);
    TEST_ASSERT_FALSE(step(&w, true, false, true, SCOUT_WIFI_PORTAL_AFTER_MS + SCOUT_WIFI_JOIN_RETRY_MS * 3).begin_join);
}

void test_saving_starts_a_join_even_with_a_phone_on_the_setup_network(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, false, false, true, 0);
    scout_wifi_saved(&w);
    ScoutWifiActions a = step(&w, true, false, true, 500);
    TEST_ASSERT_TRUE(a.begin_join);
    TEST_ASSERT_TRUE(w.joining);
}

void test_setup_closes_after_a_minute_of_staying_connected(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, false, false, true, 0);
    step(&w, true, true, true, 1000);
    TEST_ASSERT_FALSE(step(&w, true, true, true, 1000 + SCOUT_WIFI_PORTAL_CLOSE_MS - 1).close_portal);
    TEST_ASSERT_TRUE(step(&w, true, true, true, 1000 + SCOUT_WIFI_PORTAL_CLOSE_MS).close_portal);
    TEST_ASSERT_FALSE(w.portal_open);
}

void test_a_dropped_connection_starts_a_new_join_at_once(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, true, true, false, 0);
    TEST_ASSERT_TRUE(step(&w, true, false, false, 5000).begin_join);
}

void test_opening_setup_by_hand_keeps_it_open_while_connected_for_ten_minutes(void) {
    ScoutWifiWatch w;
    scout_wifi_watch_begin(&w, 0);
    step(&w, true, true, false, 0);
    scout_wifi_force_portal(&w, 1000);
    TEST_ASSERT_TRUE(step(&w, true, true, true, 1000).open_portal);
    TEST_ASSERT_FALSE(step(&w, true, true, true, 1000 + SCOUT_WIFI_FORCED_MS - 1).close_portal);
    TEST_ASSERT_TRUE(step(&w, true, true, false, 1000 + SCOUT_WIFI_FORCED_MS).close_portal);
}

void test_the_timers_survive_the_millisecond_counter_wrapping(void) {
    ScoutWifiWatch w;
    uint32_t start = 0xFFFFFF00u;
    scout_wifi_watch_begin(&w, start);
    step(&w, true, false, false, start);
    TEST_ASSERT_FALSE(step(&w, true, false, false, start + 1000).open_portal);
    TEST_ASSERT_TRUE(step(&w, true, false, false, start + SCOUT_WIFI_PORTAL_AFTER_MS).open_portal);
}

int main(int, char **) {
    UNITY_BEGIN();
    RUN_TEST(test_a_new_network_with_password_and_token_is_accepted);
    RUN_TEST(test_an_iphone_hotspot_name_with_a_curly_apostrophe_is_kept_byte_for_byte);
    RUN_TEST(test_an_empty_network_name_is_refused);
    RUN_TEST(test_a_network_name_over_32_bytes_is_refused);
    RUN_TEST(test_a_password_under_8_characters_is_refused);
    RUN_TEST(test_a_64_character_hex_key_is_accepted_but_64_other_characters_are_not);
    RUN_TEST(test_an_open_network_needs_no_password);
    RUN_TEST(test_a_blank_password_for_the_saved_network_keeps_the_saved_password);
    RUN_TEST(test_a_blank_token_keeps_the_saved_token);
    RUN_TEST(test_a_first_setup_without_a_token_is_refused);
    RUN_TEST(test_a_token_that_is_not_a_station_token_is_refused);
    RUN_TEST(test_spaces_pasted_around_a_token_are_trimmed);
    RUN_TEST(test_every_form_error_has_a_message);
    RUN_TEST(test_the_list_drops_hidden_networks_merges_repeats_and_puts_the_strongest_first);
    RUN_TEST(test_the_list_json_escapes_quotes_and_keeps_utf8);
    RUN_TEST(test_the_list_json_keeps_only_whole_entries_when_the_buffer_is_short);
    RUN_TEST(test_control_characters_in_a_name_are_escaped);
    RUN_TEST(test_the_setup_network_is_named_from_the_last_two_mac_bytes);
    RUN_TEST(test_a_failed_handshake_reads_as_a_wrong_password);
    RUN_TEST(test_a_station_with_nothing_saved_opens_setup_at_once_and_never_tries_to_join);
    RUN_TEST(test_a_configured_station_joins_at_boot_without_opening_setup);
    RUN_TEST(test_setup_opens_after_90_s_without_a_connection);
    RUN_TEST(test_a_join_attempt_is_stopped_after_its_window_and_retried_later);
    RUN_TEST(test_no_new_join_starts_while_a_phone_is_on_the_setup_network);
    RUN_TEST(test_saving_starts_a_join_even_with_a_phone_on_the_setup_network);
    RUN_TEST(test_setup_closes_after_a_minute_of_staying_connected);
    RUN_TEST(test_a_dropped_connection_starts_a_new_join_at_once);
    RUN_TEST(test_opening_setup_by_hand_keeps_it_open_while_connected_for_ten_minutes);
    RUN_TEST(test_the_timers_survive_the_millisecond_counter_wrapping);
    return UNITY_END();
}
