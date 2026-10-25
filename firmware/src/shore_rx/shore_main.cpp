/*
 * Shore station receiver — env feather_esp32s3_shore (SCO-24).
 *
 * Runs on the ESP32-S3 Feather (5477) with a LoRa Radio FeatherWing RFM95W (3231) stacked on
 * it, which IS the shore station (docs/engineering/shore-station.md). This is the receive half:
 * radio setup, validation, decode and dedupe. The WiFi push to the dashboard is not written
 * yet; it waits on which back end receives it (SCO-120).
 *
 * The radio setup is copied from the bench receiver (src/bench_rx/), and the modem settings
 * come from the buoy's own config.h, so the two ends cannot drift. At BW 500 kHz the receiver
 * needs the SX1276 errata §2.1 sensitivity fix (docs/hub/research/notes/sx1276-errata-500khz.md).
 *
 * Listening is always on: the station is mains-powered, so closing the radio outside the slots
 * would only lose frames (shore-station.md, 2026-10-16). Each frame is tagged with whether it
 * landed inside the ±2 min window around a slot, which checks the buoy's clock against the
 * table. The S3 has no RTC: run firmware/tools/set_rtc.py and press RESET (same prompt and
 * replies as the buoy, any time after boot) until NTP over WiFi exists; before that the tag
 * reads win=unknown.
 *
 * Output, two lines per frame. The first is the bench_rx format, so
 * shore/scripts/decode_frames.py still reads it:
 *   RX len=30 rssi=-41 snr=9 n=3 hex=0201...
 *   OK buoy=1 seq=42 ts=1803859200 temp_c_centi=2644 batt_mv=3280 flags=0x0009 win=in
 * or "DUP buoy=1 seq=42", or "BAD crc" / "BAD length" / "BAD version".
 */
#include <Arduino.h>
#include <RH_RF95.h>
#include <sys/time.h>

#include "../config.h"
#include "scout_dedupe.h"
#include "scout_packet.h"
#include "scout_scheduler.h"
#include "scout_timeset.h"

/* FeatherWing jumper pads → S3 Feather pins. ⚠️ PROVISIONAL: the FeatherWing has no default
 * wiring; these three pads must be soldered to match, and confirmed with ECE (Isabella). */
#define PIN_SHORE_RFM95_CS 10
#define PIN_SHORE_RFM95_RST 11
#define PIN_SHORE_RFM95_INT 9

static const uint32_t LISTEN_HALF_WIDTH_S = 120;  // ±2 min around each slot (SCO-165)

static const uint8_t REG_HIGH_BW_OPTIMIZE_1 = 0x36;
static const uint8_t REG_HIGH_BW_OPTIMIZE_2 = 0x3A;
static const uint8_t HIGH_BW_OPTIMIZE_1_AT_500K = 0x02;
static const uint8_t HIGH_BW_OPTIMIZE_2_AT_500K = 0x64;

static RH_RF95 g_rf95(PIN_SHORE_RFM95_CS, PIN_SHORE_RFM95_INT);
static ScoutDedupe g_seen;
static uint32_t g_frames = 0;
static bool g_clock_set = false;
static char g_line[24];
static size_t g_line_len = 0;

static bool radio_begin() {
    pinMode(PIN_SHORE_RFM95_RST, OUTPUT);
    digitalWrite(PIN_SHORE_RFM95_RST, LOW);
    delay(10);
    digitalWrite(PIN_SHORE_RFM95_RST, HIGH);
    delay(10);
    if (!g_rf95.init() || !g_rf95.setFrequency(LORA_FREQUENCY_MHZ)) {
        return false;
    }
    const RH_RF95::ModemConfig cfg = {LORA_MODEM_CONFIG1, LORA_MODEM_CONFIG2, LORA_MODEM_CONFIG3};
    g_rf95.setModemRegisters(&cfg);
    g_rf95.spiWrite(REG_HIGH_BW_OPTIMIZE_1, HIGH_BW_OPTIMIZE_1_AT_500K);
    g_rf95.spiWrite(REG_HIGH_BW_OPTIMIZE_2, HIGH_BW_OPTIMIZE_2_AT_500K);
    g_rf95.setPromiscuous(true);  // accept every frame regardless of RadioHead addressing
    g_rf95.setModeRx();
    return true;
}

static void print_rx_line(const uint8_t *buf, uint8_t len) {
    Serial.printf("RX len=%u rssi=%d snr=%d n=%lu hex=", len, g_rf95.lastRssi(),
                  g_rf95.lastSNR(), (unsigned long)g_frames);
    for (uint8_t i = 0; i < len; i++) {
        Serial.printf("%02X", buf[i]);
    }
    Serial.println();
}

static const char *window_tag() {
    if (!g_clock_set) {
        return "unknown";
    }
    uint32_t now = (uint32_t)time(nullptr);
    return scout_in_listen_window(now, TX_SLOTS_SOD, TX_SLOT_COUNT, LISTEN_HALF_WIDTH_S) ? "in"
                                                                                         : "out";
}

static void handle_frame(const uint8_t *buf, uint8_t len) {
    g_frames++;
    print_rx_line(buf, len);
    ScoutReading r;
    switch (scout_packet_decode(buf, len, &r)) {
        case SCOUT_DECODE_OK:
            break;
        case SCOUT_DECODE_BAD_LENGTH:
            Serial.println("BAD length");
            return;
        case SCOUT_DECODE_BAD_CRC:
            Serial.println("BAD crc");
            return;
        case SCOUT_DECODE_BAD_VERSION:
        default:
            Serial.printf("BAD version %u\n", buf[0]);
            return;
    }
    if (!scout_dedupe_first_seen(&g_seen, r.buoy_id, r.record_seq)) {
        Serial.printf("DUP buoy=%u seq=%lu\n", r.buoy_id, (unsigned long)r.record_seq);
        return;
    }
    Serial.printf("OK buoy=%u seq=%lu ts=%lu temp_c_centi=%d batt_mv=%u flags=0x%04X win=%s\n",
                  r.buoy_id, (unsigned long)r.record_seq, (unsigned long)r.timestamp,
                  r.temp_c_centi, r.battery_mv, r.flags, window_tag());
}

/* Read "T<unix-epoch>" from USB, one character per call so the radio is never starved. */
static void poll_time_command() {
    while (Serial.available()) {
        char c = (char)Serial.read();
        if (c != '\n' && g_line_len < sizeof(g_line) - 1) {
            g_line[g_line_len++] = c;
            continue;
        }
        g_line[g_line_len] = '\0';
        g_line_len = 0;
        uint32_t epoch = 0;
        if (!scout_parse_time_command(g_line, MIN_VALID_EPOCH, &epoch)) {
            Serial.println("time: ignored, expected T<unix-epoch>");
            continue;
        }
        struct timeval tv = {(time_t)epoch, 0};
        settimeofday(&tv, nullptr);
        g_clock_set = true;
        Serial.printf("time: set to %lu\n", (unsigned long)epoch);
    }
}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 5000) {
        delay(10);
    }
    scout_dedupe_init(&g_seen);
    bool ok = radio_begin();
    Serial.printf("shore_rx: radio=%s freq=%.1f modem=%X,%X,%X errata=applied\n",
                  ok ? "ok" : "FAIL", LORA_FREQUENCY_MHZ, LORA_MODEM_CONFIG1, LORA_MODEM_CONFIG2,
                  LORA_MODEM_CONFIG3);
    Serial.println("time: send T<unix-epoch> (UTC) now to set the clock");
}

void loop() {
    poll_time_command();
    if (!g_rf95.available()) {
        delay(1);  // yield to FreeRTOS so the idle task can feed the task watchdog
        return;
    }
    uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
    uint8_t len = sizeof(buf);
    if (g_rf95.recv(buf, &len)) {
        handle_frame(buf, len);
    } else {
        Serial.println("RX bad frame (CRC or header)");
    }
}
