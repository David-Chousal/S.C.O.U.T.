#include "scout_downlink.h"

#include "scout_hmac.h"
#include "scout_packet.h"
#include "scout_scheduler.h"

static void put_u16(uint8_t *p, uint16_t v) {
    p[0] = (uint8_t)(v & 0xFF);
    p[1] = (uint8_t)(v >> 8);
}

static void put_u32(uint8_t *p, uint32_t v) {
    for (int i = 0; i < 4; i++) {
        p[i] = (uint8_t)((v >> (8 * i)) & 0xFF);
    }
}

static uint16_t get_u16(const uint8_t *p) {
    return (uint16_t)(p[0] | (p[1] << 8));
}

static uint32_t get_u32(const uint8_t *p) {
    uint32_t v = 0;
    for (int i = 0; i < 4; i++) {
        v |= (uint32_t)p[i] << (8 * i);
    }
    return v;
}

static void tag_n(const uint8_t *signed_bytes, size_t n, const uint8_t key[SCOUT_DL_KEY_BYTES],
                  uint8_t tag[SCOUT_DL_TAG_BYTES]) {
    uint8_t full[SCOUT_SHA256_DIGEST_BYTES];
    scout_hmac_sha256(key, SCOUT_DL_KEY_BYTES, signed_bytes, n, full);
    for (size_t i = 0; i < SCOUT_DL_TAG_BYTES; i++) {
        tag[i] = full[i];
    }
}

static void tag_of(const uint8_t *signed_bytes, const uint8_t key[SCOUT_DL_KEY_BYTES],
                   uint8_t tag[SCOUT_DL_TAG_BYTES]) {
    tag_n(signed_bytes, SCOUT_DL_SIGNED_BYTES, key, tag);
}

size_t scout_dl_encode(const ScoutCommand *cmd, const uint8_t key[SCOUT_DL_KEY_BYTES], uint8_t *out) {
    out[0] = SCOUT_DL_TYPE_CMD;
    out[1] = SCOUT_DL_VERSION;
    put_u16(out + 2, cmd->buoy_id);
    put_u32(out + 4, cmd->counter);
    out[8] = cmd->setting;
    out[9] = cmd->value;
    tag_of(out, key, out + SCOUT_DL_SIGNED_BYTES);
    size_t body = SCOUT_DL_SIGNED_BYTES + SCOUT_DL_TAG_BYTES;
    put_u16(out + body, scout_crc16_ccitt(out, body));
    return SCOUT_DL_CMD_SIZE;
}

static bool value_in_range(uint8_t setting, uint8_t value) {
    return setting == SCOUT_DL_SETTING_TX_COUNT && scout_tx_count_valid(value);
}

static bool counter_is_fresh(uint32_t counter, uint32_t now_epoch, uint32_t max_skew_s) {
    if (max_skew_s == 0) {
        return true;
    }
    uint32_t distance = counter > now_epoch ? counter - now_epoch : now_epoch - counter;
    return distance <= max_skew_s;
}

size_t scout_dl_encode_settings(const ScoutSettingsCommand *cmd, const uint8_t key[SCOUT_DL_KEY_BYTES],
                                uint8_t *out) {
    out[0] = SCOUT_DL_TYPE_CMD;
    out[1] = SCOUT_DL_VERSION_SETTINGS;
    put_u16(out + 2, cmd->buoy_id);
    put_u32(out + 4, cmd->counter);
    out[8] = SCOUT_SETTINGS_COUNT;
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        put_u16(out + 9 + 2 * i, cmd->settings.v[i]);
    }
    tag_n(out, SCOUT_DL_SETTINGS_SIGNED_BYTES, key, out + SCOUT_DL_SETTINGS_SIGNED_BYTES);
    size_t body = SCOUT_DL_SETTINGS_SIGNED_BYTES + SCOUT_DL_TAG_BYTES;
    put_u16(out + body, scout_crc16_ccitt(out, body));
    return SCOUT_DL_SETTINGS_SIZE;
}

scout_dl_result_t scout_dl_decode(const uint8_t *buf, size_t len,
                                  const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                  uint32_t last_counter, uint32_t now_epoch, uint32_t max_skew_s,
                                  ScoutCommand *out) {
    if (len != SCOUT_DL_CMD_SIZE) {
        return SCOUT_DL_BAD_LENGTH;
    }
    size_t body = SCOUT_DL_SIGNED_BYTES + SCOUT_DL_TAG_BYTES;
    if (get_u16(buf + body) != scout_crc16_ccitt(buf, body)) {
        return SCOUT_DL_BAD_CRC;
    }
    if (buf[0] != SCOUT_DL_TYPE_CMD) {
        return SCOUT_DL_BAD_TYPE;
    }
    if (buf[1] != SCOUT_DL_VERSION) {
        return SCOUT_DL_BAD_VERSION;
    }
    ScoutCommand cmd;
    cmd.buoy_id = get_u16(buf + 2);
    if (cmd.buoy_id != SCOUT_DL_BUOY_ALL && cmd.buoy_id != my_buoy_id) {
        return SCOUT_DL_WRONG_BUOY;
    }
    uint8_t expected[SCOUT_DL_TAG_BYTES];
    tag_of(buf, key, expected);
    if (!scout_ct_equal(expected, buf + SCOUT_DL_SIGNED_BYTES, SCOUT_DL_TAG_BYTES)) {
        return SCOUT_DL_BAD_TAG;
    }
    cmd.counter = get_u32(buf + 4);
    if (cmd.counter <= last_counter) {
        return SCOUT_DL_REPLAY;
    }
    if (!counter_is_fresh(cmd.counter, now_epoch, max_skew_s)) {
        return SCOUT_DL_STALE;
    }
    cmd.setting = buf[8];
    cmd.value = buf[9];
    if (cmd.setting != SCOUT_DL_SETTING_TX_COUNT) {
        return SCOUT_DL_UNKNOWN_SETTING;
    }
    if (!value_in_range(cmd.setting, cmd.value)) {
        return SCOUT_DL_OUT_OF_RANGE;
    }
    *out = cmd;
    return SCOUT_DL_OK;
}

/* Length, CRC, type, version (which must fit the length), buoy ID, tag, replay and age: the
 * checks every frame passes before anything the sender chose is trusted. */
static scout_dl_result_t check_envelope(const uint8_t *buf, size_t len,
                                        const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                        uint32_t last_counter, uint32_t now_epoch,
                                        uint32_t max_skew_s) {
    size_t signed_n;
    uint8_t version;
    if (len == SCOUT_DL_CMD_SIZE) {
        signed_n = SCOUT_DL_SIGNED_BYTES;
        version = SCOUT_DL_VERSION;
    } else if (len == SCOUT_DL_SETTINGS_SIZE) {
        signed_n = SCOUT_DL_SETTINGS_SIGNED_BYTES;
        version = SCOUT_DL_VERSION_SETTINGS;
    } else {
        return SCOUT_DL_BAD_LENGTH;
    }
    size_t body = signed_n + SCOUT_DL_TAG_BYTES;
    if (get_u16(buf + body) != scout_crc16_ccitt(buf, body)) {
        return SCOUT_DL_BAD_CRC;
    }
    if (buf[0] != SCOUT_DL_TYPE_CMD) {
        return SCOUT_DL_BAD_TYPE;
    }
    if (buf[1] != version) {
        return SCOUT_DL_BAD_VERSION;
    }
    uint16_t buoy_id = get_u16(buf + 2);
    if (buoy_id != SCOUT_DL_BUOY_ALL && buoy_id != my_buoy_id) {
        return SCOUT_DL_WRONG_BUOY;
    }
    uint8_t expected[SCOUT_DL_TAG_BYTES];
    tag_n(buf, signed_n, key, expected);
    if (!scout_ct_equal(expected, buf + signed_n, SCOUT_DL_TAG_BYTES)) {
        return SCOUT_DL_BAD_TAG;
    }
    uint32_t counter = get_u32(buf + 4);
    if (counter <= last_counter) {
        return SCOUT_DL_REPLAY;
    }
    if (!counter_is_fresh(counter, now_epoch, max_skew_s)) {
        return SCOUT_DL_STALE;
    }
    return SCOUT_DL_OK;
}

scout_dl_result_t scout_dl_decode_any(const uint8_t *buf, size_t len,
                                      const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                      uint32_t last_counter, uint32_t now_epoch, uint32_t max_skew_s,
                                      const ScoutSettings *current, ScoutSettings *next,
                                      uint32_t *counter) {
    scout_dl_result_t envelope =
        check_envelope(buf, len, key, my_buoy_id, last_counter, now_epoch, max_skew_s);
    if (envelope != SCOUT_DL_OK) {
        return envelope;
    }
    ScoutSettings wanted = *current;
    if (len == SCOUT_DL_CMD_SIZE) {
        if (buf[8] != SCOUT_DL_SETTING_TX_COUNT) {
            return SCOUT_DL_UNKNOWN_SETTING;
        }
        wanted.v[SCOUT_SET_TX_COUNT - 1] = buf[9];
    } else {
        if (buf[8] != SCOUT_SETTINGS_COUNT) {
            return SCOUT_DL_UNKNOWN_SETTING;  // built against another registry
        }
        for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
            wanted.v[i] = get_u16(buf + 9 + 2 * i);
        }
    }
    if (!scout_settings_valid(&wanted)) {
        return SCOUT_DL_OUT_OF_RANGE;
    }
    *next = wanted;
    *counter = get_u32(buf + 4);
    return SCOUT_DL_OK;
}

bool scout_dl_is_rejection(scout_dl_result_t result) {
    return result >= SCOUT_DL_BAD_TAG;
}

static bool parse_uint(const char **p, uint32_t max, uint32_t *out) {
    uint32_t v = 0;
    const char *start = *p;
    while (**p >= '0' && **p <= '9') {
        v = v * 10u + (uint32_t)(**p - '0');
        if (v > max) {
            return false;
        }
        (*p)++;
    }
    *out = v;
    return *p != start;
}

bool scout_dl_parse_set_command(const char *line, uint16_t *buoy_id, uint8_t *tx_count) {
    const char *p = line;
    uint32_t buoy = 0;
    uint32_t count = 0;
    if (*p++ != 'N' || !parse_uint(&p, 0xFFFFu, &buoy) || *p++ != ':' ||
        !parse_uint(&p, 255u, &count)) {
        return false;
    }
    while (*p == '\r' || *p == ' ') {
        p++;
    }
    if (*p != '\0' || buoy == 0 || !scout_tx_count_valid((uint8_t)count)) {
        return false;
    }
    *buoy_id = (uint16_t)buoy;
    *tx_count = (uint8_t)count;
    return true;
}

bool scout_dl_parse_settings_command(const char *line, uint16_t *buoy_id, ScoutSettings *settings) {
    const char *p = line;
    uint32_t buoy = 0;
    if (*p++ != 'S' || !parse_uint(&p, 0xFFFFu, &buoy) || *p++ != ':' || buoy == 0) {
        return false;
    }
    ScoutSettings parsed;
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        uint32_t value = 0;
        if (!parse_uint(&p, 0xFFFFu, &value)) {
            return false;
        }
        parsed.v[i] = (uint16_t)value;
        if (i + 1 < SCOUT_SETTINGS_COUNT && *p++ != ',') {
            return false;
        }
    }
    while (*p == '\r' || *p == ' ') {
        p++;
    }
    if (*p != '\0' || !scout_settings_valid(&parsed)) {
        return false;
    }
    *buoy_id = (uint16_t)buoy;
    *settings = parsed;
    return true;
}
