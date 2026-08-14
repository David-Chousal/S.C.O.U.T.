/*
 * SCOUT buoy firmware — duty-cycle state machine.
 *
 *   Sleep → Wake → Sense → Log → Battery check → Transmit (daily) → Sleep
 *
 * Platform: Adafruit Feather M0 + RFM95 (SAMD21), Arduino core (ADR-0001).
 * The packet encoder (lib/scout_packet) mirrors the shore decoder byte-for-byte; the
 * scheduling math (lib/scout_scheduler) is pure and unit-tested off-target.
 *
 * Standby sleep (ArduinoLowPower + PCF8523 INT wake) and the watchdog are implemented;
 * record_seq/last_tx are retained across resets in a no-init RAM section. The audio subsystem
 * and on-hardware driver verification remain Phase 1–2 bring-up (see notes inline).
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
    "turbidity_ntu,battery_v,uptime_s,audio_file,flags,soh,fw_version";

// Sequence counter and last-transmit time, kept in a NO-INIT RAM section that the C startup
// does not clear. They therefore survive a watchdog/system reset (the MCU stays powered), so
// record_seq stays monotonic and we don't re-send the daily packet after a reset. A magic
// guard tells real retained state from garbage on a cold power-on. This is RAM, so a full
// power loss still cold-starts — the PCF8523 has no user NVRAM to hold it, and we chose not
// to add SD/flash wear for the rarer power-loss case.
struct RetainedState {
    uint32_t magic;
    uint32_t record_seq;
    uint32_t last_tx_epoch;
};
static const uint32_t RETAINED_MAGIC = 0x5C002701u;
__attribute__((section(".noinit"))) static RetainedState g_state;

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
static uint8_t g_soh = 0;              // device State-of-Health bitfield, computed at boot

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
    if (flags & SCOUT_FLAG_POWER_CONSERVE) append_flag(buf, cap, first, "POWER_CONSERVE");
}

static void format_soh(uint8_t soh, char *buf, size_t cap) {
    buf[0] = '\0';
    bool first = true;
    if (soh & SCOUT_SOH_WATCHDOG_RESET) append_flag(buf, cap, first, "WATCHDOG_RESET");
    if (soh & SCOUT_SOH_RTC_UNSET) append_flag(buf, cap, first, "RTC_UNSET");
    if (soh & SCOUT_SOH_SD_INIT_FAIL) append_flag(buf, cap, first, "SD_INIT_FAIL");
    if (soh & SCOUT_SOH_LORA_INIT_FAIL) append_flag(buf, cap, first, "LORA_INIT_FAIL");
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

    // Restore the retained counter/last-TX across a reset; cold-start them if the magic is
    // absent (fresh power-on → the no-init RAM holds garbage).
    bool warm_start = (g_state.magic == RETAINED_MAGIC);
    if (!warm_start) {
        g_state.magic = RETAINED_MAGIC;
        g_state.record_seq = 0;
        g_state.last_tx_epoch = 0;
    }

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

    // Device State-of-Health snapshot (boot cause + subsystem init), sent in every packet/row.
    g_soh = 0;
    if (g_watchdog_reset) g_soh |= SCOUT_SOH_WATCHDOG_RESET;
    if (!g_rtc_ok || g_rtc.lostPower()) g_soh |= SCOUT_SOH_RTC_UNSET;
    if (!g_sd_ok) g_soh |= SCOUT_SOH_SD_INIT_FAIL;
    if (!g_lora_ok) g_soh |= SCOUT_SOH_LORA_INIT_FAIL;

    Serial.print("boot: watchdog_reset=");
    Serial.print(g_watchdog_reset ? "yes" : "no");
    Serial.print(" rtc=");
    Serial.print(g_rtc_ok ? "ok" : "FAIL");
    Serial.print(" sd=");
    Serial.print(g_sd_ok ? "ok" : "FAIL");
    Serial.print(" lora=");
    Serial.print(g_lora_ok ? "ok" : "FAIL");
    Serial.print(warm_start ? " start=warm resume_seq=" : " start=cold resume_seq=");
    Serial.println(g_state.record_seq);
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

    // 2. Sense. Read the battery first so the power mode can gate the rest (graceful
    //    degradation: NORMAL → CONSERVE → CRITICAL as the pack drains).
    uint16_t battery_mv = g_battery.readMillivolts();
    scout_power_mode_t mode = scout_power_mode(battery_mv, BATTERY_CONSERVE_MV, BATTERY_CRITICAL_MV);

    float temp_c = 0.0f;  // core signal — always sampled, even in CRITICAL
    if (!g_temp.read(temp_c)) {
        flags |= SCOUT_FLAG_TEMP_TIMEOUT;
    }

    bool turbidity_sampled = scout_sense_turbidity(mode);  // paused in CRITICAL
    uint16_t turbidity_adc = 0;
    float turbidity_v = 0.0f;
    if (turbidity_sampled) {
        turbidity_adc = g_turbidity.readAdc();
        turbidity_v = g_turbidity.readVolts();
    }

    // 3. Sensors off.
    digitalWrite(PIN_SENSOR_GATE, LOW);

    // 4. Audio: only when scheduled AND power allows (NORMAL only). PCM1808/hydrophone is a
    //    V1 stretch not on the confirmed build; this records the intent.
    bool audio_present =
        scout_should_record_audio(now, AUDIO_HOURS_UTC, sizeof(AUDIO_HOURS_UTC)) &&
        scout_sense_audio(mode);

    // 5. Power-mode flags, set before logging so the CSV row captures them.
    if (mode == SCOUT_POWER_CRITICAL) {
        flags |= SCOUT_FLAG_BATT_LOW_SKIP_TX;
    } else if (mode == SCOUT_POWER_CONSERVE) {
        flags |= SCOUT_FLAG_POWER_CONSERVE;
    }

    g_state.record_seq++;

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

    char flag_str[80];
    format_flags(flags, flag_str, sizeof(flag_str));
    char soh_str[80];
    format_soh(g_soh, soh_str, sizeof(soh_str));

    // Turbidity columns are blank when the sensor was paused for power (CRITICAL mode).
    char turb_adc_s[8] = "";
    char turb_v_s[12] = "";
    if (turbidity_sampled) {
        snprintf(turb_adc_s, sizeof(turb_adc_s), "%u", turbidity_adc);
        snprintf(turb_v_s, sizeof(turb_v_s), "%.3f", turbidity_v);
    }

    char line[224];
    snprintf(line, sizeof(line),
             "%u,SCOUT-%02u,%s,%lu,%.2f,%s,%s,,%.2f,%lu,%s,%s,%s,v%d.%d.%d",
             SCOUT_PACKET_VERSION, (unsigned)BUOY_ID, timestamp, (unsigned long)g_state.record_seq,
             temp_c, turb_adc_s, turb_v_s, battery_mv / 1000.0f,
             (unsigned long)(g_state.record_seq * SAMPLE_INTERVAL_S), audio_file, flag_str, soh_str,
             FW_MAJOR, FW_MINOR, FW_PATCH);

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

    // 7. Transmit — throttled by power mode (base period in NORMAL, ×factor in CONSERVE),
    //    and never in CRITICAL. The power-mode flags were set in step 5.
    uint32_t tx_period = scout_transmit_period_s(mode, TRANSMIT_PERIOD_S, TRANSMIT_CONSERVE_FACTOR);
    if (mode != SCOUT_POWER_CRITICAL && g_lora_ok &&
        scout_is_transmit_cycle(now, g_state.last_tx_epoch, tx_period)) {
        ScoutReading r;
        r.schema_version = SCOUT_PACKET_VERSION;
        r.buoy_id = BUOY_ID;
        r.timestamp = now;
        r.record_seq = g_state.record_seq;
        r.temp_c_centi = scout_temp_centi(temp_c);
        r.turbidity_adc = turbidity_adc;
        r.battery_mv = battery_mv;
        r.uptime_s = g_state.record_seq * SAMPLE_INTERVAL_S;
        r.flags = flags;
        r.soh = g_soh;
        r.audio_present = audio_present ? 1 : 0;
        r.fw_major = FW_MAJOR;
        r.fw_minor = FW_MINOR;
        r.fw_patch = FW_PATCH;

        uint8_t packet[SCOUT_PACKET_SIZE];
        size_t n = scout_packet_encode(&r, packet);
        if (g_lora.send(packet, (uint8_t)n)) {
            g_state.last_tx_epoch = now;
        }
    }

    const char *mode_str = mode == SCOUT_POWER_NORMAL ? "NORMAL"
                           : mode == SCOUT_POWER_CONSERVE ? "CONSERVE"
                                                          : "CRITICAL";
    Serial.print("seq=");
    Serial.print(g_state.record_seq);
    Serial.print(" mode=");
    Serial.print(mode_str);
    Serial.print(" flags=");
    Serial.print(flag_str[0] ? flag_str : "-");
    Serial.print(" soh=");
    Serial.println(soh_str[0] ? soh_str : "-");

    // 8. Back to sleep until the next scheduled wake.
    enter_deep_sleep();
}
