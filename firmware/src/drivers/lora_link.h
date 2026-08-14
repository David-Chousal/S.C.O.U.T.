/* RFM95 LoRa radio (SX1276) via RadioHead RH_RF95. Transmit-only in this build — the buoy
 * sends one summarized packet per day; the shore station receives (shore/scout_shore). */
#ifndef SCOUT_DRIVER_LORA_LINK_H
#define SCOUT_DRIVER_LORA_LINK_H

#include <RH_RF95.h>

#include "../config.h"

class LoraLink {
public:
    bool begin() {
        pinMode(PIN_RFM95_RST, OUTPUT);
        digitalWrite(PIN_RFM95_RST, HIGH);
        // Manual reset pulse (Feather M0 wiring).
        digitalWrite(PIN_RFM95_RST, LOW);
        delay(10);
        digitalWrite(PIN_RFM95_RST, HIGH);
        delay(10);

        if (!rf95_.init()) {
            return false;
        }
        if (!rf95_.setFrequency(LORA_FREQUENCY_MHZ)) {
            return false;
        }
        rf95_.setTxPower(LORA_TX_POWER_DBM, false);
        return true;
    }

    /* Send and block until the packet is on the air (or 2 s timeout). */
    bool send(const uint8_t *data, uint8_t len) {
        if (!rf95_.send(data, len)) {
            return false;
        }
        return rf95_.waitPacketSent(2000);
    }

    void sleep() { rf95_.sleep(); }

private:
    RH_RF95 rf95_{PIN_RFM95_CS, PIN_RFM95_INT};
};

#endif
