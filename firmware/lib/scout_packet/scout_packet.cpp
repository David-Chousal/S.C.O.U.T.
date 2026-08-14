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
    put_u8(&p, r->audio_present);
    put_u8(&p, r->fw_major);
    put_u8(&p, r->fw_minor);
    put_u8(&p, r->fw_patch);

    size_t body_len = (size_t)(p - out); /* 27 */
    put_u16(&p, scout_crc16_ccitt(out, body_len));
    return (size_t)(p - out); /* 29 */
}
