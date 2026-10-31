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

#if __has_include("shore_secrets.h")
#include "shore_secrets.h"
#define SHORE_HAVE_SECRETS 1
#elif defined(SHORE_NET_LINK_CHECK)
/* env feather_esp32s3_shore_link_check: dummy values so CI links the whole network path, which a
 * build with no secrets drops as unreachable. Never flash it. */
#define SHORE_WIFI_SSID "link-check"
#define SHORE_WIFI_PASSWORD ""
#define SHORE_CONSOLE_URL "https://console.scoutscu.com"
#define SHORE_CONSOLE_TOKEN "scd_link_check"
#define SHORE_HAVE_SECRETS 1
#else
#include "shore_secrets_example.h"
#define SHORE_HAVE_SECRETS 0
#endif

ShoreShared g_shared;
static SemaphoreHandle_t g_lock = nullptr;

static const size_t PUSH_BATCH = 20;                  // rows per request (~11 KB)
static const uint32_t SETTINGS_EVERY_MS = 10u * 60u * 1000u;
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
    memset(g_shared.requested, 0, sizeof(g_shared.requested));
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
    WiFiClientSecure client;
    client.setCACert(SHORE_CONSOLE_CA_PEM);
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    if (!http.begin(client, String(SHORE_CONSOLE_URL) + path)) {
        return -1;
    }
    http.addHeader("Authorization", "Bearer " SHORE_CONSOLE_TOKEN);
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

/* The console is the source of truth for requested counts once it answers. */
static void pull_settings() {
    String reply;
    int code = console_request("GET", "/api/device/settings", nullptr, 0, &reply);
    uint8_t latest[SHORE_MAX_BUOY_ID + 1];
    if (code != 200 || scout_console_parse_settings(reply.c_str(), latest, sizeof(latest)) < 0) {
        Serial.printf("console: settings read failed (%d)\n", code);
        return;
    }
    bool changed;
    {
        ShoreLock lock;
        changed = memcmp(latest, g_shared.requested, sizeof(latest)) != 0;
        memcpy(g_shared.requested, latest, sizeof(latest));
    }
    if (changed) {
        char line[96];
        int at = snprintf(line, sizeof(line), "console: requested");
        for (uint16_t id = 1; id <= SHORE_MAX_BUOY_ID; id++) {
            if (latest[id] && at < (int)sizeof(line)) {
                at += snprintf(line + at, sizeof(line) - at, " buoy%u=%u", id, latest[id]);
            }
        }
        Serial.printf("%s%s\n", line, at == 18 ? " none" : "");
    }
}

static void net_task(void *) {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(SHORE_WIFI_SSID, SHORE_WIFI_PASSWORD);
    bool was_up = false;
    bool sntp_started = false;
    uint32_t next_push = 0, next_settings = 0, next_ntp_retry = 0, backoff = BACKOFF_MIN_MS;
    for (;;) {
        uint32_t now_ms = millis();
        bool up = WiFi.status() == WL_CONNECTED;
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
        if (!up) {
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }
        if (!sntp_started) {
            sntp_set_time_sync_notification_cb(on_ntp);
            configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
            sntp_started = true;
            next_ntp_retry = now_ms + NTP_RETRY_MS;
        }
        bool ntp_due;
        {
            ShoreLock lock;
            ntp_due = scout_clock_ntp_due(&g_shared.clock, (uint32_t)time(nullptr));
        }
        if (ntp_due && (int32_t)(now_ms - next_ntp_retry) >= 0) {
            sntp_restart();  // SNTP re-syncs hourly on its own; this covers a sync gone stale
            next_ntp_retry = now_ms + NTP_RETRY_MS;
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
    if (!SHORE_HAVE_SECRETS) {
        Serial.print("wifi: off (no src/shore_rx/shore_secrets.h); USB only\n");
        return;
    }
    if (strlen(SHORE_WIFI_SSID) == 0 || strlen(SHORE_CONSOLE_TOKEN) == 0) {
        Serial.print("wifi: off (SSID or console token empty in shore_secrets.h); USB only\n");
        return;
    }
    Serial.printf("wifi: joining %s; console %s\n", SHORE_WIFI_SSID, SHORE_CONSOLE_URL);
    // Core 0: the Arduino loop (and the radio) run on core 1.
    xTaskCreatePinnedToCore(net_task, "shore_net", NET_TASK_STACK, nullptr, 1, nullptr, 0);
}
