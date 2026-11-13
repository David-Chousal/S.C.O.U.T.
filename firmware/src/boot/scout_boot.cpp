/*
 * scout_boot — the SD-card boot stub for over-the-air updates (OTA design §6, SCO-197).
 *
 * Built on its own (env scout_boot), converted to src/ota/scout_boot_image.h by
 * tools/make_boot_image.py, and linked into every SCOUT_OTA application at 0x2000 through the
 * core's .sketch_boot section, so the application starts at 0x8000. The stub gets 24 KB, not
 * SDU's 16 KB: the Adafruit core's SPI DMA, USB and UART objects put it at about 21 KB. It is
 * written only over USB, with the application around it, and never over the air.
 *
 * Adapted from Arduino's SDUBoot (ArduinoCore-samd libraries/SDU, LGPL-2.1), with three changes
 * the stock stub needs on this board:
 *   - SD chip-select is the Adalogger's pin 10. SDU's default, pin 4, is the RFM95 reset line
 *     here; the RFM95's own chip-select (pin 8) is held high so it stays off the SPI bus.
 *   - Nothing is flashed until the source file's length and CRC-32 match the state record, so
 *     a corrupt file never erases a working image.
 *   - It keeps the good image and restores it when a trial image keeps resetting or asks for
 *     it (state machine and its tests: lib/scout_fw_state).
 *
 * Every state write happens before the step it records, so a power cut at any point repeats
 * or counts that step on the next boot rather than losing it.
 */
#include <Arduino.h>
#include <FlashStorage.h>
#include <SD.h>

#include "../config.h"
#include "../ota/fw_files.h"
#include "scout_fw_state.h"

static const uint32_t APP_START = 0x8000u;
static const uint32_t APP_MAX = 0x40000u - APP_START;

static FlashClass g_flash;

extern "C" void __libc_init_array(void);

static uint32_t flash_crc(uint32_t len) {
    return scout_crc32_update(0, (const uint8_t *)APP_START, len);
}

static scout_flash_result_t flash_slot(uint8_t slot, uint32_t len, uint32_t crc) {
    const char *path = scout_fw_slot_path(slot);
    uint32_t file_crc = 0;
    if (len == 0 || len > APP_MAX || !fw_file_crc(path, len, &file_crc, nullptr) || file_crc != crc) {
        return SCOUT_FLASH_SOURCE_BAD;
    }
    File f = SD.open(path, FILE_READ);
    if (!f) {
        return SCOUT_FLASH_SOURCE_BAD;
    }
    g_flash.erase((const void *)APP_START, len);
    uint8_t buf[256];
    for (uint32_t done = 0; done < len; done += sizeof(buf)) {
        memset(buf, 0xFF, sizeof(buf));
        uint32_t want = len - done < sizeof(buf) ? len - done : sizeof(buf);
        if (f.read(buf, want) != (int)want) {
            f.close();
            return SCOUT_FLASH_FAILED;
        }
        g_flash.write((const void *)(APP_START + done), buf, (want + 3u) & ~3u);
    }
    f.close();
    return flash_crc(len) == crc ? SCOUT_FLASH_OK : SCOUT_FLASH_FAILED;
}

static scout_flash_result_t run(scout_boot_action_t action, const ScoutFwState &s) {
    if (action == SCOUT_BOOT_FLASH_NEW) {
        return flash_slot(scout_fw_receive_slot(&s), s.new_len, s.new_crc);
    }
    return flash_slot(s.good_slot, s.good_len, s.good_crc);
}

static void update_if_needed() {
    pinMode(PIN_RFM95_CS, OUTPUT);
    digitalWrite(PIN_RFM95_CS, HIGH);
    ScoutFwState cur;
    if (!SD.begin(PIN_SD_CS) || !fw_state_read(&cur)) {
        return;
    }
    ScoutFwState next;
    scout_boot_action_t action = scout_fw_boot_begin(&cur, &next);
    if (action == SCOUT_BOOT_JUMP && cur.phase == SCOUT_FW_IDLE) {
        return;  // nothing to do: no write, so an idle boot never wears the card
    }
    // Up to two flashes: the new image, and the good one if the new one failed half-way.
    for (uint8_t step = 0; step < 2 && action != SCOUT_BOOT_JUMP; step++) {
        if (!fw_state_write(&next)) {
            return;  // a card that cannot record the attempt must not be flashed from
        }
        cur = next;
        scout_flash_result_t result = run(action, cur);
        action = scout_fw_boot_after(&cur, action, result, &next);
    }
    fw_state_write(&next);
}

int main() {
    init();
    __libc_init_array();
    delay(1);
    update_if_needed();

    // Jump to the application: its stack pointer and reset vector start the vector table at
    // 0x8000 (as in SDUBoot).
    const uint32_t *app = (const uint32_t *)APP_START;
    __set_MSP(app[0]);
    SCB->VTOR = APP_START & SCB_VTOR_TBLOFF_Msk;
    uint32_t reset_handler = app[1];
    asm("bx %0" ::"r"(reset_handler));
    return 0;
}
