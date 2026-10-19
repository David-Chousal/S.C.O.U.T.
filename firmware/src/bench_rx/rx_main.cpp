/*
 * Bench LoRa receiver — env feather_m0_rx (SCO-155, SCO-98).
 *
 * Runs on a SECOND Feather M0 RFM95 and prints every frame the buoy sends, so the link can be
 * tested before the ESP32-S3 shore station exists. It is a test instrument, not the shore
 * station (shore-station.md).
 *
 * Radio settings come from the same config.h the buoy is built from, so the two cannot drift.
 * As a receiver at BW 500 kHz it also applies the SX1276 errata §2.1 sensitivity fix, which the
 * transmit-only buoy does not need (docs/hub/research/notes/sx1276-errata-500khz.md).
 *
 * Output, one line per frame, decodable with shore/scripts/decode_frames.py:
 *   RX len=30 rssi=-41 snr=9.5 hex=0101...
 */
#include <Arduino.h>
#include <RH_RF95.h>

#include "../config.h"

static const uint8_t REG_HIGH_BW_OPTIMIZE_1 = 0x36;
static const uint8_t REG_HIGH_BW_OPTIMIZE_2 = 0x3A;
static const uint8_t HIGH_BW_OPTIMIZE_1_AT_500K = 0x02;
static const uint8_t HIGH_BW_OPTIMIZE_2_AT_500K = 0x64;

static RH_RF95 g_rf95(PIN_RFM95_CS, PIN_RFM95_INT);
static uint32_t g_frames = 0;

static bool radio_begin() {
    pinMode(PIN_RFM95_RST, OUTPUT);
    digitalWrite(PIN_RFM95_RST, LOW);
    delay(10);
    digitalWrite(PIN_RFM95_RST, HIGH);
    delay(10);
    if (!g_rf95.init() || !g_rf95.setFrequency(LORA_FREQUENCY_MHZ)) {
        return false;
    }
    const RH_RF95::ModemConfig cfg = {LORA_MODEM_CONFIG1, LORA_MODEM_CONFIG2, LORA_MODEM_CONFIG3};
    g_rf95.setModemRegisters(&cfg);
    // spiWrite is public on RHSPIDriver, so no subclass is needed.
    g_rf95.spiWrite(REG_HIGH_BW_OPTIMIZE_1, HIGH_BW_OPTIMIZE_1_AT_500K);
    g_rf95.spiWrite(REG_HIGH_BW_OPTIMIZE_2, HIGH_BW_OPTIMIZE_2_AT_500K);
    g_rf95.setPromiscuous(true);  // accept every frame regardless of RadioHead addressing
    g_rf95.setModeRx();
    return true;
}

static void print_frame(const uint8_t *buf, uint8_t len) {
    g_frames++;
    Serial.print("RX len=");
    Serial.print(len);
    Serial.print(" rssi=");
    Serial.print(g_rf95.lastRssi());
    Serial.print(" snr=");
    Serial.print(g_rf95.lastSNR());
    Serial.print(" n=");
    Serial.print(g_frames);
    Serial.print(" hex=");
    for (uint8_t i = 0; i < len; i++) {
        if (buf[i] < 0x10) {
            Serial.print('0');
        }
        Serial.print(buf[i], HEX);
    }
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 5000) {
        delay(10);
    }
    pinMode(LED_BUILTIN, OUTPUT);
    bool ok = radio_begin();
    Serial.print("bench_rx: radio=");
    Serial.print(ok ? "ok" : "FAIL");
    Serial.print(" freq=");
    Serial.print(LORA_FREQUENCY_MHZ);
    Serial.print(" modem=");
    Serial.print(LORA_MODEM_CONFIG1, HEX);
    Serial.print(',');
    Serial.print(LORA_MODEM_CONFIG2, HEX);
    Serial.print(',');
    Serial.print(LORA_MODEM_CONFIG3, HEX);
    Serial.println(" errata=applied");
}

void loop() {
    if (!g_rf95.available()) {
        return;
    }
    uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
    uint8_t len = sizeof(buf);
    if (g_rf95.recv(buf, &len)) {
        digitalWrite(LED_BUILTIN, HIGH);  // blink per frame; this board is not power-budgeted
        print_frame(buf, len);
        digitalWrite(LED_BUILTIN, LOW);
    } else {
        Serial.println("RX bad frame (CRC or header)");
    }
}
