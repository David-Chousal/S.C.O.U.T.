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
        // so a local is safe. The three bytes are derived in config.h.
        const RH_RF95::ModemConfig bw500_cr48_sf12 = {
            LORA_MODEM_CONFIG1, LORA_MODEM_CONFIG2, LORA_MODEM_CONFIG3};
        rf95_.setModemRegisters(&bw500_cr48_sf12);
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
    /* BW 500 kHz · CR 4/8 · SF12 — explicit header, CRC on, AGC auto, no low-data-rate opt.
     * Byte-level derivation and the full rationale live in config.h; the short version:
     *
     * This was BW125/SF7 until 2026-09-01. That configuration was chosen when it was still an
     * open question whether S.C.O.U.T. falls under FCC 15.247's hopping rules — the previous
     * note here said as much and deliberately left SF alone. SCO-19 answered it: a 125 kHz
     * single-channel carrier at +14 dBm satisfies NEITHER §15.247 route, so BW125 was never
     * the safe default it looked like. Widening to 500 kHz takes the digital-modulation route
     * (a)(2), which has no dwell limit — so the SF cap that constrained the old note is gone.
     *
     * CR 4/8 is unchanged: the strongest FEC the SX1276 offers, and the cheap half of the
     * delivery-reliability strategy (ali-2024).
     *
     * Airtime for a 30-byte frame goes from ~111 ms to ~559 ms (both including RadioHead's
     * 4-byte header). That is still comfortably inside send()'s 2 s waitPacketSent budget and
     * SCOUT_LINK_TX_BUDGET_MS, and at one packet per day the duty cycle is 0.0019%.
     *
     * ⚠️ NOT YET VERIFIED ON HARDWARE — the register values are computed from the SX1276
     * map and the sensitivity figures are modelled, not measured. SCO-98 tracks bench
     * verification; SCO-14's over-water range test is what will confirm the predicted gain. */
    RH_RF95 rf95_{PIN_RFM95_CS, PIN_RFM95_INT};
};

#endif
