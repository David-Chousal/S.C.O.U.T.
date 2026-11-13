#include "scout_fw_state.h"

#include <string.h>

uint32_t scout_crc32_update(uint32_t crc, const uint8_t *data, size_t len) {
    crc = ~crc;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t bit = 0; bit < 8; bit++) {
            crc = (crc >> 1) ^ (0xEDB88320u & (0u - (crc & 1u)));
        }
    }
    return ~crc;
}

const char *scout_fw_slot_path(uint8_t slot) { return slot ? "FW/B.BIN" : "FW/A.BIN"; }

static void put_u32(uint8_t *p, uint32_t v) {
    p[0] = (uint8_t)v;
    p[1] = (uint8_t)(v >> 8);
    p[2] = (uint8_t)(v >> 16);
    p[3] = (uint8_t)(v >> 24);
}

static uint32_t get_u32(const uint8_t *p) {
    return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

/* magic | seq | phase good_slot attempts trial_slots rolled_back 0 0 0 | good v,len,crc |
 * new v,len,crc | crc32 over the first 40 bytes */
size_t scout_fw_state_encode(const ScoutFwState *s, uint8_t out[SCOUT_FW_STATE_RECORD_BYTES]) {
    memset(out, 0, SCOUT_FW_STATE_RECORD_BYTES);
    put_u32(out + 0, SCOUT_FW_STATE_MAGIC);
    put_u32(out + 4, s->seq);
    out[8] = s->phase;
    out[9] = s->good_slot;
    out[10] = s->attempts;
    out[11] = s->trial_slots;
    out[12] = s->rolled_back;
    put_u32(out + 16, s->good_version);
    put_u32(out + 20, s->good_len);
    put_u32(out + 24, s->good_crc);
    put_u32(out + 28, s->new_version);
    put_u32(out + 32, s->new_len);
    put_u32(out + 36, s->new_crc);
    put_u32(out + 40, scout_crc32_update(0, out, 40));
    return SCOUT_FW_STATE_RECORD_BYTES;
}

uint32_t scout_fw_state_offset(const ScoutFwState *s) {
    return (s->seq & 1u) * SCOUT_FW_STATE_COPY_STRIDE;
}

static bool decode_copy(const uint8_t *in, ScoutFwState *out) {
    if (get_u32(in) != SCOUT_FW_STATE_MAGIC || get_u32(in + 40) != scout_crc32_update(0, in, 40)) {
        return false;
    }
    if (in[8] > SCOUT_FW_ROLLBACK || in[9] > 1) {
        return false;
    }
    out->seq = get_u32(in + 4);
    out->phase = in[8];
    out->good_slot = in[9];
    out->attempts = in[10];
    out->trial_slots = in[11];
    out->rolled_back = in[12];
    out->good_version = get_u32(in + 16);
    out->good_len = get_u32(in + 20);
    out->good_crc = get_u32(in + 24);
    out->new_version = get_u32(in + 28);
    out->new_len = get_u32(in + 32);
    out->new_crc = get_u32(in + 36);
    return true;
}

bool scout_fw_state_load(const uint8_t *file, size_t len, ScoutFwState *out) {
    ScoutFwState copy[2];
    bool ok[2] = {false, false};
    for (uint8_t i = 0; i < 2; i++) {
        size_t at = i * SCOUT_FW_STATE_COPY_STRIDE;
        if (len >= at + SCOUT_FW_STATE_RECORD_BYTES) {
            ok[i] = decode_copy(file + at, &copy[i]);
        }
    }
    if (!ok[0] && !ok[1]) {
        return false;
    }
    if (ok[0] && ok[1]) {
        *out = copy[1].seq > copy[0].seq ? copy[1] : copy[0];
    } else {
        *out = ok[0] ? copy[0] : copy[1];
    }
    return true;
}

static void to_idle(ScoutFwState *s, uint8_t rolled_back) {
    s->phase = SCOUT_FW_IDLE;
    s->attempts = 0;
    s->trial_slots = 0;
    s->rolled_back = rolled_back;
}

scout_boot_action_t scout_fw_boot_begin(const ScoutFwState *cur, ScoutFwState *next) {
    *next = *cur;
    switch (cur->phase) {
        case SCOUT_FW_PENDING:
        case SCOUT_FW_TRIAL:
            next->seq++;
            next->attempts++;
            if (next->attempts > SCOUT_FW_MAX_ATTEMPTS) {
                return SCOUT_BOOT_FLASH_GOOD;
            }
            return cur->phase == SCOUT_FW_PENDING ? SCOUT_BOOT_FLASH_NEW : SCOUT_BOOT_JUMP;
        case SCOUT_FW_ROLLBACK:
            next->seq++;
            return SCOUT_BOOT_FLASH_GOOD;
        default:
            return SCOUT_BOOT_JUMP;
    }
}

scout_boot_action_t scout_fw_boot_after(const ScoutFwState *cur, scout_boot_action_t done,
                                        scout_flash_result_t result, ScoutFwState *next) {
    *next = *cur;
    next->seq++;
    if (done == SCOUT_BOOT_FLASH_NEW) {
        if (result == SCOUT_FLASH_OK) {
            next->phase = SCOUT_FW_TRIAL;
            next->attempts = 0;
            next->trial_slots = 0;
            return SCOUT_BOOT_JUMP;
        }
        if (result == SCOUT_FLASH_SOURCE_BAD) {
            to_idle(next, SCOUT_FW_RB_DISCARDED);  // flash untouched: the good image still runs
            return SCOUT_BOOT_JUMP;
        }
        return SCOUT_BOOT_FLASH_GOOD;  // flash half-written: restore the good image now
    }
    if (done == SCOUT_BOOT_FLASH_GOOD) {
        // A good image that fails its CRC was never erased over; whatever is in flash stays.
        to_idle(next, result == SCOUT_FLASH_OK ? SCOUT_FW_RB_RESTORED : SCOUT_FW_RB_GOOD_MISSING);
        if (result != SCOUT_FLASH_OK) {
            // Keep the record honest: the image in flash is the trial one, now the only copy.
            next->good_slot = (uint8_t)(1u - cur->good_slot);
            next->good_version = cur->new_version;
            next->good_len = cur->new_len;
            next->good_crc = cur->new_crc;
        }
        return SCOUT_BOOT_JUMP;
    }
    return SCOUT_BOOT_JUMP;
}

bool scout_fw_needs_adopt(bool valid, const ScoutFwState *s, uint32_t running_version) {
    if (!valid) {
        return true;
    }
    if (s->phase == SCOUT_FW_TRIAL) {
        return s->new_version != running_version;
    }
    return s->good_version != running_version;
}

void scout_fw_adopt(ScoutFwState *s, uint32_t version, uint32_t len, uint32_t crc) {
    uint32_t seq = s->seq;
    memset(s, 0, sizeof(*s));
    s->seq = seq + 1u;
    s->phase = SCOUT_FW_IDLE;
    s->good_slot = 0;
    s->good_version = version;
    s->good_len = len;
    s->good_crc = crc;
}

uint8_t scout_fw_receive_slot(const ScoutFwState *s) { return (uint8_t)(1u - s->good_slot); }

void scout_fw_stage(ScoutFwState *s, uint32_t version, uint32_t len, uint32_t crc) {
    s->seq++;
    s->phase = SCOUT_FW_PENDING;
    s->attempts = 0;
    s->trial_slots = 0;
    s->new_version = version;
    s->new_len = len;
    s->new_crc = crc;
}

void scout_fw_confirm(ScoutFwState *s) {
    s->seq++;
    s->good_slot = scout_fw_receive_slot(s);
    s->good_version = s->new_version;
    s->good_len = s->new_len;
    s->good_crc = s->new_crc;
    to_idle(s, SCOUT_FW_RB_NONE);
}

bool scout_fw_trial_slot_missed(ScoutFwState *s) {
    s->seq++;
    s->trial_slots++;
    if (s->trial_slots > SCOUT_FW_MAX_TRIAL_SLOTS) {
        s->phase = SCOUT_FW_ROLLBACK;
        return true;
    }
    return false;
}
