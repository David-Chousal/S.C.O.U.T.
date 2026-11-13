/* Over-the-air update frames (lib/scout_ota), SCO-197.
 *
 * The golden vectors were produced by shore/scout_shore/ota.py with the TEST signing key
 * (seed = bytes 0..31, public below) and a 300-byte test image whose byte i is (7i + 3) & 0xFF;
 * scripts/check_packet_contract.py re-encodes them in CI, so the two ends cannot drift. */
#include <string.h>
#include <unity.h>

#include "scout_hmac.h"
#include "scout_ota.h"

static const uint32_t NOW = 1803859200u;  // 2027-03-01T00:00:00Z
static const uint32_t DAY = 86400u;
static const uint32_t V010 = 0x000100u;   // v0.1.0, running
static const uint32_t V020 = 0x000200u;   // v0.2.0, offered
static const uint32_t IMAGE_LEN = 300u;

static const uint8_t PUBKEY[32] = {
    0x03, 0xa1, 0x07, 0xbf, 0xf3, 0xce, 0x10, 0xbe, 0x1d, 0x70, 0xdd, 0x18, 0xe7, 0x4b, 0xc0, 0x99,
    0x67, 0xe4, 0xd6, 0x30, 0x9b, 0xa5, 0x0d, 0x5f, 0x1d, 0xdc, 0x86, 0x64, 0x12, 0x55, 0x31, 0xb8};

// ota.encode_offer(manifest_for(image, target_buoy=1, version=v0.2.0, build_time=NOW), sig)
static const uint8_t GOLDEN_OFFER[SCOUT_OTA_OFFER_SIZE] = {
    0xc2, 0x53, 0x43, 0x46, 0x57, 0x01, 0x00, 0x80, 0x00, 0x00, 0x02, 0x00, 0x00, 0x2c, 0x01, 0x00,
    0x00, 0x00, 0xb5, 0x84, 0x6b, 0x04, 0x77, 0x3f, 0x87, 0x26, 0xc8, 0x1c, 0xaf, 0xcf, 0xa1, 0xa0,
    0x9a, 0x82, 0x66, 0x4b, 0x98, 0xb0, 0x0d, 0x20, 0x21, 0x03, 0x1a, 0x17, 0x15, 0xbc, 0xa1, 0x15,
    0x4f, 0x2d, 0xad, 0x34, 0x72, 0xfa, 0xee, 0xee, 0x21, 0x06, 0xe6, 0x9e, 0xcc, 0xd2, 0xb0, 0xca,
    0x99, 0x2c, 0x7f, 0x38, 0x1c, 0x16, 0xe9, 0x51, 0x63, 0x25, 0xa3, 0xd1, 0xb0, 0xda, 0x8d, 0xd0,
    0x7e, 0xc9, 0xc6, 0xaf, 0x1f, 0x60, 0xb0, 0xad, 0xce, 0x79, 0xd2, 0x02, 0xae, 0x03, 0x0c, 0x81,
    0xd6, 0x88, 0xbe, 0xd5, 0xa8, 0xe7, 0xe7, 0xf8, 0x33, 0x29, 0xd2, 0x34, 0xf8, 0x27, 0x1c, 0xbf,
    0x27, 0x91, 0xda, 0x4d, 0x06};

// ota.encode_chunk(session, 2, image[256:300], last=True)
static const uint8_t GOLDEN_CHUNK2[53] = {
    0xc3, 0x04, 0x77, 0x02, 0x00, 0x2c, 0x01, 0x03, 0x0a, 0x11, 0x18, 0x1f, 0x26, 0x2d, 0x34, 0x3b,
    0x42, 0x49, 0x50, 0x57, 0x5e, 0x65, 0x6c, 0x73, 0x7a, 0x81, 0x88, 0x8f, 0x96, 0x9d, 0xa4, 0xab,
    0xb2, 0xb9, 0xc0, 0xc7, 0xce, 0xd5, 0xdc, 0xe3, 0xea, 0xf1, 0xf8, 0xff, 0x06, 0x0d, 0x14, 0x1b,
    0x22, 0x29, 0x30, 0x0f, 0x9a};

// ota.encode_ack(Ack(1, session, 16, 0x00ff, 0))
static const uint8_t GOLDEN_ACK[SCOUT_OTA_ACK_SIZE] = {0xc4, 0x01, 0x00, 0x04, 0x77, 0x10,
                                                       0x00, 0xff, 0x00, 0x00, 0x23, 0xb6};

// ota.encode_confirm(1, NOW, v0.2.0, bytes(range(32)))
static const uint8_t GOLDEN_CONFIRM[SCOUT_OTA_CONFIRM_SIZE] = {
    0xc5, 0x01, 0x00, 0x00, 0xb5, 0x84, 0x6b, 0x00, 0x02, 0x00, 0x00, 0x3c, 0xdb, 0x5c, 0xc4,
    0x4c, 0xb6, 0x18, 0xc5, 0x9a, 0xbd, 0x91, 0x4b, 0xdd, 0xeb, 0x8f, 0xf6, 0xc7, 0xc5};

static void test_image(uint8_t *out) {
    for (uint32_t i = 0; i < IMAGE_LEN; i++) {
        out[i] = (uint8_t)(7u * i + 3u);
    }
}

static void test_key(uint8_t key[32]) {
    for (uint8_t i = 0; i < 32; i++) {
        key[i] = i;
    }
}

static scout_ota_result_t check_offer(const uint8_t *frame, size_t len, uint16_t buoy,
                                      uint32_t running, ScoutOtaManifest *m) {
    return scout_ota_offer_check(frame, len, PUBKEY, buoy, running, m);
}

static void test_offer_matches_shore_golden_and_verifies(void) {
    ScoutOtaManifest m;
    TEST_ASSERT_EQUAL(SCOUT_OTA_OK, check_offer(GOLDEN_OFFER, sizeof(GOLDEN_OFFER), 1, V010, &m));
    TEST_ASSERT_EQUAL_UINT32(V020, m.version);
    TEST_ASSERT_EQUAL_UINT32(IMAGE_LEN, m.image_len);
    TEST_ASSERT_EQUAL_UINT16(0x7704, scout_ota_session_id(&m));

    uint8_t image[IMAGE_LEN];
    test_image(image);
    uint8_t digest[32];
    ScoutSha256 sha;
    scout_sha256_init(&sha);
    scout_sha256_update(&sha, image, sizeof(image));
    scout_sha256_final(&sha, digest);
    TEST_ASSERT_EQUAL_MEMORY(digest, m.sha256, 32);

    uint8_t again[SCOUT_OTA_MANIFEST_BYTES];
    scout_ota_manifest_encode(&m, again);
    TEST_ASSERT_EQUAL_MEMORY(GOLDEN_OFFER + 1, again, sizeof(again));
}

static void test_offer_with_any_byte_changed_fails_its_signature(void) {
    ScoutOtaManifest m;
    // Byte 13 is the low byte of the image length; byte 30 is inside the hash; 100 the signature.
    const size_t positions[] = {13, 30, 100};
    for (size_t i = 0; i < 3; i++) {
        uint8_t frame[SCOUT_OTA_OFFER_SIZE];
        memcpy(frame, GOLDEN_OFFER, sizeof(frame));
        frame[positions[i]] ^= 0x01;
        TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_SIGNATURE, check_offer(frame, sizeof(frame), 1, V010, &m));
    }
}

static void test_offer_cheap_checks_run_before_the_signature(void) {
    ScoutOtaManifest m;
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_LENGTH, check_offer(GOLDEN_OFFER, 116, 1, V010, &m));
    TEST_ASSERT_EQUAL(SCOUT_OTA_WRONG_BUOY, check_offer(GOLDEN_OFFER, sizeof(GOLDEN_OFFER), 2, V010, &m));
    TEST_ASSERT_EQUAL(SCOUT_OTA_NOT_NEWER, check_offer(GOLDEN_OFFER, sizeof(GOLDEN_OFFER), 1, V020, &m));
    uint8_t frame[SCOUT_OTA_OFFER_SIZE];
    memcpy(frame, GOLDEN_OFFER, sizeof(frame));
    frame[0] = 0xC1;
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_TYPE, check_offer(frame, sizeof(frame), 1, V010, &m));
    memcpy(frame, GOLDEN_OFFER, sizeof(frame));
    frame[1] = 0x00;
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_MAGIC, check_offer(frame, sizeof(frame), 1, V010, &m));
    memcpy(frame, GOLDEN_OFFER, sizeof(frame));
    frame[7] = 64;  // chunk size
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_GEOMETRY, check_offer(frame, sizeof(frame), 1, V010, &m));
}

static void test_chunk_matches_shore_golden_and_fits(void) {
    uint8_t image[IMAGE_LEN];
    test_image(image);
    uint8_t frame[SCOUT_OTA_CHUNK_FRAME_MAX];
    size_t n = scout_ota_chunk_encode(0x7704, 2, SCOUT_OTA_CHUNK_LAST, image + 256, 44, frame);
    TEST_ASSERT_EQUAL(sizeof(GOLDEN_CHUNK2), n);
    TEST_ASSERT_EQUAL_MEMORY(GOLDEN_CHUNK2, frame, n);

    ScoutOtaManifest m;
    TEST_ASSERT_EQUAL(SCOUT_OTA_OK, check_offer(GOLDEN_OFFER, sizeof(GOLDEN_OFFER), 1, V010, &m));
    ScoutOtaChunk c;
    TEST_ASSERT_EQUAL(SCOUT_OTA_OK, scout_ota_chunk_decode(frame, n, &c));
    TEST_ASSERT_EQUAL_UINT16(2, c.index);
    TEST_ASSERT_EQUAL_UINT8(SCOUT_OTA_CHUNK_LAST, c.flags);
    TEST_ASSERT_TRUE(scout_ota_chunk_fits(&m, &c));
    c.index = 1;  // a 44-byte chunk 1 is the wrong length for that index
    TEST_ASSERT_FALSE(scout_ota_chunk_fits(&m, &c));
}

static void test_chunk_decode_rejects_corruption(void) {
    uint8_t frame[sizeof(GOLDEN_CHUNK2)];
    memcpy(frame, GOLDEN_CHUNK2, sizeof(frame));
    frame[20] ^= 0x40;
    ScoutOtaChunk c;
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_CRC, scout_ota_chunk_decode(frame, sizeof(frame), &c));
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_LENGTH, scout_ota_chunk_decode(GOLDEN_CHUNK2, sizeof(frame) - 1, &c));
}

static void test_largest_frame_fits_the_payload_ceiling(void) {
    TEST_ASSERT_EQUAL(137, SCOUT_OTA_CHUNK_FRAME_MAX);
    TEST_ASSERT_TRUE(SCOUT_OTA_FRAME_MAX <= 140);
    TEST_ASSERT_TRUE(SCOUT_OTA_OFFER_SIZE <= 140);
}

static void test_ack_round_trips_and_matches_golden(void) {
    ScoutOtaAck ack = {1, 0x7704, 16, 0x00ff, SCOUT_OTA_ACK_PROGRESS};
    uint8_t frame[SCOUT_OTA_ACK_SIZE];
    scout_ota_ack_encode(&ack, frame);
    TEST_ASSERT_EQUAL_MEMORY(GOLDEN_ACK, frame, sizeof(frame));
    ScoutOtaAck back;
    TEST_ASSERT_EQUAL(SCOUT_OTA_OK, scout_ota_ack_decode(frame, sizeof(frame), &back));
    TEST_ASSERT_EQUAL_UINT16(16, back.base);
    TEST_ASSERT_EQUAL_UINT16(0x00ff, back.bitmap);
}

static void test_windows_walk_the_image_and_shore_sends_only_missing(void) {
    uint8_t map[SCOUT_OTA_MAP_BYTES];
    memset(map, 0, sizeof(map));
    const uint16_t count = 40;  // windows 0, 16 and 32 (the last holds 8 real chunks)
    TEST_ASSERT_EQUAL_UINT16(0, scout_ota_next_window(map, count));
    for (uint16_t i = 0; i < 16; i++) {
        scout_ota_map_set(map, i);
    }
    scout_ota_map_set(map, 17);
    TEST_ASSERT_EQUAL_UINT16(16, scout_ota_next_window(map, count));
    uint16_t bits = scout_ota_window_bitmap(map, count, 16);
    TEST_ASSERT_EQUAL_HEX16(0x0002, bits);

    uint16_t todo[SCOUT_OTA_WINDOW];
    TEST_ASSERT_EQUAL_UINT8(15, scout_ota_missing(16, bits, count, todo));
    TEST_ASSERT_EQUAL_UINT16(16, todo[0]);
    TEST_ASSERT_EQUAL_UINT16(18, todo[1]);

    for (uint16_t i = 16; i < 32; i++) {
        scout_ota_map_set(map, i);
    }
    TEST_ASSERT_EQUAL_UINT16(32, scout_ota_next_window(map, count));
    TEST_ASSERT_EQUAL_HEX16(0xFF00, scout_ota_window_bitmap(map, count, 32));
    TEST_ASSERT_EQUAL_UINT8(8, scout_ota_missing(32, 0xFF00, count, todo));
    for (uint16_t i = 32; i < count; i++) {
        scout_ota_map_set(map, i);
    }
    TEST_ASSERT_EQUAL_HEX16(SCOUT_OTA_ALL_HELD, scout_ota_next_window(map, count));
    TEST_ASSERT_EQUAL_UINT8(0, scout_ota_missing(SCOUT_OTA_ALL_HELD, 0, count, todo));
}

static void test_chunk_count_and_lengths(void) {
    TEST_ASSERT_EQUAL_UINT16(3, scout_ota_chunk_count(300));
    TEST_ASSERT_EQUAL_UINT16(2, scout_ota_chunk_count(256));
    TEST_ASSERT_EQUAL_UINT8(128, scout_ota_chunk_len(300, 0));
    TEST_ASSERT_EQUAL_UINT8(44, scout_ota_chunk_len(300, 2));
    TEST_ASSERT_EQUAL_UINT8(0, scout_ota_chunk_len(300, 3));
    TEST_ASSERT_TRUE(SCOUT_OTA_MAX_CHUNKS <= 0xFFFFu);
}

static void test_confirm_matches_golden_and_checks_in_order(void) {
    uint8_t key[32];
    test_key(key);
    uint8_t frame[SCOUT_OTA_CONFIRM_SIZE];
    scout_ota_confirm_encode(1, NOW, V020, key, frame);
    TEST_ASSERT_EQUAL_MEMORY(GOLDEN_CONFIRM, frame, sizeof(frame));

    uint32_t counter = 0;
    TEST_ASSERT_EQUAL(SCOUT_OTA_OK,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 1, NOW - 5, NOW, DAY, V020, &counter));
    TEST_ASSERT_EQUAL_UINT32(NOW, counter);
    TEST_ASSERT_EQUAL(SCOUT_OTA_WRONG_BUOY,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 2, 0, NOW, DAY, V020, &counter));
    TEST_ASSERT_EQUAL(SCOUT_OTA_REPLAY,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 1, NOW, NOW, DAY, V020, &counter));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STALE,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 1, 0, NOW + 2 * DAY, DAY, V020, &counter));
    TEST_ASSERT_EQUAL(SCOUT_OTA_WRONG_VERSION,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 1, 0, NOW, DAY, V010, &counter));
    key[0] ^= 1;
    TEST_ASSERT_EQUAL(SCOUT_OTA_BAD_TAG,
                      scout_ota_confirm_check(frame, sizeof(frame), key, 1, 0, NOW, DAY, V020, &counter));
}

static void test_version_packs_like_the_packet_fields(void) {
    TEST_ASSERT_EQUAL_HEX32(0x000100, scout_ota_version(0, 1, 0));
    TEST_ASSERT_TRUE(scout_ota_version(1, 0, 0) > scout_ota_version(0, 255, 255));
}

static void test_shore_step_follows_the_buoys_report(void) {
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_OFFER, scout_ota_shore_step(V020, V010, false, false, false));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_NONE, scout_ota_shore_step(V020, V010, false, false, true));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_CONFIRM, scout_ota_shore_step(V020, V020, true, false, false));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_CONFIRM, scout_ota_shore_step(V020, V020, true, false, true));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_NONE, scout_ota_shore_step(V020, V010, true, false, false));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_DONE, scout_ota_shore_step(V020, V020, false, false, false));
    TEST_ASSERT_EQUAL(SCOUT_OTA_STEP_ABANDON, scout_ota_shore_step(V020, V010, false, true, false));
}

static void run_all(void) {
    UNITY_BEGIN();
    RUN_TEST(test_offer_matches_shore_golden_and_verifies);
    RUN_TEST(test_offer_with_any_byte_changed_fails_its_signature);
    RUN_TEST(test_offer_cheap_checks_run_before_the_signature);
    RUN_TEST(test_chunk_matches_shore_golden_and_fits);
    RUN_TEST(test_chunk_decode_rejects_corruption);
    RUN_TEST(test_largest_frame_fits_the_payload_ceiling);
    RUN_TEST(test_ack_round_trips_and_matches_golden);
    RUN_TEST(test_windows_walk_the_image_and_shore_sends_only_missing);
    RUN_TEST(test_chunk_count_and_lengths);
    RUN_TEST(test_confirm_matches_golden_and_checks_in_order);
    RUN_TEST(test_version_packs_like_the_packet_fields);
    RUN_TEST(test_shore_step_follows_the_buoys_report);
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
