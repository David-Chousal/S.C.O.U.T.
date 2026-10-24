/* SHT40 housing humidity/temperature sensor (Adafruit 4885) on I2C 0x44 — SCO-205.
 *
 * Always powered from the 3.3 V rail (it idles at ~0.4 uA, so it is not behind a P-FET switch).
 * One high-precision measurement per sample cycle: send 0xFD, wait for the conversion,
 * read six bytes. Frame checking and unit conversion live in lib/scout_sht4x (tested on the
 * host); this class only moves bytes. */
#ifndef SCOUT_DRIVER_SHT40_H
#define SCOUT_DRIVER_SHT40_H

#include <Arduino.h>
#include <Wire.h>

#include "scout_sht4x.h"

class HousingSensor {
public:
    /* Soft-reset the sensor. False when nothing ACKs at 0x44 (missing or miswired). */
    bool begin() {
        Wire.begin();
        if (!sendCommand(SCOUT_SHT4X_CMD_SOFT_RESET)) {
            return false;
        }
        delay(RESET_MS);
        return true;
    }

    /* One measurement. False on no ACK, a short read, or a CRC failure; the outputs are left
     * untouched then, so the caller logs blanks and flags HUMIDITY_FAIL instead of a bad value. */
    bool read(float &temp_c, float &rh_pct) {
        if (!sendCommand(SCOUT_SHT4X_CMD_MEASURE_HIGH)) {
            return false;
        }
        delay(MEASURE_MS);
        uint8_t frame[SCOUT_SHT4X_FRAME_BYTES];
        if (Wire.requestFrom((int)SCOUT_SHT4X_I2C_ADDR, (int)SCOUT_SHT4X_FRAME_BYTES) !=
            SCOUT_SHT4X_FRAME_BYTES) {
            return false;
        }
        for (uint8_t i = 0; i < SCOUT_SHT4X_FRAME_BYTES; i++) {
            frame[i] = (uint8_t)Wire.read();
        }
        return scout_sht4x_parse(frame, &temp_c, &rh_pct);
    }

private:
    static const uint16_t RESET_MS = 2;     // datasheet: soft reset <= 1 ms
    static const uint16_t MEASURE_MS = 10;  // datasheet: high precision <= 8.3 ms

    bool sendCommand(uint8_t command) {
        Wire.beginTransmission(SCOUT_SHT4X_I2C_ADDR);
        Wire.write(command);
        return Wire.endTransmission() == 0;
    }
};

#endif
