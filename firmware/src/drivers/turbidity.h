/* DFRobot SEN0189 analog turbidity sensor. Uncalibrated — reports ADC counts and volts,
 * NOT NTU (see docs/engineering/data-schema.md). The analog front end must keep the input
 * within the 3.3 V ADC range (ADR-0002). */
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
