#include "scout_ota.h"

#include <string.h>

#include "monocypher-ed25519.h"
#include "scout_hmac.h"
#include "scout_packet.h"

static void put_u16(uint8_t *p, uint16_t v) {
    p[0] = (uint8_t)v;
    p[1] = (uint8_t)(v >> 8);
}

static void put_u32(uint8_t *p, uint32_t v) {
    put_u16(p, (uint16_t)v);
    put_u16(p + 2, (uint16_t)(v >> 16));
}

static uint16_t get_u16(const uint8_t *p) { return (uint16_t)(p[0] | (p[1] << 8)); }

static uint32_t get_u32(const uint8_t *p) {
    return (uint32_t)get_u16(p) | ((uint32_t)get_u16(p + 2) << 16);
}

static bool crc_ok(const uint8_t *buf, size_t len) {
    return scout_crc16_ccitt(buf, len - 2) == get_u16(buf + len - 2);
}

static void put_crc(uint8_t *buf, size_t body_len) {
    put_u16(buf + body_len, scout_crc16_ccitt(buf, body_len));
}

uint32_t scout_ota_version(uint8_t major, uint8_t minor, uint8_t patch) {
    return ((uint32_t)major << 16) | ((uint32_t)minor << 8) | patch;
}

void scout_ota_manifest_encode(const ScoutOtaManifest *m, uint8_t out[SCOUT_OTA_MANIFEST_BYTES]) {
    put_u32(out + 0, SCOUT_OTA_MAGIC);
    put_u16(out + 4, m->target_buoy);
    out[6] = m->chunk_size;
    out[7] = m->flags;
    put_u32(out + 8, m->version);
    put_u32(out + 12, m->image_len);
    put_u32(out + 16, m->build_time);
    memcpy(out + 20, m->sha256, SCOUT_OTA_HASH_BYTES);
}

bool scout_ota_manifest_decode(const uint8_t in[SCOUT_OTA_MANIFEST_BYTES], ScoutOtaManifest *m) {
    if (get_u32(in) != SCOUT_OTA_MAGIC) {
        return false;
    }
    m->target_buoy = get_u16(in + 4);
    m->chunk_size = in[6];
    m->flags = in[7];
    m->version = get_u32(in + 8);
    m->image_len = get_u32(in + 12);
    m->build_time = get_u32(in + 16);
    memcpy(m->sha256, in + 20, SCOUT_OTA_HASH_BYTES);
    return true;
}

size_t scout_ota_offer_encode(const uint8_t manifest[SCOUT_OTA_MANIFEST_BYTES],
                              const uint8_t sig[SCOUT_OTA_SIG_BYTES], uint8_t *out) {
    out[0] = SCOUT_OTA_TYPE_OFFER;
    memcpy(out + 1, manifest, SCOUT_OTA_MANIFEST_BYTES);
    memcpy(out + 1 + SCOUT_OTA_MANIFEST_BYTES, sig, SCOUT_OTA_SIG_BYTES);
    return SCOUT_OTA_OFFER_SIZE;
}

bool scout_ota_signature_ok(const uint8_t manifest[SCOUT_OTA_MANIFEST_BYTES],
                            const uint8_t sig[SCOUT_OTA_SIG_BYTES],
                            const uint8_t pubkey[SCOUT_OTA_PUBKEY_BYTES]) {
    return crypto_ed25519_check(sig, pubkey, manifest, SCOUT_OTA_MANIFEST_BYTES) == 0;
}

scout_ota_result_t scout_ota_offer_check(const uint8_t *buf, size_t len,
                                         const uint8_t pubkey[SCOUT_OTA_PUBKEY_BYTES],
                                         uint16_t my_buoy_id, uint32_t running_version,
                                         ScoutOtaManifest *m) {
    if (len != SCOUT_OTA_OFFER_SIZE) {
        return SCOUT_OTA_BAD_LENGTH;
    }
    if (buf[0] != SCOUT_OTA_TYPE_OFFER) {
        return SCOUT_OTA_BAD_TYPE;
    }
    const uint8_t *manifest = buf + 1;
    ScoutOtaManifest parsed;
    if (!scout_ota_manifest_decode(manifest, &parsed)) {
        return SCOUT_OTA_BAD_MAGIC;
    }
    if (parsed.target_buoy != 0 && parsed.target_buoy != my_buoy_id) {
        return SCOUT_OTA_WRONG_BUOY;
    }
    if (parsed.version <= running_version) {
        return SCOUT_OTA_NOT_NEWER;
    }
    if (parsed.chunk_size != SCOUT_OTA_CHUNK_BYTES || parsed.flags != 0 || parsed.image_len == 0 ||
        parsed.image_len > SCOUT_OTA_MAX_IMAGE) {
        return SCOUT_OTA_BAD_GEOMETRY;
    }
    if (!scout_ota_signature_ok(manifest, manifest + SCOUT_OTA_MANIFEST_BYTES, pubkey)) {
        return SCOUT_OTA_BAD_SIGNATURE;
    }
    *m = parsed;
    return SCOUT_OTA_OK;
}

uint16_t scout_ota_session_id(const ScoutOtaManifest *m) { return get_u16(m->sha256); }

uint16_t scout_ota_chunk_count(uint32_t image_len) {
    return (uint16_t)((image_len + SCOUT_OTA_CHUNK_BYTES - 1u) / SCOUT_OTA_CHUNK_BYTES);
}

uint8_t scout_ota_chunk_len(uint32_t image_len, uint16_t index) {
    uint32_t start = (uint32_t)index * SCOUT_OTA_CHUNK_BYTES;
    if (start >= image_len) {
        return 0;
    }
    uint32_t left = image_len - start;
    return (uint8_t)(left < SCOUT_OTA_CHUNK_BYTES ? left : SCOUT_OTA_CHUNK_BYTES);
}

size_t scout_ota_chunk_encode(uint16_t session, uint16_t index, uint8_t flags,
                              const uint8_t *data, uint8_t len, uint8_t *out) {
    out[0] = SCOUT_OTA_TYPE_CHUNK;
    put_u16(out + 1, session);
    put_u16(out + 3, index);
    out[5] = len;
    out[6] = flags;
    memcpy(out + SCOUT_OTA_CHUNK_HEADER, data, len);
    put_crc(out, SCOUT_OTA_CHUNK_HEADER + len);
    return SCOUT_OTA_CHUNK_HEADER + len + 2u;
}

scout_ota_result_t scout_ota_chunk_decode(const uint8_t *buf, size_t len, ScoutOtaChunk *out) {
    if (len < SCOUT_OTA_CHUNK_HEADER + 1u + 2u || len > SCOUT_OTA_CHUNK_FRAME_MAX) {
        return SCOUT_OTA_BAD_LENGTH;
    }
    if (buf[0] != SCOUT_OTA_TYPE_CHUNK) {
        return SCOUT_OTA_BAD_TYPE;
    }
    if ((size_t)buf[5] + SCOUT_OTA_CHUNK_HEADER + 2u != len) {
        return SCOUT_OTA_BAD_LENGTH;
    }
    if (!crc_ok(buf, len)) {
        return SCOUT_OTA_BAD_CRC;
    }
    out->session = get_u16(buf + 1);
    out->index = get_u16(buf + 3);
    out->len = buf[5];
    out->flags = buf[6];
    out->data = buf + SCOUT_OTA_CHUNK_HEADER;
    return SCOUT_OTA_OK;
}

bool scout_ota_chunk_fits(const ScoutOtaManifest *m, const ScoutOtaChunk *c) {
    return c->session == scout_ota_session_id(m) && c->index < scout_ota_chunk_count(m->image_len) &&
           c->len == scout_ota_chunk_len(m->image_len, c->index);
}

size_t scout_ota_ack_encode(const ScoutOtaAck *ack, uint8_t out[SCOUT_OTA_ACK_SIZE]) {
    out[0] = SCOUT_OTA_TYPE_ACK;
    put_u16(out + 1, ack->buoy_id);
    put_u16(out + 3, ack->session);
    put_u16(out + 5, ack->base);
    put_u16(out + 7, ack->bitmap);
    out[9] = ack->status;
    put_crc(out, 10);
    return SCOUT_OTA_ACK_SIZE;
}

scout_ota_result_t scout_ota_ack_decode(const uint8_t *buf, size_t len, ScoutOtaAck *out) {
    if (len != SCOUT_OTA_ACK_SIZE) {
        return SCOUT_OTA_BAD_LENGTH;
    }
    if (buf[0] != SCOUT_OTA_TYPE_ACK) {
        return SCOUT_OTA_BAD_TYPE;
    }
    if (!crc_ok(buf, len)) {
        return SCOUT_OTA_BAD_CRC;
    }
    out->buoy_id = get_u16(buf + 1);
    out->session = get_u16(buf + 3);
    out->base = get_u16(buf + 5);
    out->bitmap = get_u16(buf + 7);
    out->status = buf[9];
    return SCOUT_OTA_OK;
}

bool scout_ota_map_get(const uint8_t *map, uint16_t index) {
    return (map[index >> 3] >> (index & 7u)) & 1u;
}

void scout_ota_map_set(uint8_t *map, uint16_t index) {
    map[index >> 3] = (uint8_t)(map[index >> 3] | (1u << (index & 7u)));
}

uint16_t scout_ota_window_bitmap(const uint8_t *map, uint16_t chunk_count, uint16_t base) {
    uint16_t bits = 0;
    for (uint16_t i = 0; i < SCOUT_OTA_WINDOW; i++) {
        uint32_t index = (uint32_t)base + i;
        if (index >= chunk_count || scout_ota_map_get(map, (uint16_t)index)) {
            bits = (uint16_t)(bits | (1u << i));
        }
    }
    return bits;
}

uint16_t scout_ota_next_window(const uint8_t *map, uint16_t chunk_count) {
    for (uint32_t base = 0; base < chunk_count; base += SCOUT_OTA_WINDOW) {
        if (scout_ota_window_bitmap(map, chunk_count, (uint16_t)base) != 0xFFFFu) {
            return (uint16_t)base;
        }
    }
    return SCOUT_OTA_ALL_HELD;
}

uint8_t scout_ota_missing(uint16_t base, uint16_t bitmap, uint16_t chunk_count,
                          uint16_t out[SCOUT_OTA_WINDOW]) {
    uint8_t n = 0;
    if (base == SCOUT_OTA_ALL_HELD || base % SCOUT_OTA_WINDOW != 0) {
        return 0;
    }
    for (uint16_t i = 0; i < SCOUT_OTA_WINDOW; i++) {
        uint32_t index = (uint32_t)base + i;
        if (index < chunk_count && !((bitmap >> i) & 1u)) {
            out[n++] = (uint16_t)index;
        }
    }
    return n;
}

static void confirm_tag(const uint8_t *signed_bytes, const uint8_t key[32], uint8_t tag[16]) {
    uint8_t mac[SCOUT_SHA256_DIGEST_BYTES];
    scout_hmac_sha256(key, 32, signed_bytes, SCOUT_OTA_CONFIRM_SIGNED_BYTES, mac);
    memcpy(tag, mac, 16);
}

size_t scout_ota_confirm_encode(uint16_t buoy_id, uint32_t counter, uint32_t version,
                                const uint8_t key[32], uint8_t out[SCOUT_OTA_CONFIRM_SIZE]) {
    out[0] = SCOUT_OTA_TYPE_CONFIRM;
    put_u16(out + 1, buoy_id);
    put_u32(out + 3, counter);
    put_u32(out + 7, version);
    confirm_tag(out, key, out + SCOUT_OTA_CONFIRM_SIGNED_BYTES);
    put_crc(out, SCOUT_OTA_CONFIRM_SIGNED_BYTES + 16u);
    return SCOUT_OTA_CONFIRM_SIZE;
}

scout_ota_result_t scout_ota_confirm_check(const uint8_t *buf, size_t len, const uint8_t key[32],
                                           uint16_t my_buoy_id, uint32_t last_counter,
                                           uint32_t now_epoch, uint32_t max_skew_s,
                                           uint32_t running_version, uint32_t *counter) {
    if (len != SCOUT_OTA_CONFIRM_SIZE) {
        return SCOUT_OTA_BAD_LENGTH;
    }
    if (!crc_ok(buf, len)) {
        return SCOUT_OTA_BAD_CRC;
    }
    if (buf[0] != SCOUT_OTA_TYPE_CONFIRM) {
        return SCOUT_OTA_BAD_TYPE;
    }
    if (get_u16(buf + 1) != my_buoy_id) {
        return SCOUT_OTA_WRONG_BUOY;
    }
    uint8_t tag[16];
    confirm_tag(buf, key, tag);
    if (!scout_ct_equal(tag, buf + SCOUT_OTA_CONFIRM_SIGNED_BYTES, sizeof(tag))) {
        return SCOUT_OTA_BAD_TAG;
    }
    uint32_t c = get_u32(buf + 3);
    if (c <= last_counter) {
        return SCOUT_OTA_REPLAY;
    }
    if (max_skew_s != 0) {
        uint32_t skew = c > now_epoch ? c - now_epoch : now_epoch - c;
        if (skew > max_skew_s) {
            return SCOUT_OTA_STALE;
        }
    }
    if (get_u32(buf + 7) != running_version) {
        return SCOUT_OTA_WRONG_VERSION;
    }
    *counter = c;
    return SCOUT_OTA_OK;
}

scout_ota_step_t scout_ota_shore_step(uint32_t job_version, uint32_t running_version, bool trial,
                                      bool rolled_back, bool conserving) {
    if (trial) {
        return running_version == job_version ? SCOUT_OTA_STEP_CONFIRM : SCOUT_OTA_STEP_NONE;
    }
    if (running_version >= job_version) {
        return SCOUT_OTA_STEP_DONE;
    }
    if (rolled_back) {
        return SCOUT_OTA_STEP_ABANDON;  // offering it again would only repeat the failure
    }
    return conserving ? SCOUT_OTA_STEP_NONE : SCOUT_OTA_STEP_OFFER;
}
