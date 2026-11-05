/* The remote settings block in the SAMD21's flash (FlashStorage emulation), so a buoy keeps what
 * the shore last set across a full power loss. The block's format and checks are pure and tested
 * (lib/scout_settings); this file only moves its bytes.
 *
 * Writes happen only when a command changes something, a few times a month at most, far inside
 * the flash's endurance. Flashing new firmware erases the block, so a reflashed buoy starts on its
 * defaults and the shore re-sends the snapshot after its first v5 packet. */
#ifndef SCOUT_DRIVER_SETTINGS_STORE_H
#define SCOUT_DRIVER_SETTINGS_STORE_H

#include <FlashStorage.h>
#include <string.h>

#include "scout_settings.h"

struct ScoutSettingsFlash {
    uint8_t bytes[SCOUT_SETTINGS_BLOCK_SIZE];
};

FlashStorage(g_settings_flash, ScoutSettingsFlash);

class SettingsStore {
public:
    /* The stored settings and command counter, or false (outputs untouched) when the block is
     * erased, corrupt, from another registry layout, or holds a value the table refuses. */
    bool load(ScoutSettings &settings, uint32_t &last_cmd_counter) {
        ScoutSettingsFlash block = g_settings_flash.read();
        return scout_settings_block_decode(block.bytes, sizeof(block.bytes), &settings,
                                           &last_cmd_counter);
    }

    /* Write only when the block would change, sparing the flash. */
    void save(const ScoutSettings &settings, uint32_t last_cmd_counter) {
        ScoutSettingsFlash next;
        scout_settings_block_encode(&settings, last_cmd_counter, next.bytes);
        ScoutSettingsFlash current = g_settings_flash.read();
        if (memcmp(current.bytes, next.bytes, sizeof(next.bytes)) != 0) {
            g_settings_flash.write(next);
        }
    }
};

#endif
