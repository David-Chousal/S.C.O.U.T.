/*
 * scout_packet — LoRa telemetry packet codec: encoder (buoy) and decoder (ESP32-S3 shore station).
 *
 * THE WIRE FORMAT MUST MATCH shore/scout_shore/packet.py byte-for-byte — that Python module
 * is the shore decoder. Layout (little-endian), v3: 42-byte body + 2-byte CRC = 44 bytes:
 *
 *   schema_version u8 | buoy_id u16 | timestamp u32 | record_seq u32 | temp_c_centi i16 |
 *   turbidity_adc u16 | battery_mv u16 | uptime_s u32 | flags u16 | soh u8 | audio_present u8 |
 *   fw_major u8 | fw_minor u8 | fw_patch u8 |
 *   lvl_anthro_cdb i16 | lvl_mixed_cdb i16 | lvl_bio_cdb i16 | lvl_broad_cdb i16 |
 *   ndsi_e4 i16 | snap_count u16 | clip_count u16 | crc16 u16
 *
 * v1 and v2 were the first 28 body bytes alone (30 bytes with the CRC); the decoder still
 * accepts them, with the acoustic fields zero.
 *
 * Hardware-free on purpose (only <stdint.h>) so it compiles and unit-tests off-target
 * (`pio test -e native`), and so the encoder can be verified against the Python encoder.
 *
 * If the layout changes, change packet.py in lockstep and bump SCOUT_PACKET_VERSION.
 */
#ifndef SCOUT_PACKET_H
#define SCOUT_PACKET_H

#include <stddef.h>
#include <stdint.h>

/* v2 (2026-10-23, SCO-205): HUMIDITY_HIGH / HUMIDITY_FAIL flag bits, and the CSV gained
 * internal_temp_c / internal_humidity_pct. The byte layout is unchanged. Per ADR-0005 the
 * internal-sensor columns come with a schema_version bump, and this one number versions both
 * the packet and the CSV. */
/* v3 (2026-10-25, ADR-0010 / SCO-233): the 14-byte acoustic summary appended to the body, and
 * the same seven columns appended to the CSV. */
#define SCOUT_PACKET_VERSION 3
#define SCOUT_PACKET_SIZE 44
#define SCOUT_PACKET_BODY_SIZE 42
/* The v1/v2 layout: no acoustic summary. Decoded for old frames and replayed logs. */
#define SCOUT_PACKET_LEGACY_SIZE 30
#define SCOUT_PACKET_LEGACY_BODY_SIZE 28

/* Per-cycle event flags — must equal FLAG_BITS in packet.py. */
#define SCOUT_FLAG_SD_RETRY (1u << 0)
#define SCOUT_FLAG_TEMP_TIMEOUT (1u << 1)
#define SCOUT_FLAG_TURBIDITY_RANGE (1u << 2)
#define SCOUT_FLAG_BATT_LOW_SKIP_TX (1u << 3)
#define SCOUT_FLAG_RTC_LOST (1u << 4)
#define SCOUT_FLAG_POWER_CONSERVE (1u << 5)
#define SCOUT_FLAG_HUMIDITY_HIGH (1u << 6)  /* housing RH at/above the alert threshold */
#define SCOUT_FLAG_HUMIDITY_FAIL (1u << 7)  /* SHT40 read failed (no ACK or bad CRC) */

/* Device State-of-Health bits (set at boot/init) — must equal SOH_BITS in packet.py. */
#define SCOUT_SOH_WATCHDOG_RESET (1u << 0)
#define SCOUT_SOH_RTC_UNSET (1u << 1)
#define SCOUT_SOH_SD_INIT_FAIL (1u << 2)
#define SCOUT_SOH_LORA_INIT_FAIL (1u << 3)

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
    uint16_t flags;         /* SCOUT_FLAG_* bitfield (per-cycle events) */
    uint8_t soh;            /* SCOUT_SOH_* bitfield (device State-of-Health) */
    uint8_t audio_present;  /* 0 or 1 */
    uint8_t fw_major;
    uint8_t fw_minor;
    uint8_t fw_patch;
    /* Acoustic summary of the most recent recording since the previous slot (lib/scout_acoustic,
     * ADR-0010). All zero, with audio_present = 0, when there was none. */
    int16_t lvl_anthro_cdb; /* centi-dB re a full-scale sine, 0–200 Hz */
    int16_t lvl_mixed_cdb;  /* 200–1,000 Hz */
    int16_t lvl_bio_cdb;    /* 1–8 kHz */
    int16_t lvl_broad_cdb;  /* broadband */
    int16_t ndsi_e4;        /* NDSI × 10,000 */
    uint16_t snap_count;
    uint16_t clip_count;
} ScoutReading;

/* CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — matches crc16_ccitt in packet.py. */
uint16_t scout_crc16_ccitt(const uint8_t *data, size_t len);

/* Encode `r` into `out` (must hold >= SCOUT_PACKET_SIZE). Returns bytes written (44). */
size_t scout_packet_encode(const ScoutReading *r, uint8_t *out);

/* Decode outcomes, checked in this order — same checks as decode() in packet.py. */
typedef enum {
    SCOUT_DECODE_OK = 0,
    SCOUT_DECODE_BAD_LENGTH = 1,  /* neither SCOUT_PACKET_SIZE nor SCOUT_PACKET_LEGACY_SIZE */
    SCOUT_DECODE_BAD_CRC = 2,     /* trailing CRC does not match the body */
    SCOUT_DECODE_BAD_VERSION = 3, /* 44 B but not v3, or 30 B but not v1/v2 */
} scout_decode_result_t;

/* Decode a received payload into `out` (shore side, SCO-24). `out` is written only on OK.
 * A 30-byte v1/v2 frame decodes with its own schema_version and the acoustic fields zero. */
scout_decode_result_t scout_packet_decode(const uint8_t *buf, size_t len, ScoutReading *out);

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
