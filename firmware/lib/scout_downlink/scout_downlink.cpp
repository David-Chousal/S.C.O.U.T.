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

static void tag_of(const uint8_t *signed_bytes, const uint8_t key[SCOUT_DL_KEY_BYTES],
                   uint8_t tag[SCOUT_DL_TAG_BYTES]) {
    uint8_t full[SCOUT_SHA256_DIGEST_BYTES];
    scout_hmac_sha256(key, SCOUT_DL_KEY_BYTES, signed_bytes, SCOUT_DL_SIGNED_BYTES, full);
    for (size_t i = 0; i < SCOUT_DL_TAG_BYTES; i++) {
        tag[i] = full[i];
    }
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
