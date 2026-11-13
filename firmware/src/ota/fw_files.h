/* SD-card files for over-the-air updates, shared by the scout_boot stub (src/boot/) and the
 * application (src/ota/), SCO-197. The layout and the state machine are in lib/scout_fw_state.
 *
 *   FW/STATE.BIN   boot state, two copies (scout_fw_state)
 *   FW/A.BIN       image slot 0      FW/B.BIN   image slot 1
 *   FW/RX.MAN      manifest + signature of the transfer in progress (116 B)
 *   FW/RX.MAP      received-chunk bitmap of that transfer
 *
 * Arduino SD's FILE_WRITE appends whatever the seek position, so files written at an offset are
 * opened without O_APPEND. */
#ifndef SCOUT_OTA_FW_FILES_H
#define SCOUT_OTA_FW_FILES_H

#include <SD.h>

#include "scout_fw_state.h"

#define FW_DIR "FW"
#define FW_STATE_PATH "FW/STATE.BIN"
#define FW_RX_MAN_PATH "FW/RX.MAN"
#define FW_RX_MAP_PATH "FW/RX.MAP"
#define FW_OPEN_RW (O_READ | O_WRITE | O_CREAT)

static inline bool fw_dir_ready() { return SD.exists(FW_DIR) || SD.mkdir(FW_DIR); }

static inline bool fw_state_read(ScoutFwState *out) {
    uint8_t buf[SCOUT_FW_STATE_FILE_BYTES];
    File f = SD.open(FW_STATE_PATH, FILE_READ);
    if (!f) {
        return false;
    }
    int n = f.read(buf, sizeof(buf));
    f.close();
    return n > 0 && scout_fw_state_load(buf, (size_t)n, out);
}

/* Writes the copy `s` belongs in (s->seq & 1); the other copy keeps the previous state. */
static inline bool fw_state_write(const ScoutFwState *s) {
    uint8_t rec[SCOUT_FW_STATE_RECORD_BYTES];
    scout_fw_state_encode(s, rec);
    File f = SD.open(FW_STATE_PATH, FW_OPEN_RW);
    if (!f) {
        return false;
    }
    uint32_t at = scout_fw_state_offset(s);
    // A fresh file is shorter than the second copy's offset; pad it so seek() can reach it.
    uint8_t pad[SCOUT_FW_STATE_COPY_STRIDE];
    memset(pad, 0xFF, sizeof(pad));
    while (f.size() < at) {
        if (f.seek(f.size()) == 0 || f.write(pad, sizeof(pad)) != sizeof(pad)) {
            f.close();
            return false;
        }
    }
    bool ok = f.seek(at) && f.write(rec, sizeof(rec)) == sizeof(rec);
    f.close();
    return ok;
}

/* CRC-32 of the first `len` bytes of `path`; false if the file is shorter or unreadable.
 * `tick` (may be null) is called every block, for the watchdog. */
static inline bool fw_file_crc(const char *path, uint32_t len, uint32_t *crc, void (*tick)()) {
    File f = SD.open(path, FILE_READ);
    if (!f || f.size() < len) {
        if (f) {
            f.close();
        }
        return false;
    }
    uint8_t buf[256];
    uint32_t c = 0;
    for (uint32_t done = 0; done < len;) {
        uint32_t want = len - done < sizeof(buf) ? len - done : sizeof(buf);
        if (f.read(buf, want) != (int)want) {
            f.close();
            return false;
        }
        c = scout_crc32_update(c, buf, want);
        done += want;
        if (tick) {
            tick();
        }
    }
    f.close();
    *crc = c;
    return true;
}

#endif
