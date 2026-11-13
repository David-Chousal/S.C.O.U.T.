/*
 * Shore station receiver — env feather_esp32s3_shore (SCO-24).
 *
 * Runs on the ESP32-S3 Feather (5477) with a LoRa Radio FeatherWing RFM95W (3231) stacked on
 * it, which IS the shore station (docs/engineering/shore-station.md). This is the receive half:
 * radio setup, validation, decode and dedupe. Since SCO-237 it also pushes each reading to the
 * console over WiFi on its own (shore_net.cpp, a separate FreeRTOS task), with no computer
 * attached. Every frame is still printed over USB, so the computer bridge (SCO-257) and the
 * buoy's SD card remain fallbacks.
 *
 * The radio setup is copied from the bench receiver (src/bench_rx/), and the modem settings
 * come from the buoy's own config.h, so the two ends cannot drift. At BW 500 kHz the receiver
 * needs the SX1276 errata §2.1 sensitivity fix (docs/hub/research/notes/sx1276-errata-500khz.md).
 *
 * Listening is always on: the station is mains-powered, so closing the radio outside the slots
 * would only lose frames (shore-station.md, 2026-10-16). Each frame is tagged with whether it
 * landed inside the ±2 min window around a slot, which checks the buoy's clock against the
 * table. The clock comes from NTP over WiFi; without WiFi the S3's internal clock keeps time
 * between syncs and across a reset, and firmware/tools/set_rtc.py sets it by hand over USB
 * (lib/scout_shore_clock). Only a power-on with no WiFi and no USB leaves it unset (win=unknown):
 * the S3 has no battery-backed clock.
 *
 * Daily transmit count (SCO-198). The station keeps the count requested for each buoy, read
 * from the console every minute over WiFi; "N<buoy>:<count>" over USB sets it without WiFi (the
 * next console read replaces it). The window tag uses
 * the slots of the count the frame itself reports (v4), else the requested count, so it checks
 * the buoy's clock against the slots that buoy is actually using. Every OK line ends with
 * tx=<reported>/<requested> and "pending" until they match. Listening itself stays always on:
 * the station is mains-powered, so no slot set closes the radio.
 *
 * With -DSCOUT_DOWNLINK (OFF by default) the station also SENDS: right after a buoy's packet,
 * if its reported count differs from the requested one, one signed SET_TX_COUNT frame
 * (lib/scout_downlink) in the buoy's 1 s listen window. ⚠️ Do not transmit off the bench until
 * the RFM95W FeatherWing's FCC authorization is checked (OTA design §8, SCO-104).
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
#include "scout_downlink.h"
#include "scout_packet.h"
#include "scout_scheduler.h"
#include "scout_timeset.h"
#include "shore_net.h"
#include "shore_wifi.h"
#ifdef SCOUT_DOWNLINK
#include "../downlink_key_select.h"
#endif
#ifdef SCOUT_OTA
#include "scout_ota.h"
#include "shore_ota.h"
#endif

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
#ifdef SCOUT_DOWNLINK
static uint32_t g_last_counter[SHORE_MAX_BUOY_ID + 1];
#endif
static char g_line[256];  // room for an FM line (232 hex digits), the longest USB command
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
#ifdef SCOUT_DOWNLINK
    g_rf95.setTxPower(LORA_TX_POWER_DBM, false);  // the same +11 dBm grant limit as the buoy
#endif
    g_rf95.setModeRx();
    return true;
}

/* One write per line, here and everywhere in shore_rx (never println, which writes the text and
 * the line ending separately): the network task prints from the other core, and a line split
 * across writes could be interleaved and stop the computer bridge from parsing it. */
static void print_rx_line(const uint8_t *buf, uint8_t len) {
    static const char HEX_DIGITS[] = "0123456789ABCDEF";
    char line[64 + 2 * RH_RF95_MAX_MESSAGE_LEN];
    int at = snprintf(line, sizeof(line), "RX len=%u rssi=%d snr=%d n=%lu hex=", len,
                      g_rf95.lastRssi(), g_rf95.lastSNR(), (unsigned long)g_frames);
    for (uint8_t i = 0; i < len && at + 3 < (int)sizeof(line); i++) {
        line[at++] = HEX_DIGITS[buf[i] >> 4];
        line[at++] = HEX_DIGITS[buf[i] & 0x0F];
    }
    line[at++] = '\n';
    line[at] = '\0';
    Serial.print(line);
}

static ScoutWanted wanted_for(uint16_t buoy_id) {
    ShoreLock lock;
    ScoutWanted none;
    memset(&none, 0, sizeof(none));
    return buoy_id <= SHORE_MAX_BUOY_ID ? g_shared.wanted[buoy_id] : none;
}

static bool clock_valid() {
    ShoreLock lock;
    return scout_clock_valid(&g_shared.clock);
}

/* "in" when now is within ±2 min of a slot of `settings` (count and phase), else "out". */
static const char *window_tag(const ScoutSettings &settings) {
    if (!clock_valid()) {
        return "unknown";
    }
    uint32_t slots[TX_SLOT_COUNT];
    size_t n = scout_settings_tx_slots(&settings, TX_SLOTS_SOD, slots);
    uint32_t now = (uint32_t)time(nullptr);
    return scout_in_listen_window(now, slots, n, LISTEN_HALF_WIDTH_S) ? "in" : "out";
}

#ifdef SCOUT_DOWNLINK
/* The key and a fresh counter for a command to `buoy_id`, or nullptr when it cannot be signed. */
static const uint8_t *command_key(uint16_t buoy_id, uint32_t *counter) {
    const uint8_t *key = scout_downlink_key(buoy_id);
    if (key == nullptr || !clock_valid()) {
        Serial.printf("CMD skipped buoy=%u reason=%s\n", buoy_id, key ? "clock" : "no-key");
        return nullptr;
    }
    uint32_t now = (uint32_t)time(nullptr);
    *counter = now > g_last_counter[buoy_id] ? now : g_last_counter[buoy_id] + 1u;
    g_last_counter[buoy_id] = *counter;
    return key;
}

static bool transmit(const uint8_t *frame, size_t len) {
    bool sent = g_rf95.send(frame, (uint8_t)len) && g_rf95.waitPacketSent(2000);
    g_rf95.setModeRx();
    return sent;
}

// Sent straight after the buoy's packet: it listens for 1 s after every send (OTA design §2).
static void send_tx_count(uint16_t buoy_id, uint8_t tx_count) {
    ScoutCommand cmd;
    const uint8_t *key = command_key(buoy_id, &cmd.counter);
    if (key == nullptr) {
        return;
    }
    cmd.buoy_id = buoy_id;
    cmd.setting = SCOUT_DL_SETTING_TX_COUNT;
    cmd.value = tx_count;
    uint8_t frame[SCOUT_DL_CMD_SIZE];
    scout_dl_encode(&cmd, key, frame);
    bool sent = transmit(frame, sizeof(frame));
    Serial.printf("CMD buoy=%u tx_count=%u counter=%lu sent=%s\n", buoy_id, tx_count,
                  (unsigned long)cmd.counter, sent ? "yes" : "no");
}

// The whole snapshot, for a v5 buoy whose digest differs from what is wanted.
static void send_settings(uint16_t buoy_id, const ScoutSettings &settings) {
    ScoutSettingsCommand cmd;
    const uint8_t *key = command_key(buoy_id, &cmd.counter);
    if (key == nullptr) {
        return;
    }
    cmd.buoy_id = buoy_id;
    cmd.settings = settings;
    uint8_t frame[SCOUT_DL_SETTINGS_SIZE];
    scout_dl_encode_settings(&cmd, key, frame);
    bool sent = transmit(frame, sizeof(frame));
    Serial.printf("CMD buoy=%u settings digest=%04x counter=%lu sent=%s\n", buoy_id,
                  scout_settings_digest(&settings), (unsigned long)cmd.counter, sent ? "yes" : "no");
}
#endif

#ifdef SCOUT_OTA
// The trial image of the armed job is running: confirm it, so it becomes the buoy's good image.
static void send_confirm(uint16_t buoy_id, uint32_t version) {
    uint32_t counter = 0;
    const uint8_t *key = command_key(buoy_id, &counter);
    if (key == nullptr) {
        return;
    }
    uint8_t frame[SCOUT_OTA_CONFIRM_SIZE];
    scout_ota_confirm_encode(buoy_id, counter, version, key, frame);
    bool sent = transmit(frame, sizeof(frame));
    Serial.printf("CONFIRM buoy=%u version=%06lx counter=%lu sent=%s\n", buoy_id, (unsigned long)version,
                  (unsigned long)counter, sent ? "yes" : "no");
}

// One frame fits a listen window. A trial CONFIRM goes before settings: a trial image rolls
// back after 3 slots without it, and a settings frame the buoy keeps refusing must not cause
// that. Settings go before an offer, which waits for a slot with nothing else to send.
static bool firmware_confirm_due(const ScoutReading &r) {
    if (shore_ota_step(r) != SCOUT_OTA_STEP_CONFIRM) {
        return false;
    }
    send_confirm(r.buoy_id, shore_ota_job_version());
    return true;
}

static void firmware_step(const ScoutReading &r) {
    scout_ota_step_t step = shore_ota_step(r);
    if (step == SCOUT_OTA_STEP_OFFER) {
        shore_ota_run_session(g_rf95, r.buoy_id);
    } else if (step == SCOUT_OTA_STEP_DONE || step == SCOUT_OTA_STEP_ABANDON) {
        shore_ota_finish(step);
    }
}
#endif

static void handle_frame(const uint8_t *buf, uint8_t len) {
    g_frames++;
    print_rx_line(buf, len);
    ScoutReading r;
    switch (scout_packet_decode(buf, len, &r)) {
        case SCOUT_DECODE_OK:
            break;
        case SCOUT_DECODE_BAD_LENGTH:
            Serial.print("BAD length\n");
            return;
        case SCOUT_DECODE_BAD_CRC:
            Serial.print("BAD crc\n");
            return;
        case SCOUT_DECODE_BAD_VERSION:
        default:
            Serial.printf("BAD version %u\n", buf[0]);
            return;
    }
    if (!scout_dedupe_first_seen(&g_seen, r.buoy_id, r.record_seq, r.timestamp)) {
        Serial.printf("DUP buoy=%u seq=%lu\n", r.buoy_id, (unsigned long)r.record_seq);
        return;
    }
    {
        ShoreLock lock;
        scout_upload_queue_push(&g_shared.queue, &r);  // the network task sends it on
    }
    uint8_t reported = scout_flags_tx_count(r.flags);
    ScoutWanted wanted = wanted_for(r.buoy_id);
    // A v5 buoy reports the digest of everything it runs; compare the whole snapshot. A v4 buoy
    // reports only its count, so only the count can be checked and sent.
    bool v5 = r.schema_version >= 5;
    uint16_t wanted_digest = wanted.has_settings ? scout_settings_digest(&wanted.settings) : 0;
    bool settings_pending = v5 && wanted.has_settings && r.settings_digest != wanted_digest;
    bool count_pending = !settings_pending && wanted.tx_count != 0 && reported != wanted.tx_count;
    // The schedule to tag against: the wanted snapshot once the buoy confirms it (its phase is
    // otherwise unknown here), else the defaults with the count the frame reports.
    ScoutSettings schedule;
    scout_settings_defaults(&schedule);
    if (v5 && wanted.has_settings && !settings_pending) {
        schedule = wanted.settings;
    } else if (reported) {
        schedule.v[SCOUT_SET_TX_COUNT - 1] = reported;
    }
    Serial.printf("OK buoy=%u seq=%lu ts=%lu temp_c_centi=%d batt_mv=%u flags=0x%04X win=%s "
                  "tx=%u/%u digest=%04x/%04x%s%s\n",
                  r.buoy_id, (unsigned long)r.record_seq, (unsigned long)r.timestamp,
                  r.temp_c_centi, r.battery_mv, r.flags, window_tag(schedule), reported,
                  wanted.tx_count, r.settings_digest, wanted_digest,
                  (settings_pending || count_pending) ? " pending" : "",
                  (r.flags & SCOUT_FLAG_CMD_REJECTED) ? " cmd_rejected" : "");
#ifdef SCOUT_DOWNLINK
#ifdef SCOUT_OTA
    if (firmware_confirm_due(r)) {
        return;
    }
#endif
    if (settings_pending) {
        send_settings(r.buoy_id, wanted.settings);
    } else if (count_pending) {
        send_tx_count(r.buoy_id, wanted.tx_count);
    }
#ifdef SCOUT_OTA
    else {
        firmware_step(r);
    }
#endif
#endif
}

/* Read "T<unix-epoch>", "N<buoy>:<count>" or "S<buoy>:<v1>,...,<v8>" from USB, one character per
 * call so the radio is never starved. */
static void poll_time_command() {
    while (Serial.available()) {
        char c = (char)Serial.read();
        if (c != '\n' && g_line_len < sizeof(g_line) - 1) {
            g_line[g_line_len++] = c;
            continue;
        }
        g_line[g_line_len] = '\0';
        g_line_len = 0;
        if (strcmp(g_line, "W") == 0) {
            shore_wifi_open_setup();
            Serial.print("wifi: opening the setup network for 10 min\n");
            continue;
        }
#ifdef SCOUT_OTA
        if (shore_ota_line(g_line)) {
            continue;
        }
#endif
        uint16_t buoy = 0;
        uint8_t count = 0;
        ScoutSettings settings;
        if (scout_dl_parse_set_command(g_line, &buoy, &count)) {
            if (buoy > SHORE_MAX_BUOY_ID) {
                Serial.printf("tx: ignored, buoy %u above %u\n", buoy, SHORE_MAX_BUOY_ID);
                continue;
            }
            {
                ShoreLock lock;
                g_shared.wanted[buoy].tx_count = count;
            }
            Serial.printf("tx: buoy=%u requested=%u\n", buoy, count);
            continue;
        }
        if (scout_dl_parse_settings_command(g_line, &buoy, &settings)) {
            if (buoy > SHORE_MAX_BUOY_ID) {
                Serial.printf("settings: ignored, buoy %u above %u\n", buoy, SHORE_MAX_BUOY_ID);
                continue;
            }
            {
                ShoreLock lock;
                g_shared.wanted[buoy].settings = settings;
                g_shared.wanted[buoy].has_settings = 1;
                g_shared.wanted[buoy].tx_count = (uint8_t)scout_setting(&settings, SCOUT_SET_TX_COUNT);
            }
            Serial.printf("settings: buoy=%u digest=%04x\n", buoy, scout_settings_digest(&settings));
            continue;
        }
        uint32_t epoch = 0;
        if (!scout_parse_time_command(g_line, MIN_VALID_EPOCH, &epoch)) {
            Serial.print("time: ignored, expected T<unix-epoch>, N<buoy>:<count>, S<buoy>:<settings> or W\n");
            continue;
        }
        struct timeval tv = {(time_t)epoch, 0};
        settimeofday(&tv, nullptr);
        {
            ShoreLock lock;
            scout_clock_set(&g_shared.clock, SCOUT_CLOCK_MANUAL, epoch);
        }
        Serial.printf("time: set to %lu\n", (unsigned long)epoch);
    }
}

static bool g_radio_ok = false;

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 5000) {
        delay(10);
    }
    shore_shared_begin((uint32_t)time(nullptr), MIN_VALID_EPOCH);
    scout_dedupe_init(&g_seen);
    g_radio_ok = radio_begin();
    // Errata SPI writes only run inside radio_begin() after init succeeds — do not claim
    // "errata=applied" when radio=FAIL (wrong CS/RST/IRQ jumpers are the usual first-boot cause).
    Serial.printf("shore_rx: radio=%s freq=%.1f modem=%X,%X,%X%s\n",
                  g_radio_ok ? "ok" : "FAIL", LORA_FREQUENCY_MHZ, LORA_MODEM_CONFIG1,
                  LORA_MODEM_CONFIG2, LORA_MODEM_CONFIG3,
                  g_radio_ok ? " errata=applied" : " (fix CS=10 RST=11 IRQ=9 jumpers)");
    if (clock_valid()) {
        Serial.printf("time: kept across the reset, now=%lu\n", (unsigned long)time(nullptr));
    } else {
        Serial.print("time: unset; WiFi sets it by NTP, or send T<unix-epoch> (UTC) now\n");
    }
    shore_net_begin();
}

void loop() {
    poll_time_command();
    if (!g_radio_ok) {
        // Broken SPI often makes available() look true forever and floods USB with
        // "RX bad frame" — keep USB usable for T/N/S/W/F* and WiFi setup instead.
        delay(100);
        return;
    }
    if (!g_rf95.available()) {
        delay(1);  // yield to FreeRTOS so the idle task can feed the task watchdog
        return;
    }
    uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
    uint8_t len = sizeof(buf);
    if (g_rf95.recv(buf, &len)) {
        handle_frame(buf, len);
    } else {
        Serial.print("RX bad frame (CRC or header)\n");
    }
}
