#include "shore_net.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_sntp.h>
#include <freertos/semphr.h>
#include <sys/time.h>

#include "console_ca.h"
#include "scout_console.h"
#include "shore_wifi.h"
#include "shore_wifi_store.h"

ShoreShared g_shared;
static SemaphoreHandle_t g_lock = nullptr;

static const size_t PUSH_BATCH = 20;                  // rows per request (~11 KB)
// Every minute, so Change WiFi on the console's Stations page takes effect within a minute.
static const uint32_t SETTINGS_EVERY_MS = 60u * 1000u;
static const uint32_t BACKOFF_MIN_MS = 5u * 1000u;
static const uint32_t BACKOFF_MAX_MS = 10u * 60u * 1000u;
static const uint32_t NTP_RETRY_MS = 10u * 60u * 1000u;
static const uint32_t HTTP_TIMEOUT_MS = 15u * 1000u;
static const uint32_t NET_TASK_STACK = 12288;          // TLS needs more than the default 4 KB

static char g_body[PUSH_BATCH * SCOUT_CONSOLE_ROW_MAX + 16];

ShoreLock::ShoreLock() { xSemaphoreTake(g_lock, portMAX_DELAY); }
ShoreLock::~ShoreLock() { xSemaphoreGive(g_lock); }

void shore_shared_begin(uint32_t now, uint32_t min_valid_epoch) {
    g_lock = xSemaphoreCreateMutex();
    scout_upload_queue_init(&g_shared.queue);
    scout_clock_boot(&g_shared.clock, now, min_valid_epoch);
    memset(g_shared.wanted, 0, sizeof(g_shared.wanted));
}

static void on_ntp(struct timeval *tv) {
    {
        ShoreLock lock;
        scout_clock_set(&g_shared.clock, SCOUT_CLOCK_NTP, (uint32_t)tv->tv_sec);
    }
    Serial.printf("time: set by ntp to %lu\n", (unsigned long)tv->tv_sec);
}

/* One authenticated request to the console. Returns the HTTP status (negative: no answer). */
static int console_request(const char *method, const char *path, const uint8_t *body,
                           size_t len, String *reply) {
    ScoutWifiConfig config;
    shore_wifi_store_get(&config);
    WiFiClientSecure client;
    client.setCACert(SHORE_CONSOLE_CA_PEM);
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    if (!http.begin(client, String(shore_console_url()) + path)) {
        return -1;
    }
    http.addHeader("Authorization", String("Bearer ") + config.token);
    http.addHeader("Accept", "application/json");
    int code;
    if (strcmp(method, "POST") == 0) {
        http.addHeader("Content-Type", "application/json");
        code = http.POST(const_cast<uint8_t *>(body), len);
    } else {
        code = http.GET();
    }
    if (code > 0) {
        *reply = http.getString();
    }
    http.end();
    return code;
}

/* Pushes the oldest queued readings. Returns the HTTP status, or 0 with nothing to send. */
static int push_once(size_t *left) {
    static ScoutReading batch[PUSH_BATCH];
    size_t n;
    uint32_t dropped_before;
    {
        ShoreLock lock;
        n = scout_upload_queue_peek(&g_shared.queue, batch, PUSH_BATCH);
        dropped_before = g_shared.queue.dropped;
    }
    *left = 0;
    if (n == 0) {
        return 0;
    }
    size_t len = 0;
    size_t taken = scout_console_batch(batch, n, g_body, sizeof(g_body), &len);
    String reply;
    int code = console_request("POST", "/api/device/readings", (const uint8_t *)g_body, len, &reply);
    {
        ShoreLock lock;
        // Readings the queue overwrote while the request was out were the oldest, so they are
        // the first ones of this batch: skip them before popping or removing.
        uint32_t lost = g_shared.queue.dropped - dropped_before;
        if (code == 200) {
            scout_upload_queue_pop(&g_shared.queue, taken > lost ? taken - lost : 0);
        } else if (code == 400) {
            int bad = scout_console_bad_row(reply.c_str());
            if (bad >= 0 && (uint32_t)bad >= lost) {
                scout_upload_queue_remove(&g_shared.queue, (size_t)bad - lost);
            }
        }
        *left = g_shared.queue.count;
    }
    if (code == 200) {
        Serial.printf("console: pushed %u readings, %u queued\n", (unsigned)taken, (unsigned)*left);
    } else if (code == 401 || code == 403) {
        Serial.printf("console: device token refused (%d); make a new one on the Stations page\n", code);
    } else if (code == 400) {
        Serial.printf("console: refused a reading as invalid, dropped it: %s\n", reply.c_str());
    } else {
        Serial.printf("console: push failed (%d), %u queued; retrying\n", code, (unsigned)*left);
    }
    return code;
}

/* Change WiFi on the Stations page: open the setup network once per request. The console stops
 * sending a request after 15 min, so this never fires for an old one. */
static void act_on_wifi_setup(const char *reply) {
    static uint32_t handled = 0;
    uint32_t at = scout_console_wifi_setup_at(reply);
    if (at != 0 && at != handled) {
        handled = at;
        Serial.print("console: Change WiFi requested\n");
        shore_wifi_open_setup();
    }
}

/* The console is the source of truth for what each buoy should run once it answers. */
static void pull_settings() {
    String reply;
    int code = console_request("GET", "/api/device/settings", nullptr, 0, &reply);
    static ScoutWanted latest[SHORE_MAX_BUOY_ID + 1];
    if (code != 200 || scout_console_parse_wanted(reply.c_str(), latest, SHORE_MAX_BUOY_ID + 1) < 0) {
        Serial.printf("console: settings read failed (%d)\n", code);
        return;
    }
    act_on_wifi_setup(reply.c_str());
    bool changed;
    {
        ShoreLock lock;
        changed = memcmp(latest, g_shared.wanted, sizeof(latest)) != 0;
        memcpy(g_shared.wanted, latest, sizeof(latest));
    }
    if (changed) {
        char line[160];
        int at = snprintf(line, sizeof(line), "console: wanted");
        bool any = false;
        for (uint16_t id = 1; id <= SHORE_MAX_BUOY_ID && at < (int)sizeof(line); id++) {
            const ScoutWanted &w = latest[id];
            if (!w.tx_count && !w.has_settings) {
                continue;
            }
            any = true;
            at += snprintf(line + at, sizeof(line) - at, " buoy%u=tx%u/digest%04x", id, w.tx_count,
                           w.has_settings ? scout_settings_digest(&w.settings) : 0u);
        }
        Serial.printf("%s%s\n", line, any ? "" : " none");
    }
}

static void net_task(void *) {
    bool was_up = false;
    bool sntp_started = false;
    uint32_t next_push = 0, next_settings = 0, next_ntp_retry = 0, backoff = BACKOFF_MIN_MS;
    for (;;) {
        uint32_t now_ms = millis();
        bool up = shore_wifi_connected();
        if (up != was_up) {
            if (up) {
                Serial.printf("wifi: connected ip=%s rssi=%d\n", WiFi.localIP().toString().c_str(),
                              WiFi.RSSI());
                next_push = next_settings = now_ms;
            } else {
                Serial.print("wifi: lost; readings queue until it is back\n");
            }
            was_up = up;
        }
        // NTP needs only WiFi — do not wait on a console token that may arrive later via SoftAP.
        if (up && !sntp_started) {
            sntp_set_time_sync_notification_cb(on_ntp);
            configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
            sntp_started = true;
            next_ntp_retry = now_ms + NTP_RETRY_MS;
        }
        if (up && sntp_started) {
            bool ntp_due;
            {
                ShoreLock lock;
                ntp_due = scout_clock_ntp_due(&g_shared.clock, (uint32_t)time(nullptr));
            }
            if (ntp_due && (int32_t)(now_ms - next_ntp_retry) >= 0) {
                sntp_restart();  // SNTP re-syncs hourly on its own; this covers a sync gone stale
                next_ntp_retry = now_ms + NTP_RETRY_MS;
            }
        }
        if (shore_wifi_store_take_creds_changed()) {
            backoff = BACKOFF_MIN_MS;
            next_push = next_settings = now_ms;
        }
        ScoutWifiConfig config;
        shore_wifi_store_get(&config);
        if (!up || !config.token[0]) {
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }
        if ((int32_t)(now_ms - next_push) >= 0) {
            size_t left = 0;
            int code = push_once(&left);
            if (code == 0 || code == 200) {
                backoff = BACKOFF_MIN_MS;
                next_push = now_ms + (left ? 0 : 1000);
            } else {
                next_push = now_ms + backoff;
                backoff = backoff * 2 < BACKOFF_MAX_MS ? backoff * 2 : BACKOFF_MAX_MS;
            }
        }
        if ((int32_t)(now_ms - next_settings) >= 0) {
            pull_settings();
            next_settings = now_ms + SETTINGS_EVERY_MS;
        }
        vTaskDelay(pdMS_TO_TICKS(250));
    }
}

void shore_net_begin() {
    shore_wifi_store_begin();
    shore_wifi_begin();
    Serial.printf("wifi: on; console %s\n", shore_console_url());
    // Core 0: the Arduino loop (and the radio) run on core 1.
    xTaskCreatePinnedToCore(net_task, "shore_net", NET_TASK_STACK, nullptr, 1, nullptr, 0);
}
