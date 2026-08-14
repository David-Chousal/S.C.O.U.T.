/* Battery voltage via the Feather M0's onboard 2:1 divider on A7.
 * NOTE: the charging path / final pack is unresolved (ADR-0002); the 2:1 assumption and the
 * ADC reference here must be re-checked once the battery topology is fixed. */
#ifndef SCOUT_DRIVER_BATTERY_H
#define SCOUT_DRIVER_BATTERY_H

#include <Arduino.h>

#include "../config.h"

class Battery {
public:
    void begin() { analogReadResolution(ADC_RESOLUTION_BITS); }

    uint16_t readMillivolts() {
        uint32_t raw = analogRead(PIN_BATTERY);
        float volts = (raw * ADC_VREF_V / 4095.0f) * 2.0f;  // undo the 2:1 divider
        return (uint16_t)(volts * 1000.0f + 0.5f);
    }
};

#endif
