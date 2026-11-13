#ifdef SCOUT_OTA

#include "ota_buoy.h"

#include <Adafruit_SleepyDog.h>
#include <Arduino.h>
#include <SD.h>

#include "../config.h"
#include "../ota_pubkey_select.h"
#include "fw_files.h"
#include "scout_hmac.h"
#include "scout_ota.h"
#include "scout_packet.h"

// From the core's linker script: the image ends with .text, then .data's initial values.
extern "C" uint32_t __etext, __data_start__, __data_end__;

static const uint32_t RUNNING_VERSION = (FW_MAJOR << 16) | (FW_MINOR << 8) | FW_PATCH;

static bool g_ready = false;  // SD card and a state record available
static ScoutFwState g_fw;
static ScoutOtaManifest g_rx;
static uint8_t g_map[SCOUT_OTA_MAP_BYTES];

static void pet() { Watchdog.reset(); }

/* .text plus .data's initial values. The .bin also carries the 36-byte .noinit section after
 * them, which nothing loads; leaving it out only means a restored image has 0xFF there. */
static uint32_t running_image_len() {
    uint32_t text_end = (uint32_t)&__etext;
    return text_end - SCOUT_OTA_APP_START + ((uint32_t)&__data_end__ - (uint32_t)&__data_start__);
}

/* Copy the application flash into slot 0, so a good image exists without sending one. */
static bool adopt_running_image() {
    uint32_t len = running_image_len();
    const uint8_t *flash = (const uint8_t *)SCOUT_OTA_APP_START;
    const char *path = scout_fw_slot_path(0);
    SD.remove(path);
    File f = SD.open(path, FW_OPEN_RW);
    if (!f) {
        return false;
    }
    bool ok = true;
    for (uint32_t done = 0; ok && done < len; done += 512) {
        uint32_t n = len - done < 512 ? len - done : 512;
        ok = f.write(flash + done, n) == n;
        pet();
    }
    f.close();
    if (!ok) {
        return false;
    }
    scout_fw_adopt(&g_fw, RUNNING_VERSION, len, scout_crc32_update(0, flash, len));
    return fw_state_write(&g_fw);
}

void ota_begin(bool sd_ok) {
    if (!sd_ok || !fw_dir_ready()) {
        Serial.println("ota: off (no SD card)");
        return;
    }
    bool valid = fw_state_read(&g_fw);
    if (!valid) {
        memset(&g_fw, 0, sizeof(g_fw));
    }
    if (scout_fw_needs_adopt(valid, &g_fw, RUNNING_VERSION) && !adopt_running_image()) {
        Serial.println("ota: off (could not save the running image)");
        return;
    }
    g_ready = true;
    Serial.print("ota: phase=");
    Serial.print(g_fw.phase);
    Serial.print(" good=v");
    Serial.print(g_fw.good_version, HEX);
    Serial.print(" rolled_back=");
    Serial.println(g_fw.rolled_back);
}

uint16_t ota_packet_flags() {
    if (!g_ready) {
        return 0;
    }
    uint16_t flags = 0;
    if (g_fw.phase == SCOUT_FW_TRIAL) {
        flags |= SCOUT_FLAG_FW_TRIAL;
    }
    if (g_fw.rolled_back != SCOUT_FW_RB_NONE) {
        flags |= SCOUT_FLAG_FW_ROLLED_BACK;
    }
    return flags;
}

void ota_flags_sent() {
    if (g_ready && g_fw.rolled_back != SCOUT_FW_RB_NONE) {
        g_fw.seq++;
        g_fw.rolled_back = SCOUT_FW_RB_NONE;
        fw_state_write(&g_fw);
    }
}

bool ota_is_frame(const uint8_t *frame, uint8_t len) {
    return len > 0 && (frame[0] == SCOUT_OTA_TYPE_OFFER || frame[0] == SCOUT_OTA_TYPE_CONFIRM);
}

// ── transfer files ────────────────────────────────────────────────────────────────────────

static const char *rx_path() { return scout_fw_slot_path(scout_fw_receive_slot(&g_fw)); }

static bool write_file(const char *path, const uint8_t *data, size_t len) {
    SD.remove(path);
    File f = SD.open(path, FW_OPEN_RW);
    bool ok = f && f.write(data, len) == len;
    if (f) {
        f.close();
    }
    return ok;
}

static bool read_file(const char *path, uint8_t *data, size_t len) {
    File f = SD.open(path, FILE_READ);
    bool ok = f && f.read(data, len) == (int)len;
    if (f) {
        f.close();
    }
    return ok;
}

static bool save_map() {
    return write_file(FW_RX_MAP_PATH, g_map, (scout_ota_chunk_count(g_rx.image_len) + 7u) / 8u);
}

/* Resume the transfer on the card if it is this one; otherwise start it: a fresh slot file
 * written to full length (chunks land at their own offsets, and seek cannot pass the end). */
static bool open_transfer(const uint8_t *signed_manifest) {
    const size_t signed_len = SCOUT_OTA_MANIFEST_BYTES + SCOUT_OTA_SIG_BYTES;
    uint8_t stored[signed_len];
    memset(g_map, 0, sizeof(g_map));
    if (read_file(FW_RX_MAN_PATH, stored, signed_len) && memcmp(stored, signed_manifest, signed_len) == 0) {
        size_t map_len = (scout_ota_chunk_count(g_rx.image_len) + 7u) / 8u;
        if (read_file(FW_RX_MAP_PATH, g_map, map_len)) {
            return true;
        }
        memset(g_map, 0, sizeof(g_map));
    }
    SD.remove(FW_RX_MAN_PATH);  // a cut during the fill below must not look like a resume
    SD.remove(rx_path());
    File f = SD.open(rx_path(), FW_OPEN_RW);
    if (!f) {
        return false;
    }
    uint8_t zero[512];
    memset(zero, 0, sizeof(zero));
    bool ok = true;
    for (uint32_t done = 0; ok && done < g_rx.image_len; done += sizeof(zero)) {
        uint32_t n = g_rx.image_len - done < sizeof(zero) ? g_rx.image_len - done : sizeof(zero);
        ok = f.write(zero, n) == n;
        pet();
    }
    f.close();
    return ok && save_map() && write_file(FW_RX_MAN_PATH, signed_manifest, signed_len);
}

static bool write_chunk(const ScoutOtaChunk &c) {
    File f = SD.open(rx_path(), FW_OPEN_RW);
    if (!f) {
        return false;
    }
    bool ok = f.seek((uint32_t)c.index * SCOUT_OTA_CHUNK_BYTES) && f.write(c.data, c.len) == c.len;
    f.close();
    return ok;
}

/* SHA-256 (against the signed manifest) and CRC-32 (for the stub) of the received image. */
static bool image_matches(uint32_t *crc) {
    File f = SD.open(rx_path(), FILE_READ);
    if (!f) {
        return false;
    }
    ScoutSha256 sha;
    scout_sha256_init(&sha);
    uint32_t c = 0;
    uint8_t buf[256];
    bool ok = true;
    for (uint32_t done = 0; ok && done < g_rx.image_len; done += sizeof(buf)) {
        uint32_t n = g_rx.image_len - done < sizeof(buf) ? g_rx.image_len - done : sizeof(buf);
        ok = f.read(buf, n) == (int)n;
        scout_sha256_update(&sha, buf, n);
        c = scout_crc32_update(c, buf, n);
        pet();
    }
    f.close();
    uint8_t digest[SCOUT_OTA_HASH_BYTES];
    scout_sha256_final(&sha, digest);
    *crc = c;
    return ok && scout_ct_equal(digest, g_rx.sha256, sizeof(digest));
}

static void forget_transfer() {
    SD.remove(FW_RX_MAN_PATH);
    SD.remove(FW_RX_MAP_PATH);
}

// ── session ───────────────────────────────────────────────────────────────────────────────

static void send_ack(const OtaLink &link, uint8_t status, uint16_t base, uint16_t bitmap) {
    ScoutOtaAck ack = {link.buoy_id, scout_ota_session_id(&g_rx), base, bitmap, status};
    uint8_t frame[SCOUT_OTA_ACK_SIZE];
    scout_ota_ack_encode(&ack, frame);
    pet();
    link.lora->send(frame, sizeof(frame));
    pet();
}

/* Receive one window's chunks until the LAST flag, silence, or the session deadline. Returns
 * false on an SD failure; `heard` says whether any chunk of this transfer arrived. */
static bool receive_window(const OtaLink &link, uint32_t deadline, bool *heard) {
    uint8_t frame[SCOUT_OTA_FRAME_MAX + 4];
    *heard = false;
    while ((int32_t)(deadline - millis()) > 0) {
        pet();
        uint8_t len = link.lora->listen(frame, sizeof(frame), OTA_CHUNK_WAIT_MS, DOWNLINK_FRAME_MAX_MS);
        pet();
        ScoutOtaChunk c;
        if (len == 0) {
            return true;
        }
        if (scout_ota_chunk_decode(frame, len, &c) != SCOUT_OTA_OK || !scout_ota_chunk_fits(&g_rx, &c)) {
            continue;
        }
        *heard = true;
        if (!scout_ota_map_get(g_map, c.index)) {
            if (!write_chunk(c)) {
                return false;
            }
            scout_ota_map_set(g_map, c.index);
        }
        if (c.flags & SCOUT_OTA_CHUNK_LAST) {
            return true;
        }
    }
    return true;
}

/* Every chunk is held: check it, and stage it for the stub or throw it away. */
static void finish_transfer(const OtaLink &link) {
    uint32_t crc = 0;
    if (!image_matches(&crc)) {
        Serial.println("ota: hash mismatch, image discarded");
        forget_transfer();
        send_ack(link, SCOUT_OTA_ACK_HASH_FAIL, SCOUT_OTA_ALL_HELD, 0xFFFF);
        return;
    }
    scout_fw_stage(&g_fw, g_rx.version, g_rx.image_len, crc);
    if (!fw_state_write(&g_fw)) {
        send_ack(link, SCOUT_OTA_ACK_REFUSED, SCOUT_OTA_ALL_HELD, 0xFFFF);
        return;
    }
    forget_transfer();
    send_ack(link, SCOUT_OTA_ACK_COMPLETE, SCOUT_OTA_ALL_HELD, 0xFFFF);
    Serial.println("ota: image verified, resetting into the boot stub");
    Serial.flush();
    NVIC_SystemReset();
}

static void run_session(const OtaLink &link) {
    uint16_t count = scout_ota_chunk_count(g_rx.image_len);
    uint32_t deadline = millis() + OTA_SESSION_MAX_MS;
    uint8_t silent = 0;
    for (;;) {
        uint16_t base = scout_ota_next_window(g_map, count);
        if (base == SCOUT_OTA_ALL_HELD) {
            finish_transfer(link);
            return;
        }
        uint16_t bitmap = scout_ota_window_bitmap(g_map, count, base);
        if (link.power_mode() != SCOUT_POWER_NORMAL) {
            send_ack(link, SCOUT_OTA_ACK_REFUSED, base, bitmap);
            return;
        }
        if ((int32_t)(deadline - millis()) <= 0 || silent >= OTA_SILENT_WINDOWS_MAX) {
            return;  // resumes from the card in a later slot
        }
        send_ack(link, SCOUT_OTA_ACK_PROGRESS, base, bitmap);
        bool heard = false;
        bool sd_ok = receive_window(link, deadline, &heard);
        if (!save_map() || !sd_ok) {
            send_ack(link, SCOUT_OTA_ACK_REFUSED, base, bitmap);
            return;
        }
        silent = heard ? 0 : (uint8_t)(silent + 1);
    }
}

static void handle_offer(const OtaLink &link, const uint8_t *frame, uint8_t len) {
    if (g_fw.phase != SCOUT_FW_IDLE) {
        return;  // one update at a time: a trial must settle before the next offer
    }
    pet();
    scout_ota_result_t r = scout_ota_offer_check(frame, len, SCOUT_OTA_PUBKEY, link.buoy_id,
                                                 RUNNING_VERSION, &g_rx);
    pet();  // Ed25519 on the M0 takes on the order of a second
    Serial.print("ota: offer result=");
    Serial.println((int)r);
    if (r != SCOUT_OTA_OK) {
        return;
    }
    if (link.power_mode() != SCOUT_POWER_NORMAL || !open_transfer(frame + 1)) {
        send_ack(link, SCOUT_OTA_ACK_REFUSED, 0, 0);
        return;
    }
    run_session(link);
}

static bool handle_confirm(const OtaLink &link, const uint8_t *frame, uint8_t len, uint32_t now,
                           uint32_t max_skew_s, uint32_t *last_counter) {
    if (g_fw.phase != SCOUT_FW_TRIAL || link.cmd_key == nullptr) {
        return false;
    }
    uint32_t counter = 0;
    scout_ota_result_t r = scout_ota_confirm_check(frame, len, link.cmd_key, link.buoy_id, *last_counter,
                                                   now, max_skew_s, RUNNING_VERSION, &counter);
    Serial.print("ota: confirm result=");
    Serial.println((int)r);
    if (r != SCOUT_OTA_OK) {
        return false;
    }
    *last_counter = counter;
    scout_fw_confirm(&g_fw);
    fw_state_write(&g_fw);
    return true;
}

OtaHeard ota_handle(const OtaLink &link, const uint8_t *frame, uint8_t len, bool in_slot,
                    uint32_t now_epoch, uint32_t max_skew_s, uint32_t *last_counter) {
    if (!g_ready || !in_slot || len == 0) {
        return OTA_HEARD_NOTHING;
    }
    if (frame[0] == SCOUT_OTA_TYPE_OFFER) {
        handle_offer(link, frame, len);
        return OTA_HEARD_OFFER;
    }
    if (frame[0] == SCOUT_OTA_TYPE_CONFIRM &&
        handle_confirm(link, frame, len, now_epoch, max_skew_s, last_counter)) {
        return OTA_HEARD_CONFIRM;
    }
    return OTA_HEARD_NOTHING;
}

void ota_after_slot(bool confirmed) {
    if (!g_ready || confirmed || g_fw.phase != SCOUT_FW_TRIAL) {
        return;
    }
    bool give_up = scout_fw_trial_slot_missed(&g_fw);
    fw_state_write(&g_fw);
    if (give_up) {
        Serial.println("ota: trial image never confirmed, rolling back");
        Serial.flush();
        NVIC_SystemReset();
    }
}

#endif  // SCOUT_OTA
