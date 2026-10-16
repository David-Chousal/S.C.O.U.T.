/* Seeed Grove 101020752 analog turbidity sensor, powered at 3.3 V so its output is already
 * within the ADC range. Uncalibrated — reports ADC counts and volts, NOT NTU (see
 * docs/engineering/data-schema.md). */
#ifndef SCOUT_DRIVER_TURBIDITY_H
#define SCOUT_DRIVER_TURBIDITY_H

#include <Arduino.h>

#include "../config.h"

class TurbiditySensor {
public:
    void begin() { analogReadResolution(ADC_RESOLUTION_BITS); }

    uint16_t readAdc() { return (uint16_t)analogRead(PIN_TURBIDITY); }

    float readVolts() { return readAdc() * ADC_VREF_V / 4095.0f; }
};

#endif
