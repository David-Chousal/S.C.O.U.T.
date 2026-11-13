#ifdef SCOUT_OTA

#include "shore_ota.h"

#include <Arduino.h>
#include <stdlib.h>
#include <string.h>

#include "../config.h"
#include "../ota_pubkey_select.h"
#include "scout_hmac.h"

// Waits, from the buoy's side of the design (src/ota/ota_buoy.cpp, config.h):
static const uint32_t OFFER_ACK_WAIT_MS = 15000;  // Ed25519 check + preallocating the slot file
static const uint32_t ACK_WAIT_MS = 6000;         // a window's last chunk, or OTA_CHUNK_WAIT_MS, + ACK
static const uint32_t CHUNK_GAP_MS = 200;         // lets the buoy write the chunk and re-arm receive
static const uint8_t MISSED_ACKS_MAX = 3;
static const uint32_t SESSION_SLACK_MS = 30000;   // the buoy ends first; this only bounds a lost one

struct Job {
    bool armed;
    uint16_t buoy_id;
    uint32_t length;
    uint8_t *image;
    uint8_t signed_manifest[SCOUT_OTA_MANIFEST_BYTES + SCOUT_OTA_SIG_BYTES];
    ScoutOtaManifest manifest;
};

static Job g_job = {};

static void drop_job() {
    free(g_job.image);
    memset(&g_job, 0, sizeof(g_job));
}

static int hex_value(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

/* Decode exactly `len` bytes of hex from `text` (which must end there). */
static bool unhex(const char *text, uint8_t *out, size_t len) {
    if (strlen(text) != 2 * len) {
        return false;
    }
    for (size_t i = 0; i < len; i++) {
        int hi = hex_value(text[2 * i]);
        int lo = hex_value(text[2 * i + 1]);
        if (hi < 0 || lo < 0) {
            return false;
        }
        out[i] = (uint8_t)((hi << 4) | lo);
    }
    return true;
}

static void begin_job(const char *args) {
    char *end = nullptr;
    unsigned long buoy = strtoul(args, &end, 10);
    unsigned long length = (end && *end == ':') ? strtoul(end + 1, nullptr, 10) : 0;
    drop_job();
    if (buoy == 0 || buoy > 0xFFFF || length == 0 || length > SCOUT_OTA_MAX_IMAGE) {
        Serial.print("ota: error begin, expected FB<buoy>:<length>\n");
        return;
    }
    g_job.image = (uint8_t *)malloc(length);
    if (g_job.image == nullptr) {
        Serial.print("ota: error out of memory\n");
        return;
    }
    g_job.buoy_id = (uint16_t)buoy;
    g_job.length = length;
    Serial.printf("ota: loading buoy=%lu length=%lu\n", buoy, length);
}

static void add_data(const char *args) {
    char *end = nullptr;
    unsigned long offset = strtoul(args, &end, 10);
    if (g_job.image == nullptr || end == nullptr || *end != ':') {
        Serial.print("ota: error data without FB\n");
        return;
    }
    size_t n = strlen(end + 1) / 2;
    if (n == 0 || offset + n > g_job.length || !unhex(end + 1, g_job.image + offset, n)) {
        Serial.printf("ota: error data at %lu\n", offset);
        drop_job();
    }
}

/* The station relays only what it can verify itself: the release key's signature and the hash. */
static void arm_job(const char *hex) {
    if (g_job.image == nullptr || !unhex(hex, g_job.signed_manifest, sizeof(g_job.signed_manifest))) {
        Serial.print("ota: error manifest\n");
        drop_job();
        return;
    }
    uint8_t digest[SCOUT_OTA_HASH_BYTES];
    ScoutSha256 sha;
    scout_sha256_init(&sha);
    scout_sha256_update(&sha, g_job.image, g_job.length);
    scout_sha256_final(&sha, digest);
    ScoutOtaManifest *m = &g_job.manifest;
    const char *why = nullptr;
    if (!scout_ota_manifest_decode(g_job.signed_manifest, m)) {
        why = "magic";
    } else if (m->image_len != g_job.length || memcmp(digest, m->sha256, sizeof(digest)) != 0) {
        why = "hash";
    } else if (m->target_buoy != 0 && m->target_buoy != g_job.buoy_id) {
        why = "buoy";
    } else if (!scout_ota_signature_ok(g_job.signed_manifest, g_job.signed_manifest + SCOUT_OTA_MANIFEST_BYTES,
                                       SCOUT_OTA_PUBKEY)) {
        why = "signature";
    }
    if (why != nullptr) {
        Serial.printf("ota: error bundle rejected (%s)\n", why);
        drop_job();
        return;
    }
    g_job.armed = true;
    Serial.printf("ota: ready buoy=%u version=%06lx chunks=%u session=%04x\n", g_job.buoy_id,
                  (unsigned long)m->version, scout_ota_chunk_count(m->image_len), scout_ota_session_id(m));
}

bool shore_ota_line(const char *line) {
    if (line[0] != 'F') {
        return false;
    }
    switch (line[1]) {
        case 'B': begin_job(line + 2); break;
        case 'D': add_data(line + 2); break;
        case 'M': arm_job(line + 2); break;
        case 'X': drop_job(); Serial.print("ota: job dropped\n"); break;
        default: Serial.print("ota: error unknown F line\n"); break;
    }
    return true;
}

scout_ota_step_t shore_ota_step(const ScoutReading &r) {
    if (!g_job.armed || r.buoy_id != g_job.buoy_id) {
        return SCOUT_OTA_STEP_NONE;
    }
    uint32_t running = scout_ota_version(r.fw_major, r.fw_minor, r.fw_patch);
    return scout_ota_shore_step(g_job.manifest.version, running, (r.flags & SCOUT_FLAG_FW_TRIAL) != 0,
                                (r.flags & SCOUT_FLAG_FW_ROLLED_BACK) != 0,
                                (r.flags & SCOUT_FLAG_POWER_CONSERVE) != 0);
}

uint32_t shore_ota_job_version() { return g_job.manifest.version; }

void shore_ota_finish(scout_ota_step_t why) {
    Serial.printf("ota: job %s buoy=%u version=%06lx\n", why == SCOUT_OTA_STEP_DONE ? "done" : "abandoned (rolled back)",
                  g_job.buoy_id, (unsigned long)g_job.manifest.version);
    drop_job();
}

// ── session ───────────────────────────────────────────────────────────────────────────────

static bool send_frame(RH_RF95 &radio, const uint8_t *frame, size_t len) {
    bool sent = radio.send(frame, (uint8_t)len) && radio.waitPacketSent(2000);
    radio.setModeRx();
    return sent;
}

/* The next ACK from `buoy_id` for this session within `ms`; other frames are skipped (and lost:
 * the station hears nothing else while a session runs). */
static bool wait_ack(RH_RF95 &radio, uint16_t buoy_id, uint32_t ms, ScoutOtaAck *ack) {
    uint16_t session = scout_ota_session_id(&g_job.manifest);
    uint32_t start = millis();
    while (millis() - start < ms) {
        if (!radio.available()) {
            delay(1);
            continue;
        }
        uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
        uint8_t len = sizeof(buf);
        if (radio.recv(buf, &len) && scout_ota_ack_decode(buf, len, ack) == SCOUT_OTA_OK &&
            ack->buoy_id == buoy_id && ack->session == session) {
            return true;
        }
        Serial.printf("ota: skipped a %u-byte frame during the session\n", len);
    }
    return false;
}

static void send_window(RH_RF95 &radio, const ScoutOtaAck &ack) {
    uint16_t todo[SCOUT_OTA_WINDOW];
    uint16_t count = scout_ota_chunk_count(g_job.manifest.image_len);
    uint8_t n = scout_ota_missing(ack.base, ack.bitmap, count, todo);
    uint16_t session = scout_ota_session_id(&g_job.manifest);
    for (uint8_t i = 0; i < n; i++) {
        uint8_t frame[SCOUT_OTA_CHUNK_FRAME_MAX];
        uint8_t len = scout_ota_chunk_len(g_job.manifest.image_len, todo[i]);
        size_t size = scout_ota_chunk_encode(session, todo[i], i + 1 == n ? SCOUT_OTA_CHUNK_LAST : 0,
                                             g_job.image + (uint32_t)todo[i] * SCOUT_OTA_CHUNK_BYTES, len, frame);
        delay(CHUNK_GAP_MS);
        send_frame(radio, frame, size);
    }
    Serial.printf("ota: window base=%u sent=%u\n", ack.base, n);
}

void shore_ota_run_session(RH_RF95 &radio, uint16_t buoy_id) {
    uint8_t offer[SCOUT_OTA_OFFER_SIZE];
    scout_ota_offer_encode(g_job.signed_manifest, g_job.signed_manifest + SCOUT_OTA_MANIFEST_BYTES, offer);
    bool sent = send_frame(radio, offer, sizeof(offer));
    Serial.printf("ota: offer buoy=%u version=%06lx sent=%s\n", buoy_id,
                  (unsigned long)g_job.manifest.version, sent ? "yes" : "no");
    uint32_t deadline = millis() + OTA_SESSION_MAX_MS + SESSION_SLACK_MS;
    ScoutOtaAck ack;
    bool have = wait_ack(radio, buoy_id, OFFER_ACK_WAIT_MS, &ack);
    uint8_t missed = 0;
    while ((int32_t)(deadline - millis()) > 0) {
        if (!have) {
            if (++missed >= MISSED_ACKS_MAX) {
                Serial.print("ota: session ended, buoy silent\n");
                return;
            }
            have = wait_ack(radio, buoy_id, ACK_WAIT_MS, &ack);
            continue;
        }
        missed = 0;
        if (ack.status != SCOUT_OTA_ACK_PROGRESS) {
            // COMPLETE: the buoy resets into its stub; its next packet should report FW_TRIAL.
            // HASH_FAIL: this station checked the hash itself, so the copy on the buoy was damaged
            // in transit; the buoy discarded it and the next slot starts the transfer again.
            Serial.printf("ota: session ended, buoy says %u\n", ack.status);
            return;
        }
        send_window(radio, ack);
        have = wait_ack(radio, buoy_id, ACK_WAIT_MS, &ack);
    }
    Serial.print("ota: session ended, time limit\n");
}

#endif  // SCOUT_OTA
