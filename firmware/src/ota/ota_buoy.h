/* The buoy's half of over-the-air firmware updates (OTA design §4-§6, SCO-197), in SCOUT_OTA
 * builds. main.cpp calls in at four points: once at boot, when building each packet, for every
 * OTA frame heard in a listen window, and after each slot's listen.
 *
 * Receive: an Ed25519-signed OTA_OFFER heard after a slot starts (or resumes) a transfer into
 * the slot file that is not the good image. Chunks arrive in windows of 16; after each window
 * the buoy ACKs what it holds. The session ends when every chunk is held, after
 * OTA_SESSION_MAX_MS, when the battery leaves NORMAL, or after two windows with nothing heard.
 * A finished image is applied only when its SHA-256 matches the signed manifest; then the state
 * goes PENDING and the buoy resets into the scout_boot stub, which flashes it.
 *
 * Trial: the new image reports FW_TRIAL in every packet until the shore's CONFIRM (HMAC, the
 * buoy's settings-downlink key) arrives after a slot. More than SCOUT_FW_MAX_TRIAL_SLOTS slots
 * without it, and the image asks the stub to restore the good one. */
#ifndef SCOUT_OTA_BUOY_H
#define SCOUT_OTA_BUOY_H

#include <stdint.h>

#include "../drivers/lora_link.h"
#include "scout_scheduler.h"

struct OtaLink {
    LoraLink *lora;
    uint16_t buoy_id;
    const uint8_t *cmd_key;               // the buoy's settings-downlink key, for CONFIRM
    scout_power_mode_t (*power_mode)();   // reads the battery now
};

enum OtaHeard {
    OTA_HEARD_NOTHING = 0,  // not an OTA frame, or one this buoy ignores
    OTA_HEARD_OFFER = 1,    // an offer (a transfer session may have run)
    OTA_HEARD_CONFIRM = 2,  // a valid CONFIRM: the trial image is now the good image
};

/* After the SD card is up: load the boot state, and save the running image as the good one
 * when the state does not describe it (first boot, or a USB flash). */
void ota_begin(bool sd_ok);

/* Bits for the next packet's flags: FW_TRIAL and/or FW_ROLLED_BACK. */
uint16_t ota_packet_flags();

/* The packet carrying ota_packet_flags() went out: a rollback has now been reported. */
void ota_flags_sent();

/* True for a frame type this module handles (OTA_OFFER, OTA_CONFIRM). */
bool ota_is_frame(const uint8_t *frame, uint8_t len);

/* Handle an OTA frame heard in a listen window. `in_slot` is false for the boot hello: a trial
 * image must prove a full wake and sleep before it may be confirmed, and offers wait for a slot.
 * `last_counter` is the settings counter shared with commands (a CONFIRM advances it). */
OtaHeard ota_handle(const OtaLink &link, const uint8_t *frame, uint8_t len, bool in_slot,
                    uint32_t now_epoch, uint32_t max_skew_s, uint32_t *last_counter);

/* After a transmit slot's listen. In TRIAL without a CONFIRM this counts a missed slot and,
 * past the limit, records ROLLBACK and resets (it does not return then). */
void ota_after_slot(bool confirmed);

#endif
