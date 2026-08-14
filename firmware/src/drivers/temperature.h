/* DS18B20 waterproof temperature probe (1-Wire) via DallasTemperature. */
#ifndef SCOUT_DRIVER_TEMPERATURE_H
#define SCOUT_DRIVER_TEMPERATURE_H

#include <DallasTemperature.h>
#include <OneWire.h>

#include "../config.h"

class TemperatureSensor {
public:
    void begin() {
        sensors_.begin();
        sensors_.setResolution(12);
    }

    /* Blocking read. Returns true and sets `celsius` on success; false on disconnect. */
    bool read(float &celsius) {
        sensors_.requestTemperatures();
        float c = sensors_.getTempCByIndex(0);
        if (c <= DEVICE_DISCONNECTED_C) {
            return false;
        }
        celsius = c;
        return true;
    }

private:
    OneWire one_wire_{PIN_ONEWIRE};
    DallasTemperature sensors_{&one_wire_};
};

#endif
