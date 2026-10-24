/*
 * SCOUT buoy firmware — duty-cycle state machine.
 *
 *   Sleep → Wake → { Sample → Log  at :00/:30  |  Transmit last reading  in a fixed slot } → Sleep
 *
 * Platform: Adafruit Feather M0 + RFM95 (SAMD21), Arduino core (ADR-0001).
 * The packet encoder (lib/scout_packet) mirrors the shore decoder byte-for-byte; the
 * scheduling math (lib/scout_scheduler) is pure and unit-tested off-target.
 *
 * Standby sleep wakes on the SAMD21 RTC (ArduinoLowPower), timed against the PCF8523 wall clock
 * (SCO-165/SCO-196); the watchdog is implemented; record_seq is retained across resets in a
 * no-init RAM section. The audio subsystem
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
#include "drivers/sht40.h"
#include "drivers/temperature.h"
#include "drivers/turbidity.h"
#include "scout_link.h"
#include "scout_packet.h"
#include "scout_scheduler.h"
#include "scout_sht4x.h"
#include "scout_timeset.h"

static const char *CSV_HEADER =
    "schema_version,buoy_id,timestamp_utc,record_seq,temp_c,turbidity_adc,turbidity_v,"
    "turbidity_fau,battery_v,uptime_s,audio_file,flags,soh,fw_version,internal_temp_c,"
    "internal_humidity_pct";

// Sequence counter, kept in a NO-INIT RAM section that the C startup does not clear. It
// therefore survives a watchdog/system reset (the MCU stays powered), so record_seq stays
// monotonic. Transmits only happen in fixed slots, so a reset can't cause a re-send. A magic
// guard tells real retained state from garbage on a cold power-on. This is RAM, so a full
// power loss still cold-starts — the PCF8523 has no user NVRAM to hold it, and we chose not
// to add SD/flash wear for the rarer power-loss case.
struct RetainedState {
    uint32_t magic;
    uint32_t record_seq;
};
static const uint32_t RETAINED_MAGIC = 0x5C002702u;  // bumped when the layout changes
__attribute__((section(".noinit"))) static RetainedState g_state;

static TemperatureSensor g_temp;
static TurbiditySensor g_turbidity;
static HousingSensor g_housing;
static Battery g_battery;
static ScoutRtc g_rtc;
static SdLogger g_sd;
static LoraLink g_lora;
static bool g_rtc_ok = false;
static bool g_sd_ok = false;
static bool g_lora_ok = false;
static bool g_watchdog_reset = false;  // set if the last reset was the watchdog firing
static uint8_t g_soh = 0;              // device State-of-Health bitfield, computed at boot

// The latest sample, held for the next transmit slot. Slots sit 10 min after a sample, so the
// packet carries a fresh reading without a sensor read ever overlapping the radio (SCO-165).
static ScoutReading g_last_reading;
static bool g_have_reading = false;
static scout_power_mode_t g_last_mode = SCOUT_POWER_NORMAL;
static bool g_first_cycle = true;  // sample immediately after boot, before the first sleep
static uint32_t g_next_event = 0;

// Fallback clock for when the PCF8523 is unusable: advanced by hand across each sleep, since
// millis() stops in standby. Coarse, but it keeps the sample/slot rhythm going instead of
// stalling the buoy.
static uint32_t g_fallback_epoch = 0;
static uint32_t g_fallback_ms = 0;

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
    if (flags & SCOUT_FLAG_HUMIDITY_HIGH) append_flag(buf, cap, first, "HUMIDITY_HIGH");
    if (flags & SCOUT_FLAG_HUMIDITY_FAIL) append_flag(buf, cap, first, "HUMIDITY_FAIL");
}

static void format_soh(uint8_t soh, char *buf, size_t cap) {
    buf[0] = '\0';
    bool first = true;
    if (soh & SCOUT_SOH_WATCHDOG_RESET) append_flag(buf, cap, first, "WATCHDOG_RESET");
    if (soh & SCOUT_SOH_RTC_UNSET) append_flag(buf, cap, first, "RTC_UNSET");
    if (soh & SCOUT_SOH_SD_INIT_FAIL) append_flag(buf, cap, first, "SD_INIT_FAIL");
    if (soh & SCOUT_SOH_LORA_INIT_FAIL) append_flag(buf, cap, first, "LORA_INIT_FAIL");
}

static uint32_t clock_now() {
    if (g_rtc_ok) {
        return g_rtc.nowEpoch();
    }
    return g_fallback_epoch + (millis() - g_fallback_ms) / 1000u;
}

static void sensor_gates_off() {
    digitalWrite(PIN_SENSOR_GATE, SENSOR_OFF);
    digitalWrite(PIN_AUDIO_GATE, SENSOR_OFF);
}

static void sleep_seconds(uint32_t seconds) {
    uint32_t before = clock_now();
    // The watchdog must be OFF during standby, or it would reset us mid-sleep — its max
    // timeout (~16 s) is far shorter than the sample interval. loop() re-arms it on wake.
    Watchdog.disable();
    g_lora.sleep();
    Serial.flush();
    // SAMD21 standby (~microamps) until its RTC alarm fires. The alarm has 1 s resolution, so
    // callers always pass whole seconds ≥ 1 (an alarm on the current second may never match).
    // NOTE: USB/Serial drops during standby — expected in deployment; use the timestamps, not
    // the USB monitor, to confirm wake timing on the bench.
    LowPower.deepSleep(seconds * 1000u);
    if (!g_rtc_ok) {
        g_fallback_epoch = before + seconds;
        g_fallback_ms = millis();
    }
}

// Sleep until `target`, re-reading the clock after every wake: the SAMD21 RTC times only the
// current interval, so its drift never accumulates, and a wake that lands up to a second
// early just sleeps the remainder. Returns the event time actually reached.
static uint32_t sleep_until(uint32_t target) {
    for (;;) {
        uint32_t now = clock_now();
        if (now >= target) {
            return target;
        }
        if (target - now > SAMPLE_INTERVAL_S) {
            // No event is ever further away than one sample interval, so the clock moved
            // backwards (PCF8523 reset or re-set): re-plan from the new time.
            target = scout_next_event_epoch(now, SAMPLE_INTERVAL_S, TX_SLOTS_SOD, TX_SLOT_COUNT);
        }
        sleep_seconds(target - now);
    }
}

// Bench clock set (SCO-201). Nothing else gives the buoy the real time, and the transmit slots
// are UTC times of day. Waits briefly for a USB host; on battery none appears and this returns
// after the window. firmware/tools/set_rtc.py sends the command.
static bool read_line(char *line, size_t cap, uint32_t deadline_ms) {
    size_t len = 0;
    while ((int32_t)(deadline_ms - millis()) > 0) {
        if (!Serial.available()) {
            delay(10);
            continue;
        }
        char c = (char)Serial.read();
        if (c == '\n' || len + 1 >= cap) {
            line[len] = '\0';
            return true;
        }
        line[len++] = c;
    }
    return false;
}

static void accept_time_command() {
    uint32_t deadline = millis() + TIME_SET_WINDOW_MS;
    while (!Serial && (int32_t)(deadline - millis()) > 0) {
        delay(10);
    }
    if (!Serial || !g_rtc_ok) {
        return;
    }
    Serial.println("time: send T<unix-epoch> (UTC) now to set the clock");
    char line[24];
    while (read_line(line, sizeof(line), deadline)) {
        uint32_t epoch = 0;
        if (scout_parse_time_command(line, MIN_VALID_EPOCH, &epoch)) {
            g_rtc.setTime(epoch);
            Serial.print("time: set to ");
            Serial.println(epoch);
            return;
        }
        Serial.println("time: ignored, expected T<unix-epoch>");
    }
}

void setup() {
    Serial.begin(115200);

    // Did the watchdog just reset us? (SAMD21 Power Manager reset-cause register.) Useful for
    // State-of-Health — a recurring watchdog reset means a cycle is hanging.
    // Read via the mask, not `RCAUSE.bit.WDT`: CMSIS defines `WDT` as a peripheral-pointer
    // macro, so the bitfield name is macro-expanded and the target build fails to compile.
    g_watchdog_reset = (PM->RCAUSE.reg & PM_RCAUSE_WDT) != 0;

    // Restore the retained counter/last-TX across a reset; cold-start them if the magic is
    // absent (fresh power-on → the no-init RAM holds garbage).
    bool warm_start = (g_state.magic == RETAINED_MAGIC);
    if (!warm_start) {
        g_state.magic = RETAINED_MAGIC;
        g_state.record_seq = 0;
    }

    // Guard initialization too — a hung driver init shouldn't brick the buoy. loop() re-arms
    // it each cycle and disables it before the long standby sleep.
    Watchdog.enable(WDT_TIMEOUT_MS);

    // Latch OFF before switching to output, so the gate never drives LOW for an instant and
    // briefly powers the sensors (the output register resets to 0).
    digitalWrite(PIN_SENSOR_GATE, SENSOR_OFF);
    pinMode(PIN_SENSOR_GATE, OUTPUT);
    digitalWrite(PIN_AUDIO_GATE, SENSOR_OFF);
    pinMode(PIN_AUDIO_GATE, OUTPUT);
    pinMode(LED_BUILTIN, OUTPUT);  // D13 LED off — it would draw more than the sleep floor
    digitalWrite(LED_BUILTIN, LOW);

    g_battery.begin();
    g_temp.begin();
    g_turbidity.begin();
    g_housing.begin();  // a missing sensor shows up as HUMIDITY_FAIL on every row

    g_rtc_ok = g_rtc.begin();
    accept_time_command();
    uint16_t startup_flags = 0;
    if (!g_rtc_ok || g_rtc.lostPower()) {
        startup_flags |= SCOUT_FLAG_RTC_LOST;
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
    if (TX_EVERY_SAMPLE) {
        Serial.println("WARNING: bench build, samples and transmits every minute; do not deploy");
    }
    (void)startup_flags;  // folded into the first record below
}

// Housing humidity/temperature (SCO-205). Read every cycle in every power mode: it is the
// early warning that the housing is taking on water, and costs ~10 ms. Fills the two CSV
// fields (blank on a failed read) and sets HUMIDITY_HIGH or HUMIDITY_FAIL.
static void read_housing(uint16_t &flags, char *temp_s, size_t temp_cap, char *rh_s,
                         size_t rh_cap) {
    temp_s[0] = '\0';
    rh_s[0] = '\0';
    float temp_c = 0.0f;
    float rh_pct = 0.0f;
    if (!g_housing.read(temp_c, rh_pct)) {
        flags |= SCOUT_FLAG_HUMIDITY_FAIL;
        return;
    }
    if (scout_humidity_high(rh_pct, HUMIDITY_ALERT_RH_PCT)) {
        flags |= SCOUT_FLAG_HUMIDITY_HIGH;
    }
    snprintf(temp_s, temp_cap, "%.2f", temp_c);
    snprintf(rh_s, rh_cap, "%.1f", rh_pct);
}

// Sample every sensor the power mode allows, log the row, and keep it for the next slot.
static void sample_and_log() {
    uint16_t flags = 0;
    uint32_t now = clock_now();
    if (!g_rtc_ok) {
        flags |= SCOUT_FLAG_RTC_LOST;
    }

    // 1. Power the switched sensor rail and let it settle.
    digitalWrite(PIN_SENSOR_GATE, SENSOR_ON);
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
    digitalWrite(PIN_SENSOR_GATE, SENSOR_OFF);

    char housing_temp_s[12];
    char housing_rh_s[12];
    read_housing(flags, housing_temp_s, sizeof(housing_temp_s), housing_rh_s,
                 sizeof(housing_rh_s));

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
    // Relative to /AUDIO/, one folder per UTC day so the names stay FAT 8.3-safe (SCO-202).
    char audio_file[32] = "";
    if (audio_present) {
        DateTime dt((uint32_t)now);
        snprintf(audio_file, sizeof(audio_file), "%04u%02u%02u/%02u%02u%02uZ.WAV", dt.year(),
                 dt.month(), dt.day(), dt.hour(), dt.minute(), dt.second());
    }

    char flag_str[128];
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

    char line[288];
    snprintf(line, sizeof(line),
             "%u,SCOUT-%02u,%s,%lu,%.2f,%s,%s,,%.2f,%lu,%s,%s,%s,v%d.%d.%d,%s,%s",
             SCOUT_PACKET_VERSION, (unsigned)BUOY_ID, timestamp, (unsigned long)g_state.record_seq,
             temp_c, turb_adc_s, turb_v_s, battery_mv / 1000.0f,
             (unsigned long)(g_state.record_seq * SAMPLE_INTERVAL_S), audio_file, flag_str, soh_str,
             FW_MAJOR, FW_MINOR, FW_PATCH, housing_temp_s, housing_rh_s);

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
    g_last_reading = r;
    g_have_reading = true;
    g_last_mode = mode;

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
}

// Send the held reading in a transmit slot. A slot with nothing sent is simply missed — the
// next slot carries a fresher reading, and the full record is on the SD card regardless.
static void transmit_last_reading() {
    if (!g_lora_ok || !g_have_reading) {
        return;
    }
    // Pet the watchdog before the slowest step (LoRa TX blocks up to ~2 s per copy).
    Watchdog.reset();

    uint8_t packet[SCOUT_PACKET_SIZE];
    size_t n = scout_packet_encode(&g_last_reading, packet);

    // Copies per slot come from lib/scout_link (one since 2026-10-23; the three daily slots
    // give the time diversity). Never listen for an ACK: a lost packet costs timeliness, not
    // data — the full record is on the SD card — so ACKed retransmit would buy little and risk
    // an avalanche across a multi-buoy deployment. The shore station deduplicates on
    // (buoy_id, record_seq), so any duplicate collapses to one row.
    uint8_t copies = scout_link_repeat_count(g_last_mode, SCOUT_LINK_REPEATS_NORMAL,
                                             SCOUT_LINK_REPEATS_CONSERVE);
    for (uint8_t i = 0; i < copies; i++) {
        g_lora.send(packet, (uint8_t)n);
        // Pet before the gap, not after: the watchdog must not expire while we wait.
        // scout_link_fits_watchdog asserts this policy leaves 2x headroom.
        Watchdog.reset();
        if (i + 1 < copies) {
            delay(scout_link_repeat_delay_ms((uint8_t)(i + 1),
                                             SCOUT_LINK_REPEAT_BASE_DELAY_MS));
            Watchdog.reset();
        }
    }
}

void loop() {
    // First pass after boot samples straight away; after that, sleep to the planned event.
    uint32_t event = g_first_cycle ? clock_now() : sleep_until(g_next_event);

    // Re-arm the watchdog for this cycle (it was disabled for the standby sleep). If any step
    // below hangs past WDT_TIMEOUT_MS, the buoy resets and recovers on its own.
    Watchdog.enable(WDT_TIMEOUT_MS);
    sensor_gates_off();  // re-asserted every wake, whatever state a glitch left them in

    bool sampled = g_first_cycle || scout_is_sample_time(event, SAMPLE_INTERVAL_S);
    if (sampled) {
        sample_and_log();
    }
    int slot = scout_tx_slot_index(event, TX_SLOTS_SOD, TX_SLOT_COUNT);
    if (TX_EVERY_SAMPLE && sampled) {
        slot = 0;  // bench build only: every sample is treated as a transmit slot
    }
    if (scout_slot_transmits(g_last_mode, slot, TRANSMIT_CONSERVE_EVERY)) {
        transmit_last_reading();
    }

    g_first_cycle = false;
    g_next_event = scout_next_event_epoch(clock_now(), SAMPLE_INTERVAL_S, TX_SLOTS_SOD,
                                          TX_SLOT_COUNT);
}
