/*
 * scout_ota — the over-the-air firmware update frames (OTA design §3-§5, SCO-197).
 *
 * THE WIRE FORMAT MUST MATCH shore/scout_shore/ota.py byte-for-byte; golden vectors in
 * test/test_ota and scripts/check_packet_contract.py hold the two together. Every frame stays
 * within the 140-byte payload ceiling. All integers are little-endian.
 *
 *   OTA_OFFER   0xC2  shore → buoy  type | manifest[52] | Ed25519 signature[64]          117 B
 *   OTA_CHUNK   0xC3  shore → buoy  type | session u16 | index u16 | len u8 | flags u8 |
 *                                   data[len ≤ 128] | crc16 over all before it          ≤ 137 B
 *   OTA_ACK     0xC4  buoy → shore  type | buoy u16 | session u16 | base u16 | bitmap u16 |
 *                                   status u8 | crc16                                     12 B
 *   OTA_CONFIRM 0xC5  shore → buoy  type | buoy u16 | counter u32 | version u32 | tag[16] |
 *                                   crc16                                                 29 B
 *
 * Manifest (52 B, signed as a whole): magic "SCFW" | target buoy u16 (0 = any) | chunk size u8
 * (128) | flags u8 (0) | version u32 | image length u32 | build time u32 | SHA-256 of image[32].
 * Version is (major << 16) | (minor << 8) | patch, so it compares like the packet's fw_* bytes.
 *
 * The session ID is the first two bytes of the image hash, so a resumed transfer, a restarted
 * shore station and the buoy all agree on it without negotiating.
 *
 * Transfer runs in windows of 16 chunks. The buoy's ACK names the first window that still has
 * a missing chunk (`base`) and a bitmap of which of its 16 chunks it holds (chunks past the end
 * of the image count as held). The shore sends the missing ones, the last flagged LAST, and the
 * buoy answers with the next ACK. base = 0xFFFF means every chunk is held.
 *
 * Hardware-free (stdint only) and unit-tested off-target. Ed25519 is Monocypher's
 * (lib/monocypher), SHA-256 and HMAC are lib/scout_hmac's.
 */
#ifndef SCOUT_OTA_H
#define SCOUT_OTA_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_OTA_TYPE_OFFER 0xC2u
#define SCOUT_OTA_TYPE_CHUNK 0xC3u
#define SCOUT_OTA_TYPE_ACK 0xC4u
#define SCOUT_OTA_TYPE_CONFIRM 0xC5u

#define SCOUT_OTA_MAGIC 0x57464353u /* "SCFW" */
#define SCOUT_OTA_MANIFEST_BYTES 52u
#define SCOUT_OTA_SIG_BYTES 64u
#define SCOUT_OTA_PUBKEY_BYTES 32u
#define SCOUT_OTA_HASH_BYTES 32u
#define SCOUT_OTA_OFFER_SIZE (1u + SCOUT_OTA_MANIFEST_BYTES + SCOUT_OTA_SIG_BYTES)

#define SCOUT_OTA_CHUNK_BYTES 128u
#define SCOUT_OTA_CHUNK_HEADER 7u
#define SCOUT_OTA_CHUNK_FRAME_MAX (SCOUT_OTA_CHUNK_HEADER + SCOUT_OTA_CHUNK_BYTES + 2u)
#define SCOUT_OTA_CHUNK_LAST 0x01u

#define SCOUT_OTA_ACK_SIZE 12u
#define SCOUT_OTA_CONFIRM_SIGNED_BYTES 11u
#define SCOUT_OTA_CONFIRM_SIZE (SCOUT_OTA_CONFIRM_SIGNED_BYTES + 16u + 2u)

/* The longest OTA frame; size receive buffers from this. */
#define SCOUT_OTA_FRAME_MAX SCOUT_OTA_CHUNK_FRAME_MAX

#define SCOUT_OTA_WINDOW 16u
#define SCOUT_OTA_ALL_HELD 0xFFFFu

/* Application flash: 0x8000 (after the 8 KB bootloader and the 24 KB scout_boot stub) to the end
 * of the SAMD21G18's 256 KB. */
#define SCOUT_OTA_APP_START 0x8000u
#define SCOUT_OTA_MAX_IMAGE (0x40000u - SCOUT_OTA_APP_START)
#define SCOUT_OTA_MAX_CHUNKS ((SCOUT_OTA_MAX_IMAGE + SCOUT_OTA_CHUNK_BYTES - 1u) / SCOUT_OTA_CHUNK_BYTES)
#define SCOUT_OTA_MAP_BYTES ((SCOUT_OTA_MAX_CHUNKS + 7u) / 8u)

typedef enum {
    SCOUT_OTA_OK = 0,
    SCOUT_OTA_BAD_LENGTH = 1,
    SCOUT_OTA_BAD_TYPE = 2,
    SCOUT_OTA_BAD_CRC = 3,
    SCOUT_OTA_BAD_MAGIC = 4,
    SCOUT_OTA_WRONG_BUOY = 5,
    SCOUT_OTA_NOT_NEWER = 6,     /* offer: version not above the running one */
    SCOUT_OTA_BAD_GEOMETRY = 7,  /* offer: chunk size, length or flags not accepted */
    SCOUT_OTA_BAD_SIGNATURE = 8,
    SCOUT_OTA_BAD_TAG = 9,       /* confirm: HMAC */
    SCOUT_OTA_REPLAY = 10,       /* confirm: counter not above the last accepted */
    SCOUT_OTA_STALE = 11,        /* confirm: counter too far from the buoy's clock */
    SCOUT_OTA_WRONG_VERSION = 12 /* confirm: not the version running */
} scout_ota_result_t;

typedef enum {
    SCOUT_OTA_ACK_PROGRESS = 0, /* base/bitmap say what to send next */
    SCOUT_OTA_ACK_COMPLETE = 1, /* every chunk held and the hash matched; the buoy will apply it */
    SCOUT_OTA_ACK_HASH_FAIL = 2,/* every chunk held but the hash did not match; image discarded */
    SCOUT_OTA_ACK_REFUSED = 3,  /* not now: battery out of NORMAL, or the SD card failed */
} scout_ota_ack_status_t;

typedef struct {
    uint16_t target_buoy;
    uint8_t chunk_size;
    uint8_t flags;
    uint32_t version;
    uint32_t image_len;
    uint32_t build_time;
    uint8_t sha256[SCOUT_OTA_HASH_BYTES];
} ScoutOtaManifest;

typedef struct {
    uint16_t session;
    uint16_t index;
    uint8_t len;
    uint8_t flags;
    const uint8_t *data; /* points into the decoded frame */
} ScoutOtaChunk;

typedef struct {
    uint16_t buoy_id;
    uint16_t session;
    uint16_t base;
    uint16_t bitmap;
    uint8_t status; /* scout_ota_ack_status_t */
} ScoutOtaAck;

uint32_t scout_ota_version(uint8_t major, uint8_t minor, uint8_t patch);

void scout_ota_manifest_encode(const ScoutOtaManifest *m, uint8_t out[SCOUT_OTA_MANIFEST_BYTES]);
bool scout_ota_manifest_decode(const uint8_t in[SCOUT_OTA_MANIFEST_BYTES], ScoutOtaManifest *m);

/* Shore: offer frame from an already signed manifest. Returns SCOUT_OTA_OFFER_SIZE. */
size_t scout_ota_offer_encode(const uint8_t manifest[SCOUT_OTA_MANIFEST_BYTES],
                              const uint8_t sig[SCOUT_OTA_SIG_BYTES], uint8_t *out);

/* Ed25519 check of a manifest's signature. */
bool scout_ota_signature_ok(const uint8_t manifest[SCOUT_OTA_MANIFEST_BYTES],
                            const uint8_t sig[SCOUT_OTA_SIG_BYTES],
                            const uint8_t pubkey[SCOUT_OTA_PUBKEY_BYTES]);

/* Buoy: check an offer frame. Order: length, type, magic, buoy, version, geometry, then the
 * signature last, because it is the expensive check. `m` is written only on OK. */
scout_ota_result_t scout_ota_offer_check(const uint8_t *buf, size_t len,
                                         const uint8_t pubkey[SCOUT_OTA_PUBKEY_BYTES],
                                         uint16_t my_buoy_id, uint32_t running_version,
                                         ScoutOtaManifest *m);

uint16_t scout_ota_session_id(const ScoutOtaManifest *m);
uint16_t scout_ota_chunk_count(uint32_t image_len);
/* Bytes in chunk `index` (128 except possibly the last). */
uint8_t scout_ota_chunk_len(uint32_t image_len, uint16_t index);

size_t scout_ota_chunk_encode(uint16_t session, uint16_t index, uint8_t flags,
                              const uint8_t *data, uint8_t len, uint8_t *out);
scout_ota_result_t scout_ota_chunk_decode(const uint8_t *buf, size_t len, ScoutOtaChunk *out);
/* True when a decoded chunk belongs to this transfer: session, index and length all match. */
bool scout_ota_chunk_fits(const ScoutOtaManifest *m, const ScoutOtaChunk *c);

size_t scout_ota_ack_encode(const ScoutOtaAck *ack, uint8_t out[SCOUT_OTA_ACK_SIZE]);
scout_ota_result_t scout_ota_ack_decode(const uint8_t *buf, size_t len, ScoutOtaAck *out);

/* Received-chunk bitmap (one bit per chunk, LSB first). */
bool scout_ota_map_get(const uint8_t *map, uint16_t index);
void scout_ota_map_set(uint8_t *map, uint16_t index);
/* Buoy: the first window with a missing chunk, or SCOUT_OTA_ALL_HELD. */
uint16_t scout_ota_next_window(const uint8_t *map, uint16_t chunk_count);
/* Buoy: which of the 16 chunks from `base` are held (past-the-end chunks count as held). */
uint16_t scout_ota_window_bitmap(const uint8_t *map, uint16_t chunk_count, uint16_t base);
/* Shore: the chunk indices to send for an ACK's window, in order. Returns how many (≤ 16). */
uint8_t scout_ota_missing(uint16_t base, uint16_t bitmap, uint16_t chunk_count, uint16_t out[SCOUT_OTA_WINDOW]);

/* CONFIRM, authenticated with the buoy's settings-downlink key (HMAC-SHA256, 16-byte tag over
 * the first 11 bytes). The counter is the shore's Unix time, as for commands. */
size_t scout_ota_confirm_encode(uint16_t buoy_id, uint32_t counter, uint32_t version,
                                const uint8_t key[32], uint8_t out[SCOUT_OTA_CONFIRM_SIZE]);
/* Buoy: order is length, CRC, type, buoy (exact, no broadcast), tag, replay, age, version.
 * `counter` is written only on OK. max_skew_s = 0 skips the age check. */
scout_ota_result_t scout_ota_confirm_check(const uint8_t *buf, size_t len, const uint8_t key[32],
                                           uint16_t my_buoy_id, uint32_t last_counter,
                                           uint32_t now_epoch, uint32_t max_skew_s,
                                           uint32_t running_version, uint32_t *counter);

/* Shore: what to do for a buoy with a loaded update job, from the packet it just sent. */
typedef enum {
    SCOUT_OTA_STEP_NONE = 0,    /* wait: conserving power, or a trial of another version */
    SCOUT_OTA_STEP_OFFER = 1,   /* offer the image and run a transfer session */
    SCOUT_OTA_STEP_CONFIRM = 2, /* the job's image is on trial: send CONFIRM */
    SCOUT_OTA_STEP_DONE = 3,    /* the buoy runs the job's version (or newer), confirmed */
    SCOUT_OTA_STEP_ABANDON = 4, /* the buoy rolled the job's image back: stop offering it */
} scout_ota_step_t;

scout_ota_step_t scout_ota_shore_step(uint32_t job_version, uint32_t running_version, bool trial,
                                      bool rolled_back, bool conserving);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_OTA_H */
