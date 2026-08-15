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
        // setModemRegisters writes the values straight to the chip and keeps no pointer,
        // so a local is safe. See the note below for why these three bytes.
        const RH_RF95::ModemConfig bw125_cr48_sf7 = {0x78, 0x74, 0x04};
        rf95_.setModemRegisters(&bw125_cr48_sf7);
        return true;
    }

    /* Send and block until the packet is on the air (or 2 s timeout — SCOUT_LINK_TX_BUDGET_MS
     * in lib/scout_link mirrors this figure for the watchdog-headroom check). */
    bool send(const uint8_t *data, uint8_t len) {
        if (!rf95_.send(data, len)) {
            return false;
        }
        return rf95_.waitPacketSent(2000);
    }

    void sleep() { rf95_.sleep(); }

private:
    /* BW 125 kHz · CR 4/8 · SF7 — explicit header, CRC on, AGC auto, no low-data-rate opt.
     *
     * RadioHead's stock choice is Bw125Cr45Sf128 = {0x72, 0x74, 0x04}. The only byte that
     * differs here is MODEM_CONFIG1, 0x72 → 0x78, which moves the coding rate from 4/5 to 4/8
     * and changes nothing else. CR 4/8 is the strongest FEC the SX1276 offers and is the cheap
     * half of the delivery-reliability strategy (ali-2024): it buys frame recovery for airtime
     * rather than for energy per useful bit.
     *
     * Spreading factor is deliberately left at 7. RadioHead's only stock CR 4/8 presets force
     * SF12 (Bw125Cr48Sf4096) or BW 31.25 kHz, and SF12/BW125 puts a 30-byte frame at ~2.2 s of
     * airtime — which would overrun send()'s 2 s waitPacketSent budget above and blow past the
     * 400 ms per-channel dwell limit in FCC 15.247's frequency-hopping rules. Whether
     * S.C.O.U.T. operates under those rules is still an open question (SCO-19), so raising SF
     * is not this change's call to make. At SF7 the frame is ~102 ms, which is safe either way
     * and leaves the range-vs-SF tradeoff to SCO-14's real over-water measurement. */
    RH_RF95 rf95_{PIN_RFM95_CS, PIN_RFM95_INT};
};

#endif
