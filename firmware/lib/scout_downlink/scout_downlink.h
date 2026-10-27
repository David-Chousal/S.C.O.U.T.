/*
 * scout_downlink — the shore → buoy settings command (OTA design §3 `CMD`, SCO-198).
 *
 * THE WIRE FORMAT MUST MATCH shore/scout_shore/downlink.py byte-for-byte; a golden vector in
 * test/test_downlink and scripts/check_packet_contract.py hold the two together. Layout
 * (little-endian), 28 bytes, well under the 140-byte ceiling:
 *
 *   type u8 (0xC1) | version u8 | buoy_id u16 (0 = all) | counter u32 | setting u8 | value u8 |
 *   tag[16] = HMAC-SHA256(key, bytes 0-9), first 16 bytes | crc16 u16 over bytes 0-25
 *
 * The type byte 0xC1 can never start an uplink (those start with schema_version 1-4), so a
 * buoy that hears another buoy's packet in its listen window rejects it on length or type.
 *
 * Checks run in this order, and the first failure is returned: length, CRC, type, version,
 * buoy ID, tag, counter (replay), counter age, setting, value range. The CRC catches radio
 * errors without spending an HMAC; the tag is checked before anything the sender chose is
 * trusted. The counter is the shore's Unix time when it signed the frame: it must exceed the
 * last one the buoy accepted, and lie within `max_skew_s` of the buoy's clock, so a frame
 * recorded earlier cannot be replayed even after a cold start resets the stored counter.
 *
 * Hardware-free (stdint only) and unit-tested off-target.
 */
#ifndef SCOUT_DOWNLINK_H
#define SCOUT_DOWNLINK_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_DL_TYPE_CMD 0xC1u
#define SCOUT_DL_VERSION 1u
#define SCOUT_DL_CMD_SIZE 28u
#define SCOUT_DL_SIGNED_BYTES 10u
#define SCOUT_DL_TAG_BYTES 16u
#define SCOUT_DL_KEY_BYTES 32u
#define SCOUT_DL_BUOY_ALL 0u

/* Settings a command may change. Only the transmit count exists today. */
#define SCOUT_DL_SETTING_TX_COUNT 1u

typedef struct {
    uint16_t buoy_id;   /* target, or SCOUT_DL_BUOY_ALL */
    uint32_t counter;   /* shore Unix time at signing; strictly increasing */
    uint8_t setting;    /* SCOUT_DL_SETTING_* */
    uint8_t value;
} ScoutCommand;

typedef enum {
    SCOUT_DL_OK = 0,
    SCOUT_DL_BAD_LENGTH = 1,
    SCOUT_DL_BAD_CRC = 2,
    SCOUT_DL_BAD_TYPE = 3,
    SCOUT_DL_BAD_VERSION = 4,
    SCOUT_DL_WRONG_BUOY = 5,
    SCOUT_DL_BAD_TAG = 6,
    SCOUT_DL_REPLAY = 7,         /* counter not above the last one accepted */
    SCOUT_DL_STALE = 8,          /* counter too far from the buoy's clock */
    SCOUT_DL_UNKNOWN_SETTING = 9,
    SCOUT_DL_OUT_OF_RANGE = 10,
} scout_dl_result_t;

/* Encode and sign `cmd` into `out` (room for SCOUT_DL_CMD_SIZE). Returns bytes written. */
size_t scout_dl_encode(const ScoutCommand *cmd, const uint8_t key[SCOUT_DL_KEY_BYTES], uint8_t *out);

/* Verify a received frame for buoy `my_buoy_id`. `last_counter` is the last counter accepted;
 * `now_epoch` the buoy's clock and `max_skew_s` the allowed distance from it (0 = skip the age
 * check, for a buoy whose clock is not set). `out` is written only on SCOUT_DL_OK. */
scout_dl_result_t scout_dl_decode(const uint8_t *buf, size_t len,
                                  const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                  uint32_t last_counter, uint32_t now_epoch, uint32_t max_skew_s,
                                  ScoutCommand *out);

/* True when a result means a command addressed to this buoy was refused, which the next
 * uplink reports as CMD_REJECTED. Noise, other traffic and other buoys' commands are not. */
bool scout_dl_is_rejection(scout_dl_result_t result);

/* Shore side: parse "N<buoy_id>:<count>", the USB command that sets the count requested for a
 * buoy until the console reaches the shore over WiFi. False on anything malformed or out of
 * range (count 1-3, buoy 1-65535). */
bool scout_dl_parse_set_command(const char *line, uint16_t *buoy_id, uint8_t *tx_count);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_DOWNLINK_H */
