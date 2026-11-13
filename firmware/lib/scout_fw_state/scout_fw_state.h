/*
 * scout_fw_state — the boot state shared by the scout_boot stub and the application for
 * over-the-air updates (OTA design §6, SCO-197).
 *
 * Two images live on the SD card, FW/A.BIN and FW/B.BIN. `good_slot` names the last confirmed
 * one; a new image is always received into the other slot, so confirming it is a state change,
 * not a 66 KB copy (the Arduino SD library cannot rename a file).
 *
 * The state is stored in FW/STATE.BIN as two 44-byte copies, at offsets 0 and 64. Every write
 * bumps `seq` and lands on copy (seq & 1), so the copy not being written still holds the previous
 * state: a write cut by a power loss leaves one valid copy, and the reader takes the valid copy
 * with the higher seq. Each copy carries a CRC-32.
 *
 *   IDLE      run the application
 *   PENDING   set by the application once a received image passed its Ed25519 + SHA-256 checks;
 *             the stub checks the slot file's CRC-32, flashes it and moves to TRIAL
 *   TRIAL     the new image runs until the shore's CONFIRM arrives; each boot counts an attempt,
 *             and more than SCOUT_FW_MAX_ATTEMPTS boots restore the good image
 *   ROLLBACK  set by the application when a trial image never heard CONFIRM; the stub restores
 *             the good image
 *
 * Hardware-free (stdint only) and unit-tested off-target.
 */
#ifndef SCOUT_FW_STATE_H
#define SCOUT_FW_STATE_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_FW_STATE_MAGIC 0x53574653u /* "SFWS" */
#define SCOUT_FW_STATE_RECORD_BYTES 44u
#define SCOUT_FW_STATE_COPY_STRIDE 64u
#define SCOUT_FW_STATE_FILE_BYTES (2u * SCOUT_FW_STATE_COPY_STRIDE)
#define SCOUT_FW_MAX_ATTEMPTS 3u    /* boots a trial (or a pending flash) may use */
#define SCOUT_FW_MAX_TRIAL_SLOTS 3u /* transmit slots a trial image may go without CONFIRM */

typedef enum {
    SCOUT_FW_IDLE = 0,
    SCOUT_FW_PENDING = 1,
    SCOUT_FW_TRIAL = 2,
    SCOUT_FW_ROLLBACK = 3,
} scout_fw_phase_t;

/* Why the last update did not stick; any non-zero value is reported once as FW_ROLLED_BACK. */
typedef enum {
    SCOUT_FW_RB_NONE = 0,
    SCOUT_FW_RB_RESTORED = 1,      /* the trial image failed; the good image was flashed back */
    SCOUT_FW_RB_DISCARDED = 2,     /* the staged file failed its CRC; nothing was flashed */
    SCOUT_FW_RB_GOOD_MISSING = 3,  /* the good image failed its CRC too; the trial image stays */
} scout_fw_rollback_t;

typedef struct {
    uint32_t seq;
    uint8_t phase;        /* scout_fw_phase_t */
    uint8_t good_slot;    /* 0 = FW/A.BIN, 1 = FW/B.BIN */
    uint8_t attempts;     /* boots counted by the stub in PENDING/TRIAL */
    uint8_t trial_slots;  /* slots the trial image sent without hearing CONFIRM */
    uint8_t rolled_back;  /* scout_fw_rollback_t, cleared once reported */
    uint32_t good_version, good_len, good_crc;
    uint32_t new_version, new_len, new_crc;
} ScoutFwState;

typedef enum {
    SCOUT_BOOT_JUMP = 0,
    SCOUT_BOOT_FLASH_NEW = 1,
    SCOUT_BOOT_FLASH_GOOD = 2,
} scout_boot_action_t;

typedef enum {
    SCOUT_FLASH_OK = 0,
    SCOUT_FLASH_SOURCE_BAD = 1, /* the file failed its length/CRC check; flash untouched */
    SCOUT_FLASH_FAILED = 2,     /* flash was erased but did not read back right */
} scout_flash_result_t;

/* CRC-32 (IEEE, as zlib.crc32): start with 0 and chain calls over successive blocks. */
uint32_t scout_crc32_update(uint32_t crc, const uint8_t *data, size_t len);

/* The SD file holding `slot` (0 or 1): "FW/A.BIN" or "FW/B.BIN". */
const char *scout_fw_slot_path(uint8_t slot);

/* Encode one copy (SCOUT_FW_STATE_RECORD_BYTES) and say where it goes in STATE.BIN. */
size_t scout_fw_state_encode(const ScoutFwState *s, uint8_t out[SCOUT_FW_STATE_RECORD_BYTES]);
uint32_t scout_fw_state_offset(const ScoutFwState *s);

/* Pick the newest valid copy from STATE.BIN's contents (`len` bytes, short reads allowed).
 * False when neither copy is valid. */
bool scout_fw_state_load(const uint8_t *file, size_t len, ScoutFwState *out);

/* Stub, step 1: the action for this boot and the state to persist BEFORE acting on it (so a
 * power cut during a flash still counts the attempt). */
scout_boot_action_t scout_fw_boot_begin(const ScoutFwState *cur, ScoutFwState *next);

/* Stub, step 2: after a flash attempt, the state to persist and what to do next (JUMP, or
 * FLASH_GOOD when a failed new image must be replaced). */
scout_boot_action_t scout_fw_boot_after(const ScoutFwState *cur, scout_boot_action_t done,
                                        scout_flash_result_t result, ScoutFwState *next);

/* Application: true when the state does not describe the image now running (no valid state,
 * or a different version flashed over USB), so the running image must be saved as the good one. */
bool scout_fw_needs_adopt(bool valid, const ScoutFwState *s, uint32_t running_version);

/* Application: the running image becomes the good image in slot 0, phase IDLE. */
void scout_fw_adopt(ScoutFwState *s, uint32_t version, uint32_t len, uint32_t crc);

/* Application: the slot a new image is received into (the one that is not good). */
uint8_t scout_fw_receive_slot(const ScoutFwState *s);

/* Application: a received image passed its checks; ask the stub to flash it. */
void scout_fw_stage(ScoutFwState *s, uint32_t version, uint32_t len, uint32_t crc);

/* Application: the shore confirmed the trial image; it becomes the good image. */
void scout_fw_confirm(ScoutFwState *s);

/* Application: a slot went by in TRIAL without CONFIRM. True when the limit is passed, in which
 * case the phase is now ROLLBACK and the caller must persist it and reset. */
bool scout_fw_trial_slot_missed(ScoutFwState *s);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_FW_STATE_H */
