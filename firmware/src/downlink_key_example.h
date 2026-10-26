/*
 * downlink_key_example.h — TEMPLATE for the settings-downlink HMAC keys (SCO-198).
 *
 * Copy to src/downlink_key.h (gitignored) and replace every key with 32 random bytes, e.g.
 *     python3 -c "import secrets; print(secrets.token_hex(32))"
 * The same per-buoy key goes on that buoy and on the shore station (SCOUT_CMD_KEY_<id> for the
 * Python service), and nowhere else: not the console, not the repo, not a chat.
 *
 * These example keys are public. A build only falls back to this file when it is compiled with
 * -DSCOUT_DOWNLINK_ALLOW_EXAMPLE_KEY (the compile-check environment), and it says so at boot.
 */
#ifndef SCOUT_DOWNLINK_KEY_H
#define SCOUT_DOWNLINK_KEY_H

#include <stdint.h>

#define SCOUT_DOWNLINK_KEY_IS_EXAMPLE 1

struct ScoutBuoyKey {
    uint16_t buoy_id;
    uint8_t key[32];
};

static const ScoutBuoyKey DOWNLINK_KEYS[] = {
    {1, {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
         0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f}},
    {2, {0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
         0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f}},
};
static const size_t DOWNLINK_KEY_COUNT = sizeof(DOWNLINK_KEYS) / sizeof(DOWNLINK_KEYS[0]);

/* The key for `buoy_id`, or nullptr when this build has none for it. */
static inline const uint8_t *scout_downlink_key(uint16_t buoy_id) {
    for (size_t i = 0; i < DOWNLINK_KEY_COUNT; i++) {
        if (DOWNLINK_KEYS[i].buoy_id == buoy_id) {
            return DOWNLINK_KEYS[i].key;
        }
    }
    return nullptr;
}

#endif /* SCOUT_DOWNLINK_KEY_H */
