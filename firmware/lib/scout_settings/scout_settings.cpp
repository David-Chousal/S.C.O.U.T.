#include "scout_settings.h"

#include "scout_packet.h"
#include "scout_scheduler.h"

const ScoutSettingSpec SCOUT_SETTING_SPECS[SCOUT_SETTINGS_COUNT] = {
    {SCOUT_SET_TX_COUNT, "tx_count", SCOUT_SET_DEFAULT_TX_COUNT, SCOUT_TX_COUNT_MIN,
     SCOUT_TX_COUNT_MAX, 1, 0, {0, 0, 0, 0}},
    {SCOUT_SET_SLOT_PHASE, "slot_phase_h", SCOUT_SET_DEFAULT_SLOT_PHASE, 0, 7, 1, 0, {0, 0, 0, 0}},
    {SCOUT_SET_SAMPLE_MIN, "sample_interval_min", SCOUT_SET_DEFAULT_SAMPLE_MIN, 0, 0, 0, 3,
     {15, 30, 60, 0}},
    {SCOUT_SET_AUDIO_CLIP_S, "audio_clip_s", SCOUT_SET_DEFAULT_AUDIO_CLIP_S, 0, 0, 0, 4,
     {0, 15, 30, 60}},
    {SCOUT_SET_CONSERVE_MV, "conserve_mv", SCOUT_SET_DEFAULT_CONSERVE_MV, 3000, 3600, 10, 0,
     {0, 0, 0, 0}},
    {SCOUT_SET_CRITICAL_MV, "critical_mv", SCOUT_SET_DEFAULT_CRITICAL_MV, 2900, 3500, 10, 0,
     {0, 0, 0, 0}},
    {SCOUT_SET_CONSERVE_EVERY, "conserve_every", SCOUT_SET_DEFAULT_CONSERVE_EVERY, 1, 3, 1, 0,
     {0, 0, 0, 0}},
    {SCOUT_SET_HUMIDITY_PCT, "humidity_alert_pct", SCOUT_SET_DEFAULT_HUMIDITY_PCT, 40, 95, 1, 0,
     {0, 0, 0, 0}},
};

void scout_settings_defaults(ScoutSettings *out) {
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        out->v[i] = SCOUT_SETTING_SPECS[i].def;
    }
}

bool scout_setting_value_ok(uint8_t id, uint16_t value) {
    if (id < 1 || id > SCOUT_SETTINGS_COUNT) {
        return false;
    }
    const ScoutSettingSpec *spec = &SCOUT_SETTING_SPECS[id - 1u];
    if (spec->n_choices > 0) {
        for (uint8_t i = 0; i < spec->n_choices; i++) {
            if (spec->choices[i] == value) {
                return true;
            }
        }
        return false;
    }
    return value >= spec->min && value <= spec->max && (value - spec->min) % spec->step == 0;
}

bool scout_settings_valid(const ScoutSettings *s) {
    for (uint8_t id = 1; id <= SCOUT_SETTINGS_COUNT; id++) {
        if (!scout_setting_value_ok(id, scout_setting(s, id))) {
            return false;
        }
    }
    return scout_setting(s, SCOUT_SET_CRITICAL_MV) + SCOUT_SET_MIN_TIER_GAP_MV <=
           scout_setting(s, SCOUT_SET_CONSERVE_MV);
}

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

uint16_t scout_settings_digest(const ScoutSettings *s) {
    uint8_t bytes[2 * SCOUT_SETTINGS_COUNT];
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        put_u16(bytes + 2 * i, s->v[i]);
    }
    return scout_crc16_ccitt(bytes, sizeof(bytes));
}

uint32_t scout_settings_sample_interval_s(const ScoutSettings *s) {
    return 60u * scout_setting(s, SCOUT_SET_SAMPLE_MIN);
}

size_t scout_settings_tx_slots(const ScoutSettings *s, const uint32_t base_sod[3], uint32_t *out) {
    size_t n = scout_select_tx_slots(base_sod, 3, (uint8_t)scout_setting(s, SCOUT_SET_TX_COUNT), out);
    uint32_t shift = 3600u * scout_setting(s, SCOUT_SET_SLOT_PHASE);
    for (size_t i = 0; i < n; i++) {
        out[i] = (out[i] + shift) % SCOUT_SECONDS_PER_DAY;
    }
    return n;
}

size_t scout_settings_audio_hours(const ScoutSettings *s, const uint8_t *base_hours, size_t n,
                                  uint8_t *out) {
    uint16_t phase = scout_setting(s, SCOUT_SET_SLOT_PHASE);
    for (size_t i = 0; i < n; i++) {
        out[i] = (uint8_t)((base_hours[i] + phase) % 24u);
    }
    return n;
}

size_t scout_settings_block_encode(const ScoutSettings *s, uint32_t last_cmd_counter, uint8_t *out) {
    put_u32(out, SCOUT_SETTINGS_BLOCK_MAGIC);
    out[4] = SCOUT_SETTINGS_LAYOUT;
    out[5] = SCOUT_SETTINGS_COUNT;
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        put_u16(out + 6 + 2 * i, s->v[i]);
    }
    size_t at = 6 + 2 * SCOUT_SETTINGS_COUNT;
    put_u32(out + at, last_cmd_counter);
    at += 4;
    put_u16(out + at, scout_crc16_ccitt(out, at));
    return SCOUT_SETTINGS_BLOCK_SIZE;
}

bool scout_settings_block_decode(const uint8_t *buf, size_t len, ScoutSettings *s,
                                 uint32_t *last_cmd_counter) {
    if (len != SCOUT_SETTINGS_BLOCK_SIZE || get_u32(buf) != SCOUT_SETTINGS_BLOCK_MAGIC ||
        buf[4] != SCOUT_SETTINGS_LAYOUT || buf[5] != SCOUT_SETTINGS_COUNT) {
        return false;
    }
    size_t crc_at = SCOUT_SETTINGS_BLOCK_SIZE - 2;
    if (get_u16(buf + crc_at) != scout_crc16_ccitt(buf, crc_at)) {
        return false;
    }
    ScoutSettings read;
    for (size_t i = 0; i < SCOUT_SETTINGS_COUNT; i++) {
        read.v[i] = get_u16(buf + 6 + 2 * i);
    }
    if (!scout_settings_valid(&read)) {
        return false;
    }
    *s = read;
    *last_cmd_counter = get_u32(buf + 6 + 2 * SCOUT_SETTINGS_COUNT);
    return true;
}
