#include "scout_packet.h"

/* Little-endian writers — explicit byte order so the packet is identical on any MCU. */
static void put_u8(uint8_t **p, uint8_t v) { *(*p)++ = v; }

static void put_u16(uint8_t **p, uint16_t v) {
    *(*p)++ = (uint8_t)(v & 0xFF);
    *(*p)++ = (uint8_t)((v >> 8) & 0xFF);
}

static void put_u32(uint8_t **p, uint32_t v) {
    for (int i = 0; i < 4; i++) {
        *(*p)++ = (uint8_t)((v >> (8 * i)) & 0xFF);
    }
}

static uint8_t get_u8(const uint8_t **p) { return *(*p)++; }

static uint16_t get_u16(const uint8_t **p) {
    uint16_t v = (uint16_t)((*p)[0] | ((*p)[1] << 8));
    *p += 2;
    return v;
}

static uint32_t get_u32(const uint8_t **p) {
    uint32_t v = 0;
    for (int i = 0; i < 4; i++) {
        v |= (uint32_t)(*p)[i] << (8 * i);
    }
    *p += 4;
    return v;
}

uint16_t scout_crc16_ccitt(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= (uint16_t)data[i] << 8;
        for (int bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
        }
    }
    return crc;
}

size_t scout_packet_encode(const ScoutReading *r, uint8_t *out) {
    uint8_t *p = out;
    put_u8(&p, r->schema_version);
    put_u16(&p, r->buoy_id);
    put_u32(&p, r->timestamp);
    put_u32(&p, r->record_seq);
    put_u16(&p, (uint16_t)r->temp_c_centi);
    put_u16(&p, r->turbidity_adc);
    put_u16(&p, r->battery_mv);
    put_u32(&p, r->uptime_s);
    put_u16(&p, r->flags);
    put_u8(&p, r->soh);
    put_u8(&p, r->audio_present);
    put_u8(&p, r->fw_major);
    put_u8(&p, r->fw_minor);
    put_u8(&p, r->fw_patch);
    put_u16(&p, (uint16_t)r->lvl_anthro_cdb);
    put_u16(&p, (uint16_t)r->lvl_mixed_cdb);
    put_u16(&p, (uint16_t)r->lvl_bio_cdb);
    put_u16(&p, (uint16_t)r->lvl_broad_cdb);
    put_u16(&p, (uint16_t)r->ndsi_e4);
    put_u16(&p, r->snap_count);
    put_u16(&p, r->clip_count);

    size_t body_len = (size_t)(p - out); /* 42 */
    put_u16(&p, scout_crc16_ccitt(out, body_len));
    return (size_t)(p - out); /* 44 */
}

scout_decode_result_t scout_packet_decode(const uint8_t *buf, size_t len, ScoutReading *out) {
    bool legacy = (len == SCOUT_PACKET_LEGACY_SIZE);
    if (len != SCOUT_PACKET_SIZE && !legacy) {
        return SCOUT_DECODE_BAD_LENGTH;
    }
    size_t body_len = legacy ? SCOUT_PACKET_LEGACY_BODY_SIZE : SCOUT_PACKET_BODY_SIZE;
    const uint8_t *crc_at = buf + body_len;
    if (get_u16(&crc_at) != scout_crc16_ccitt(buf, body_len)) {
        return SCOUT_DECODE_BAD_CRC;
    }
    bool version_ok = legacy ? (buf[0] == 1 || buf[0] == 2)
                             : (buf[0] == SCOUT_PACKET_VERSION ||
                                buf[0] == SCOUT_PACKET_PREVIOUS_VERSION);
    if (!version_ok) {
        return SCOUT_DECODE_BAD_VERSION;
    }
    const uint8_t *p = buf;
    ScoutReading r;
    r.schema_version = get_u8(&p);
    r.buoy_id = get_u16(&p);
    r.timestamp = get_u32(&p);
    r.record_seq = get_u32(&p);
    r.temp_c_centi = (int16_t)get_u16(&p);
    r.turbidity_adc = get_u16(&p);
    r.battery_mv = get_u16(&p);
    r.uptime_s = get_u32(&p);
    r.flags = get_u16(&p);
    r.soh = get_u8(&p);
    r.audio_present = get_u8(&p);
    r.fw_major = get_u8(&p);
    r.fw_minor = get_u8(&p);
    r.fw_patch = get_u8(&p);
    r.lvl_anthro_cdb = legacy ? 0 : (int16_t)get_u16(&p);
    r.lvl_mixed_cdb = legacy ? 0 : (int16_t)get_u16(&p);
    r.lvl_bio_cdb = legacy ? 0 : (int16_t)get_u16(&p);
    r.lvl_broad_cdb = legacy ? 0 : (int16_t)get_u16(&p);
    r.ndsi_e4 = legacy ? 0 : (int16_t)get_u16(&p);
    r.snap_count = legacy ? 0 : get_u16(&p);
    r.clip_count = legacy ? 0 : get_u16(&p);
    *out = r;
    return SCOUT_DECODE_OK;
}
