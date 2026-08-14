/*
 * SCOUT buoy firmware — duty-cycle state machine.
 *
 *   Sleep → Wake → Sense → Log → Battery check → Transmit (daily) → Sleep
 *
 * Platform: Adafruit Feather M0 + RFM95 (SAMD21), Arduino core (ADR-0001).
 * The packet encoder (lib/scout_packet) mirrors the shore decoder byte-for-byte; the
 * scheduling math (lib/scout_scheduler) is pure and unit-tested off-target.
 *
 * Scaffold status: sensor/SD/LoRa/RTC paths are wired to their drivers; the audio subsystem
 * and true SAMD21 standby sleep are marked TODO for Phase 1–2 bring-up (see notes inline).
 */
#include <Adafruit_SleepyDog.h>
#include <Arduino.h>
#include <ArduinoLowPower.h>

#include "config.h"
#include "drivers/battery.h"
#include "drivers/lora_link.h"
#include "drivers/rtc.h"
#include "drivers/sd_logger.h"
#include "drivers/temperature.h"
#include "drivers/turbidity.h"
#include "scout_packet.h"
#include "scout_scheduler.h"

static const char *CSV_HEADER =
    "schema_version,buoy_id,timestamp_utc,record_seq,temp_c,turbidity_adc,turbidity_v,"
    "turbidity_ntu,battery_v,uptime_s,audio_file,flags,fw_version";

// Persisted across sleep cycles (SAMD21 standby retains RAM). Reset only on hard power loss.
static uint32_t g_record_seq = 0;
static uint32_t g_last_tx_epoch = 0;

static TemperatureSensor g_temp;
static TurbiditySensor g_turbidity;
static Battery g_battery;
static Rtc g_rtc;
static SdLogger g_sd;
static LoraLink g_lora;
static bool g_rtc_ok = false;
static bool g_sd_ok = false;
static bool g_lora_ok = false;
static bool g_watchdog_reset = false;  // set if the last reset was the watchdog firing

// ── flag-name formatting (matches the data-schema flags vocabulary) ──────────
static void append_flag(char *buf, size_t cap, bool &first, const char *name) {
    size_t len = strlen(buf);
    int written = snprintf(buf + len, cap - len, "%s%s", first ? "" : "|", name);
    if (written > 0) {
        first = false;
    }
}

static void format_flags(uint16_t flags, char *buf, size_t cap) {
    buf[0] = '\0';
    bool first = true;
    if (flags & SCOUT_FLAG_SD_RETRY) append_flag(buf, cap, first, "SD_RETRY");
    if (flags & SCOUT_FLAG_TEMP_TIMEOUT) append_flag(buf, cap, first, "TEMP_TIMEOUT");
    if (flags & SCOUT_FLAG_TURBIDITY_RANGE) append_flag(buf, cap, first, "TURBIDITY_RANGE");
    if (flags & SCOUT_FLAG_BATT_LOW_SKIP_TX) append_flag(buf, cap, first, "BATT_LOW_SKIP_TX");
    if (flags & SCOUT_FLAG_RTC_LOST) append_flag(buf, cap, first, "RTC_LOST");
}

// Wake ISR — the work happens back in loop() after deepSleep() returns; this just needs to
// exist for the wake source. Keep it trivial (no I2C/Serial from interrupt context).
static void on_rtc_wake() {}

static void enter_deep_sleep() {
    // The watchdog must be OFF during the 30-min standby, or it would reset us mid-sleep — its
    // max timeout (~16 s) is far shorter than the sample interval. It's re-armed at loop start.
    Watchdog.disable();
    g_lora.sleep();
    Serial.flush();
    // SAMD21 standby (~microamps) until the PCF8523 countdown-timer INT pulls PIN_RTC_INT low.
    // NOTE: USB/Serial drops during standby — expected in deployment; use the RTC cadence, not
    // the USB monitor, to confirm wake timing on the bench.
    LowPower.deepSleep();
    // Woke: release the timer flag so INT1 deasserts and the next interval can trigger.
    g_rtc.ackTimer();
}

void setup() {
    Serial.begin(115200);

    // Did the watchdog just reset us? (SAMD21 Power Manager reset-cause register.) Useful for
    // State-of-Health — a recurring watchdog reset means a cycle is hanging.
    g_watchdog_reset = PM->RCAUSE.bit.WDT;

    // Guard initialization too — a hung driver init shouldn't brick the buoy. loop() re-arms
    // it each cycle and disables it before the long standby sleep.
    Watchdog.enable(WDT_TIMEOUT_MS);

    pinMode(PIN_SENSOR_GATE, OUTPUT);
    digitalWrite(PIN_SENSOR_GATE, LOW);

    g_battery.begin();
    g_temp.begin();
    g_turbidity.begin();

    g_rtc_ok = g_rtc.begin();
    uint16_t startup_flags = 0;
    if (!g_rtc_ok || g_rtc.lostPower()) {
        startup_flags |= SCOUT_FLAG_RTC_LOST;
    }
    if (g_rtc_ok) {
        g_rtc.enablePeriodicWake(SAMPLE_INTERVAL_MIN);
        // PCF8523 INT1 is open-drain, active-low → pull-up, wake on the falling edge.
        pinMode(PIN_RTC_INT, INPUT_PULLUP);
        LowPower.attachInterruptWakeup(PIN_RTC_INT, on_rtc_wake, FALLING);
        g_rtc.ackTimer();  // start from a clean flag
    }
    g_sd_ok = g_sd.begin();
    g_lora_ok = g_lora.begin();

    Serial.print("boot: watchdog_reset=");
    Serial.print(g_watchdog_reset ? "yes" : "no");
    Serial.print(" rtc=");
    Serial.print(g_rtc_ok ? "ok" : "FAIL");
    Serial.print(" sd=");
    Serial.print(g_sd_ok ? "ok" : "FAIL");
    Serial.print(" lora=");
    Serial.println(g_lora_ok ? "ok" : "FAIL");
    (void)startup_flags;  // folded into the first record below
}

void loop() {
    // Re-arm the watchdog for this cycle (it was disabled for the standby sleep). If any step
    // below hangs past WDT_TIMEOUT_MS, the buoy resets and recovers on its own.
    Watchdog.enable(WDT_TIMEOUT_MS);

    uint16_t flags = 0;
    uint32_t now = g_rtc_ok ? g_rtc.nowEpoch() : 0;
    if (!g_rtc_ok) {
        flags |= SCOUT_FLAG_RTC_LOST;
    }

    // 1. Power the switched sensor rail and let it settle.
    digitalWrite(PIN_SENSOR_GATE, HIGH);
    delay(SENSOR_WARMUP_MS);

    // 2. Sense.
    float temp_c = 0.0f;
    if (!g_temp.read(temp_c)) {
        flags |= SCOUT_FLAG_TEMP_TIMEOUT;
    }
    uint16_t turbidity_adc = g_turbidity.readAdc();
    float turbidity_v = g_turbidity.readVolts();
    uint16_t battery_mv = g_battery.readMillivolts();

    // 3. Sensors off.
    digitalWrite(PIN_SENSOR_GATE, LOW);

    // 4. Audio (scheduled 3×/day). TODO(Phase 1+): the PCM1808/hydrophone path is a V1 stretch
    //    and not on the confirmed Feather build; record the intent only.
    bool audio_present = scout_should_record_audio(now, AUDIO_HOURS_UTC, sizeof(AUDIO_HOURS_UTC));

    // 5. Battery gate.
    bool battery_ok = scout_battery_ok(battery_mv, BATTERY_SKIP_TX_MV);

    g_record_seq++;

    // 6. Log a CSV row (data-schema.md). Retry once on SD failure.
    char timestamp[24];
    if (g_rtc_ok) {
        DateTime dt((uint32_t)now);
        snprintf(timestamp, sizeof(timestamp), "%04u-%02u-%02uT%02u:%02u:%02uZ", dt.year(),
                 dt.month(), dt.day(), dt.hour(), dt.minute(), dt.second());
    } else {
        snprintf(timestamp, sizeof(timestamp), "1970-01-01T00:00:00Z");
    }
    char audio_file[20] = "";
    if (audio_present) {
        snprintf(audio_file, sizeof(audio_file), "%02u%02u%02uZ.wav",
                 (unsigned)((now % 86400) / 3600), (unsigned)((now % 3600) / 60), 0u);
    }

    char line[192];
    snprintf(line, sizeof(line),
             "%u,SCOUT-%02u,%s,%lu,%.2f,%u,%.3f,,%.2f,%lu,%s,,v%d.%d.%d",
             SCOUT_PACKET_VERSION, (unsigned)BUOY_ID, timestamp, (unsigned long)g_record_seq,
             temp_c, turbidity_adc, turbidity_v, battery_mv / 1000.0f,
             (unsigned long)(g_record_seq * SAMPLE_INTERVAL_S), audio_file, FW_MAJOR, FW_MINOR,
             FW_PATCH);

    if (g_sd_ok) {
        char date_ymd[9];
        if (g_rtc_ok) {
            DateTime dt((uint32_t)now);
            snprintf(date_ymd, sizeof(date_ymd), "%04u%02u%02u", dt.year(), dt.month(), dt.day());
        } else {
            snprintf(date_ymd, sizeof(date_ymd), "19700101");
        }
        if (!g_sd.appendLine(date_ymd, CSV_HEADER, line)) {
            flags |= SCOUT_FLAG_SD_RETRY;
            g_sd.appendLine(date_ymd, CSV_HEADER, line);  // one retry
        }
    }

    // Pet the watchdog before the slowest step (LoRa TX blocks up to ~2 s).
    Watchdog.reset();

    // 7. Transmit the summarized packet once per day, if the battery allows.
    if (!battery_ok) {
        flags |= SCOUT_FLAG_BATT_LOW_SKIP_TX;
    } else if (g_lora_ok && scout_is_transmit_cycle(now, g_last_tx_epoch, TRANSMIT_PERIOD_S)) {
        ScoutReading r;
        r.schema_version = SCOUT_PACKET_VERSION;
        r.buoy_id = BUOY_ID;
        r.timestamp = now;
        r.record_seq = g_record_seq;
        r.temp_c_centi = scout_temp_centi(temp_c);
        r.turbidity_adc = turbidity_adc;
        r.battery_mv = battery_mv;
        r.uptime_s = g_record_seq * SAMPLE_INTERVAL_S;
        r.flags = flags;
        r.audio_present = audio_present ? 1 : 0;
        r.fw_major = FW_MAJOR;
        r.fw_minor = FW_MINOR;
        r.fw_patch = FW_PATCH;

        uint8_t packet[SCOUT_PACKET_SIZE];
        size_t n = scout_packet_encode(&r, packet);
        if (g_lora.send(packet, (uint8_t)n)) {
            g_last_tx_epoch = now;
        }
    }

    char flag_str[80];
    format_flags(flags, flag_str, sizeof(flag_str));
    Serial.print("seq=");
    Serial.print(g_record_seq);
    Serial.print(" flags=");
    Serial.println(flag_str[0] ? flag_str : "-");

    // 8. Back to sleep until the next scheduled wake.
    enter_deep_sleep();
}
