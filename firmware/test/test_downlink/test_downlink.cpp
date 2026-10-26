/* Settings downlink (lib/scout_downlink) and its HMAC (lib/scout_hmac), SCO-198.
 *
 * GOLDEN was produced by shore/scout_shore/downlink.py; scripts/check_packet_contract.py
 * re-encodes the same command in CI, so the two ends cannot drift apart. */
#include <string.h>
#include <unity.h>

#include "scout_downlink.h"
#include "scout_hmac.h"
#include "scout_packet.h"

static const uint32_t NOW = 1803859200u;  // 2027-03-01T00:00:00Z
static const uint32_t DAY = 86400u;

// downlink.encode(set_tx_count(1, 2, now_epoch=1803859200), bytes(range(32)))
static const uint8_t GOLDEN[SCOUT_DL_CMD_SIZE] = {
    0xc1, 0x01, 0x01, 0x00, 0x00, 0xb5, 0x84, 0x6b, 0x01, 0x02, 0x2a, 0x0c, 0xc2, 0xc6,
    0xd7, 0x3d, 0x09, 0x5d, 0x5f, 0x2f, 0x3f, 0x92, 0x9f, 0x9e, 0xe0, 0x29, 0x38, 0x40};

static void test_key(uint8_t key[SCOUT_DL_KEY_BYTES]) {
    for (uint8_t i = 0; i < SCOUT_DL_KEY_BYTES; i++) {
        key[i] = i;
    }
}

static ScoutCommand cmd(uint16_t buoy, uint32_t counter, uint8_t setting, uint8_t value) {
    ScoutCommand c;
    c.buoy_id = buoy;
    c.counter = counter;
    c.setting = setting;
    c.value = value;
    return c;
}

static scout_dl_result_t decode_for_buoy_1(const uint8_t *frame, size_t len, uint32_t last,
                                           ScoutCommand *out) {
    uint8_t key[SCOUT_DL_KEY_BYTES];
    test_key(key);
    return scout_dl_decode(frame, len, key, 1, last, NOW, DAY, out);
}

static void hex_equal(const char *hex, const uint8_t *bytes, size_t len) {
    char got[2 * SCOUT_SHA256_DIGEST_BYTES + 1];
    for (size_t i = 0; i < len; i++) {
        static const char digits[] = "0123456789abcdef";
        got[2 * i] = digits[bytes[i] >> 4];
        got[2 * i + 1] = digits[bytes[i] & 0xF];
    }
    got[2 * len] = '\0';
    TEST_ASSERT_EQUAL_STRING(hex, got);
}

void test_sha256_fips_vectors(void) {
    uint8_t out[SCOUT_SHA256_DIGEST_BYTES];
    ScoutSha256 ctx;
    scout_sha256_init(&ctx);
    scout_sha256_update(&ctx, (const uint8_t *)"abc", 3);
    scout_sha256_final(&ctx, out);
    hex_equal("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", out, 32);

    scout_sha256_init(&ctx);
    scout_sha256_final(&ctx, out);
    hex_equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", out, 32);

    // Two blocks: the 56-byte FIPS message forces the length into a second block.
    const char *two = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
    scout_sha256_init(&ctx);
    scout_sha256_update(&ctx, (const uint8_t *)two, strlen(two));
    scout_sha256_final(&ctx, out);
    hex_equal("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1", out, 32);
}

void test_hmac_rfc4231_case_2(void) {
    uint8_t out[SCOUT_SHA256_DIGEST_BYTES];
    const char *msg = "what do ya want for nothing?";
    scout_hmac_sha256((const uint8_t *)"Jefe", 4, (const uint8_t *)msg, strlen(msg), out);
    hex_equal("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843", out, 32);
}

void test_hmac_rfc4231_case_6_long_key(void) {
    uint8_t key[131];
    memset(key, 0xaa, sizeof(key));
    const char *msg = "Test Using Larger Than Block-Size Key - Hash Key First";
    uint8_t out[SCOUT_SHA256_DIGEST_BYTES];
    scout_hmac_sha256(key, sizeof(key), (const uint8_t *)msg, strlen(msg), out);
    hex_equal("60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54", out, 32);
}

void test_encode_matches_shore_golden(void) {
    uint8_t key[SCOUT_DL_KEY_BYTES];
    test_key(key);
    ScoutCommand c = cmd(1, NOW, SCOUT_DL_SETTING_TX_COUNT, 2);
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    TEST_ASSERT_EQUAL_UINT(SCOUT_DL_CMD_SIZE, scout_dl_encode(&c, key, frame));
    TEST_ASSERT_EQUAL_HEX8_ARRAY(GOLDEN, frame, SCOUT_DL_CMD_SIZE);
}

void test_golden_decodes_to_set_tx_count_2(void) {
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_OK, decode_for_buoy_1(GOLDEN, sizeof(GOLDEN), 0, &got));
    TEST_ASSERT_EQUAL_UINT8(2, got.value);
    TEST_ASSERT_EQUAL_UINT32(NOW, got.counter);
}

void test_rejects_wrong_length(void) {
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_LENGTH, decode_for_buoy_1(GOLDEN, 27, 0, &got));
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_LENGTH, decode_for_buoy_1(GOLDEN, 44, 0, &got));
}

void test_rejects_a_corrupt_byte_on_crc(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    memcpy(frame, GOLDEN, sizeof(frame));
    frame[9] ^= 0x01;
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_CRC, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

// Re-tags and re-CRCs a frame after its signed bytes were edited, so the check under test is
// the one that fails rather than the tag or CRC.
static void resign(uint8_t frame[SCOUT_DL_CMD_SIZE]) {
    uint8_t key[SCOUT_DL_KEY_BYTES];
    test_key(key);
    uint8_t tag[SCOUT_SHA256_DIGEST_BYTES];
    scout_hmac_sha256(key, SCOUT_DL_KEY_BYTES, frame, SCOUT_DL_SIGNED_BYTES, tag);
    memcpy(frame + SCOUT_DL_SIGNED_BYTES, tag, SCOUT_DL_TAG_BYTES);
    uint16_t crc = scout_crc16_ccitt(frame, SCOUT_DL_SIGNED_BYTES + SCOUT_DL_TAG_BYTES);
    frame[26] = (uint8_t)(crc & 0xFF);
    frame[27] = (uint8_t)(crc >> 8);
}

void test_rejects_an_uplink_type_byte(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    memcpy(frame, GOLDEN, sizeof(frame));
    frame[0] = 4;  // a v4 packet's first byte
    resign(frame);
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_TYPE, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

void test_rejects_another_version(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    memcpy(frame, GOLDEN, sizeof(frame));
    frame[1] = SCOUT_DL_VERSION + 1;
    resign(frame);
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_VERSION, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

static void signed_frame(ScoutCommand c, uint8_t frame[SCOUT_DL_CMD_SIZE]) {
    uint8_t key[SCOUT_DL_KEY_BYTES];
    test_key(key);
    scout_dl_encode(&c, key, frame);
}

void test_buoy_id_check(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    ScoutCommand got;
    signed_frame(cmd(2, NOW, SCOUT_DL_SETTING_TX_COUNT, 1), frame);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_WRONG_BUOY, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
    signed_frame(cmd(SCOUT_DL_BUOY_ALL, NOW, SCOUT_DL_SETTING_TX_COUNT, 1), frame);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_OK, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

void test_rejects_a_tag_made_with_another_key(void) {
    uint8_t other[SCOUT_DL_KEY_BYTES];
    memset(other, 0x42, sizeof(other));
    ScoutCommand c = cmd(1, NOW, SCOUT_DL_SETTING_TX_COUNT, 2);
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    scout_dl_encode(&c, other, frame);
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_BAD_TAG, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

void test_rejects_replay_and_old_counters(void) {
    ScoutCommand got;
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_REPLAY, decode_for_buoy_1(GOLDEN, sizeof(GOLDEN), NOW, &got));
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_REPLAY,
                          decode_for_buoy_1(GOLDEN, sizeof(GOLDEN), NOW + 1, &got));
}

void test_rejects_a_counter_far_from_the_buoy_clock(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    ScoutCommand got;
    signed_frame(cmd(1, NOW - DAY - 1, SCOUT_DL_SETTING_TX_COUNT, 1), frame);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_STALE, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
    signed_frame(cmd(1, NOW + DAY + 1, SCOUT_DL_SETTING_TX_COUNT, 1), frame);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_STALE, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
    // max_skew 0 (clock not set) skips the age check.
    uint8_t key[SCOUT_DL_KEY_BYTES];
    test_key(key);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_OK,
                          scout_dl_decode(frame, sizeof(frame), key, 1, 0, 0, 0, &got));
}

void test_rejects_an_unknown_setting(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    ScoutCommand got;
    signed_frame(cmd(1, NOW, 7, 2), frame);
    TEST_ASSERT_EQUAL_INT(SCOUT_DL_UNKNOWN_SETTING,
                          decode_for_buoy_1(frame, sizeof(frame), 0, &got));
}

void test_range_check_on_the_transmit_count(void) {
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    ScoutCommand got;
    const uint8_t bad[] = {0, 4, 255};
    for (size_t i = 0; i < sizeof(bad); i++) {
        signed_frame(cmd(1, NOW, SCOUT_DL_SETTING_TX_COUNT, bad[i]), frame);
        TEST_ASSERT_EQUAL_INT(SCOUT_DL_OUT_OF_RANGE,
                              decode_for_buoy_1(frame, sizeof(frame), 0, &got));
    }
    for (uint8_t n = 1; n <= 3; n++) {
        signed_frame(cmd(1, NOW, SCOUT_DL_SETTING_TX_COUNT, n), frame);
        TEST_ASSERT_EQUAL_INT(SCOUT_DL_OK, decode_for_buoy_1(frame, sizeof(frame), 0, &got));
        TEST_ASSERT_EQUAL_UINT8(n, got.value);
    }
}

void test_only_refusals_of_our_own_commands_count_as_rejections(void) {
    TEST_ASSERT_FALSE(scout_dl_is_rejection(SCOUT_DL_OK));
    TEST_ASSERT_FALSE(scout_dl_is_rejection(SCOUT_DL_BAD_LENGTH));  // e.g. another buoy's uplink
    TEST_ASSERT_FALSE(scout_dl_is_rejection(SCOUT_DL_BAD_CRC));
    TEST_ASSERT_FALSE(scout_dl_is_rejection(SCOUT_DL_WRONG_BUOY));
    TEST_ASSERT_TRUE(scout_dl_is_rejection(SCOUT_DL_BAD_TAG));
    TEST_ASSERT_TRUE(scout_dl_is_rejection(SCOUT_DL_REPLAY));
    TEST_ASSERT_TRUE(scout_dl_is_rejection(SCOUT_DL_OUT_OF_RANGE));
}

void test_frame_fits_the_payload_ceiling(void) {
    TEST_ASSERT_TRUE(SCOUT_DL_CMD_SIZE <= 140u);
}

void test_shore_set_command_parses(void) {
    uint16_t buoy = 0;
    uint8_t count = 0;
    TEST_ASSERT_TRUE(scout_dl_parse_set_command("N1:2", &buoy, &count));
    TEST_ASSERT_EQUAL_UINT16(1, buoy);
    TEST_ASSERT_EQUAL_UINT8(2, count);
    TEST_ASSERT_TRUE(scout_dl_parse_set_command("N12:3\r", &buoy, &count));
    TEST_ASSERT_EQUAL_UINT16(12, buoy);
}

void test_shore_set_command_rejects_malformed_or_out_of_range(void) {
    uint16_t buoy = 7;
    uint8_t count = 7;
    const char *bad[] = {"N1:0", "N1:4", "N0:2", "N:2", "N1:", "N1-2", "T1803859200", "N1:2x",
                         "N70000:1", ""};
    for (size_t i = 0; i < sizeof(bad) / sizeof(bad[0]); i++) {
        TEST_ASSERT_FALSE_MESSAGE(scout_dl_parse_set_command(bad[i], &buoy, &count), bad[i]);
    }
    TEST_ASSERT_EQUAL_UINT16(7, buoy);  // untouched on failure
}

static void run_all() {
    UNITY_BEGIN();
    RUN_TEST(test_sha256_fips_vectors);
    RUN_TEST(test_hmac_rfc4231_case_2);
    RUN_TEST(test_hmac_rfc4231_case_6_long_key);
    RUN_TEST(test_encode_matches_shore_golden);
    RUN_TEST(test_golden_decodes_to_set_tx_count_2);
    RUN_TEST(test_rejects_wrong_length);
    RUN_TEST(test_rejects_a_corrupt_byte_on_crc);
    RUN_TEST(test_rejects_an_uplink_type_byte);
    RUN_TEST(test_rejects_another_version);
    RUN_TEST(test_buoy_id_check);
    RUN_TEST(test_rejects_a_tag_made_with_another_key);
    RUN_TEST(test_rejects_replay_and_old_counters);
    RUN_TEST(test_rejects_a_counter_far_from_the_buoy_clock);
    RUN_TEST(test_rejects_an_unknown_setting);
    RUN_TEST(test_range_check_on_the_transmit_count);
    RUN_TEST(test_only_refusals_of_our_own_commands_count_as_rejections);
    RUN_TEST(test_frame_fits_the_payload_ceiling);
    RUN_TEST(test_shore_set_command_parses);
    RUN_TEST(test_shore_set_command_rejects_malformed_or_out_of_range);
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
