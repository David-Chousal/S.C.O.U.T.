/* RFM95 LoRa radio (SX1276) via RadioHead RH_RF95. Transmit-only unless built with
 * SCOUT_DOWNLINK (SCO-198), which adds a short listen after each send for a settings command
 * from the shore station. That build is off by default; see config.h. */
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
#ifdef SCOUT_DOWNLINK
        // Receiving at BW 500 kHz needs the SX1276 errata 2.1 sensitivity fix, as on the shore
        // (docs/hub/research/notes/sx1276-errata-500khz.md, OTA design §2).
        rf95_.spiWrite(0x36, 0x02);
        rf95_.spiWrite(0x3A, 0x64);
#endif
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

#ifdef SCOUT_DOWNLINK
    /* Listen up to `window_ms` for one frame and return its length (0 if none). If a valid
     * header arrived inside the window, keep receiving up to `frame_max_ms` more so the frame
     * can finish. The radio is put to sleep on every return path: a radio left in receive draws
     * ≈ 12 mA, about 20× the whole daily budget (OTA design §2). Blocks at most
     * window_ms + frame_max_ms; the caller pets the watchdog first. */
    uint8_t listen(uint8_t *buf, uint8_t cap, uint16_t window_ms, uint16_t frame_max_ms) {
        rf95_.setModeRx();
        uint8_t len = waitFor(buf, cap, window_ms);
        if (len == 0 && (rf95_.spiRead(REG_MODEM_STAT) & MODEM_STAT_HEADER_VALID)) {
            len = waitFor(buf, cap, frame_max_ms);
        }
        rf95_.sleep();
        return len;
    }
#endif

private:
#ifdef SCOUT_DOWNLINK
    static const uint8_t REG_MODEM_STAT = 0x18;           // SX1276 RegModemStat
    static const uint8_t MODEM_STAT_HEADER_VALID = 0x08;  // bit 3: header info valid

    uint8_t waitFor(uint8_t *buf, uint8_t cap, uint16_t ms) {
        uint32_t start = millis();
        while ((uint32_t)(millis() - start) < ms) {
            if (rf95_.available()) {
                uint8_t len = cap;
                return rf95_.recv(buf, &len) ? len : 0;
            }
        }
        return 0;
    }
#endif

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
