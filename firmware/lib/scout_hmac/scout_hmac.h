/*
 * scout_hmac — SHA-256 (FIPS 180-4) and HMAC-SHA256 (RFC 2104), for authenticating settings
 * commands sent to the buoy (OTA design §5, SCO-198).
 *
 * Small and allocation-free so it runs the same on the SAMD21 buoy, the ESP32-S3 shore station
 * and the host (`pio test -e native`), where it is checked against the FIPS and RFC 4231 test
 * vectors. Hardware-free: only <stdint.h>/<stddef.h>.
 */
#ifndef SCOUT_HMAC_H
#define SCOUT_HMAC_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_SHA256_DIGEST_BYTES 32u
#define SCOUT_SHA256_BLOCK_BYTES 64u

typedef struct {
    uint32_t state[8];
    uint64_t length_bits;
    uint8_t block[SCOUT_SHA256_BLOCK_BYTES];
    size_t block_len;
} ScoutSha256;

void scout_sha256_init(ScoutSha256 *ctx);
void scout_sha256_update(ScoutSha256 *ctx, const uint8_t *data, size_t len);
void scout_sha256_final(ScoutSha256 *ctx, uint8_t out[SCOUT_SHA256_DIGEST_BYTES]);

/* HMAC-SHA256 of `msg` under `key` (any length; keys over 64 bytes are hashed first). */
void scout_hmac_sha256(const uint8_t *key, size_t key_len, const uint8_t *msg, size_t msg_len,
                       uint8_t out[SCOUT_SHA256_DIGEST_BYTES]);

/* Compare two byte strings in time independent of where they differ (no early exit), so a
 * forger cannot find a valid tag one byte at a time by timing the reply. */
bool scout_ct_equal(const uint8_t *a, const uint8_t *b, size_t len);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_HMAC_H */
