/*
 * scout_packet — LoRa telemetry packet encoder (buoy side).
 *
 * THE WIRE FORMAT MUST MATCH shore/scout_shore/packet.py byte-for-byte — that Python module
 * is the shore decoder. Layout (little-endian), 27-byte body + 2-byte CRC = 29 bytes:
 *
 *   schema_version u8 | buoy_id u16 | timestamp u32 | record_seq u32 | temp_c_centi i16 |
 *   turbidity_adc u16 | battery_mv u16 | uptime_s u32 | flags u16 | audio_present u8 |
 *   fw_major u8 | fw_minor u8 | fw_patch u8 | crc16 u16
 *
 * Hardware-free on purpose (only <stdint.h>) so it compiles and unit-tests off-target
 * (`pio test -e native`), and so the encoder can be verified against the Python encoder.
 *
 * v1 is the proposed format pending the ECE packet spec (Team Timeline Phase 0). If it
 * changes, change packet.py in lockstep and bump SCOUT_PACKET_VERSION.
 */
#ifndef SCOUT_PACKET_H
#define SCOUT_PACKET_H

#include <stddef.h>
#include <stdint.h>

#define SCOUT_PACKET_VERSION 1
#define SCOUT_PACKET_SIZE 29
#define SCOUT_PACKET_BODY_SIZE 27

/* Flag bits — must equal FLAG_BITS in packet.py. */
#define SCOUT_FLAG_SD_RETRY (1u << 0)
#define SCOUT_FLAG_TEMP_TIMEOUT (1u << 1)
#define SCOUT_FLAG_TURBIDITY_RANGE (1u << 2)
#define SCOUT_FLAG_BATT_LOW_SKIP_TX (1u << 3)
#define SCOUT_FLAG_RTC_LOST (1u << 4)

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t schema_version; /* = SCOUT_PACKET_VERSION */
    uint16_t buoy_id;
    uint32_t timestamp;     /* Unix epoch seconds, UTC */
    uint32_t record_seq;
    int16_t temp_c_centi;   /* temperature °C × 100 */
    uint16_t turbidity_adc;
    uint16_t battery_mv;    /* battery volts × 1000 */
    uint32_t uptime_s;
    uint16_t flags;         /* SCOUT_FLAG_* bitfield */
    uint8_t audio_present;  /* 0 or 1 */
    uint8_t fw_major;
    uint8_t fw_minor;
    uint8_t fw_patch;
} ScoutReading;

/* CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — matches crc16_ccitt in packet.py. */
uint16_t scout_crc16_ccitt(const uint8_t *data, size_t len);

/* Encode `r` into `out` (must hold >= SCOUT_PACKET_SIZE). Returns bytes written (29). */
size_t scout_packet_encode(const ScoutReading *r, uint8_t *out);

/* Fixed-point helpers matching the Python scaling (round-half-away-from-zero). */
static inline int16_t scout_temp_centi(float celsius) {
    return (int16_t)(celsius >= 0 ? celsius * 100.0f + 0.5f : celsius * 100.0f - 0.5f);
}
static inline uint16_t scout_battery_mv(float volts) {
    return (uint16_t)(volts * 1000.0f + 0.5f);
}

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_PACKET_H */
