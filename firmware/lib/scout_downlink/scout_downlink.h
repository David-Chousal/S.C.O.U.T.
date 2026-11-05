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
 * Version 2 (SETTINGS) carries every remote setting at once, so one frame moves a buoy to a whole
 * new configuration and the buoy applies all of it or none of it (lib/scout_settings), 43 bytes:
 *
 *   type u8 (0xC1) | version u8 (2) | buoy_id u16 | counter u32 | count u8 (SCOUT_SETTINGS_COUNT) |
 *   values u16 × count, in setting-ID order | tag[16] over bytes 0-24 | crc16 u16 over bytes 0-40
 *
 * A buoy accepts both versions: a v1 frame changes only the transmit count.
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

#include "scout_settings.h"

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

#define SCOUT_DL_VERSION_SETTINGS 2u
#define SCOUT_DL_SETTINGS_SIGNED_BYTES (9u + 2u * SCOUT_SETTINGS_COUNT)
#define SCOUT_DL_SETTINGS_SIZE (SCOUT_DL_SETTINGS_SIGNED_BYTES + SCOUT_DL_TAG_BYTES + 2u)
/* The longest downlink frame; size the listen buffer from this. */
#define SCOUT_DL_FRAME_MAX SCOUT_DL_SETTINGS_SIZE

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
    SCOUT_DL_OUT_OF_RANGE = 10,  /* a value, or the set as a whole, fails scout_settings */
} scout_dl_result_t;

/* A v2 frame: the whole settings snapshot for one buoy. */
typedef struct {
    uint16_t buoy_id;
    uint32_t counter;
    ScoutSettings settings;
} ScoutSettingsCommand;

/* Encode and sign `cmd` into `out` (room for SCOUT_DL_CMD_SIZE). Returns bytes written. */
size_t scout_dl_encode(const ScoutCommand *cmd, const uint8_t key[SCOUT_DL_KEY_BYTES], uint8_t *out);

/* Verify a received frame for buoy `my_buoy_id`. `last_counter` is the last counter accepted;
 * `now_epoch` the buoy's clock and `max_skew_s` the allowed distance from it (0 = skip the age
 * check, for a buoy whose clock is not set). `out` is written only on SCOUT_DL_OK. */
scout_dl_result_t scout_dl_decode(const uint8_t *buf, size_t len,
                                  const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                  uint32_t last_counter, uint32_t now_epoch, uint32_t max_skew_s,
                                  ScoutCommand *out);

/* Encode and sign a v2 settings frame. Returns SCOUT_DL_SETTINGS_SIZE. */
size_t scout_dl_encode_settings(const ScoutSettingsCommand *cmd, const uint8_t key[SCOUT_DL_KEY_BYTES],
                                uint8_t *out);

/* The buoy's decoder for either version. On SCOUT_DL_OK, `next` holds the full settings to apply
 * (a v1 frame: `current` with the transmit count replaced) and `counter` the frame's counter;
 * neither is written otherwise. The same checks, in the same order, as scout_dl_decode, and then
 * the resulting set must pass scout_settings_valid. */
scout_dl_result_t scout_dl_decode_any(const uint8_t *buf, size_t len,
                                      const uint8_t key[SCOUT_DL_KEY_BYTES], uint16_t my_buoy_id,
                                      uint32_t last_counter, uint32_t now_epoch, uint32_t max_skew_s,
                                      const ScoutSettings *current, ScoutSettings *next,
                                      uint32_t *counter);

/* True when a result means a command addressed to this buoy was refused, which the next
 * uplink reports as CMD_REJECTED. Noise, other traffic and other buoys' commands are not. */
bool scout_dl_is_rejection(scout_dl_result_t result);

/* Shore side: parse "N<buoy_id>:<count>", the USB command that sets the count requested for a
 * buoy until the console reaches the shore over WiFi. False on anything malformed or out of
 * range (count 1-3, buoy 1-65535). */
bool scout_dl_parse_set_command(const char *line, uint16_t *buoy_id, uint8_t *tx_count);

/* Shore side: parse "S<buoy_id>:<v1>,<v2>,...", every setting in ID order, the USB line that sets
 * the whole snapshot wanted for a buoy (shore/scout_shore/console.py writes it). False unless
 * there are exactly SCOUT_SETTINGS_COUNT values and the set passes scout_settings_valid. */
bool scout_dl_parse_settings_command(const char *line, uint16_t *buoy_id, ScoutSettings *settings);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_DOWNLINK_H */
