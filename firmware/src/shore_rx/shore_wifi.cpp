#include "shore_wifi.h"

#include <Arduino.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFi.h>

#include "scout_wifi_setup.h"
#include "shore_wifi_store.h"

/* setup-page.html, linked in by board_build.embed_txtfiles (platformio.ini), NUL-terminated. */
extern const char SETUP_PAGE_START[] asm("_binary_src_shore_rx_setup_page_html_start");
extern const char SETUP_PAGE_END[] asm("_binary_src_shore_rx_setup_page_html_end");

static const uint8_t BOOT_PIN = 0;              /* the Feather's BOOT button, low when held */
static const uint32_t BOOT_HOLD_MS = 3000;
static const uint32_t SCAN_FRESH_MS = 8000;
static const size_t SCAN_MAX = 20;
static const uint32_t WIFI_TASK_STACK = 8192;

static WebServer g_server(80);
static DNSServer g_dns;
static ScoutWifiWatch g_watch;
static char g_ap_name[24];
static volatile bool g_force_request = false;
static volatile uint8_t g_last_reason = 0;    /* why the last join failed; 0 = none yet */
static ScoutWifiNetwork g_nets[SCAN_MAX];
static size_t g_net_count = 0;
static uint32_t g_scan_done_ms = 0;
static bool g_scanning = false;

/* ---- Scanning ---- */

static void start_scan() {
    if (!g_scanning && WiFi.scanNetworks(true, false) == WIFI_SCAN_RUNNING) {
        g_scanning = true;
    }
}

static void collect_scan() {
    int16_t found = WiFi.scanComplete();
    if (!g_scanning || found == WIFI_SCAN_RUNNING) {
        return;
    }
    g_scanning = false;
    if (found < 0) {
        return; /* the radio was busy joining; the page asks again */
    }
    static ScoutWifiNetwork raw[40];
    size_t n = (size_t)found < 40 ? (size_t)found : 40;
    for (size_t i = 0; i < n; i++) {
        memset(&raw[i], 0, sizeof(raw[i]));
        strncpy(raw[i].ssid, WiFi.SSID(i).c_str(), SCOUT_WIFI_SSID_MAX);
        raw[i].rssi = (int8_t)WiFi.RSSI(i);
        raw[i].secured = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
    }
    WiFi.scanDelete();
    g_net_count = scout_wifi_scan_tidy(raw, n, g_nets, SCAN_MAX);
    g_scan_done_ms = millis();
}

/* ---- The setup page's endpoints ---- */

static void send_json(int code, const char *body) {
    g_server.sendHeader("Cache-Control", "no-store");
    g_server.send(code, "application/json", body);
}

static void handle_page() {
    g_server.sendHeader("Cache-Control", "no-store");
    g_server.send_P(200, "text/html; charset=utf-8", SETUP_PAGE_START,
                    (size_t)(SETUP_PAGE_END - SETUP_PAGE_START) - 1);
}

static void handle_scan() {
    if (!g_scanning && (g_scan_done_ms == 0 || millis() - g_scan_done_ms > SCAN_FRESH_MS)) {
        start_scan();
    }
    static char body[SCAN_MAX * 90 + 48];
    int at = snprintf(body, sizeof(body), "{\"scanning\":%s,\"networks\":", g_scanning ? "true" : "false");
    at += (int)scout_wifi_scan_json(g_nets, g_net_count, body + at, sizeof(body) - at - 1);
    snprintf(body + at, sizeof(body) - at, "}");
    send_json(200, body);
}

/* A disconnect reason ends an attempt (the core does not retry on its own), so it reads as failed
 * at once rather than after the whole join window. */
static const char *link_state(bool configured) {
    if (WiFi.status() == WL_CONNECTED) {
        return "connected";
    }
    if (configured && g_last_reason) {
        return "failed";
    }
    return g_watch.joining ? "joining" : "idle";
}

static void handle_status() {
    ScoutWifiConfig config;
    bool configured = shore_wifi_store_get(&config);
    char ssid[SCOUT_WIFI_SSID_MAX * 6 + 8];
    scout_wifi_json_escape(config.ssid, ssid, sizeof(ssid));
    bool up = WiFi.status() == WL_CONNECTED;
    char body[512];
    snprintf(body, sizeof(body),
             "{\"station\":\"%s\",\"saved\":\"%s\",\"has_token\":%s,\"state\":\"%s\",\"reason\":\"%s\","
             "\"ip\":\"%s\",\"rssi\":%d}",
             g_ap_name, ssid, config.token[0] ? "true" : "false", link_state(configured),
             g_last_reason ? scout_wifi_reason_name(g_last_reason) : "",
             up ? WiFi.localIP().toString().c_str() : "", up ? WiFi.RSSI() : 0);
    send_json(200, body);
}

static void handle_save() {
    ScoutWifiConfig current, next;
    bool configured = shore_wifi_store_get(&current);
    ScoutWifiFormError error =
        scout_wifi_form_apply(configured ? &current : nullptr, g_server.arg("ssid").c_str(),
                              g_server.arg("password").c_str(), g_server.arg("token").c_str(), &next);
    char body[200];
    if (error != SCOUT_WIFI_FORM_OK) {
        snprintf(body, sizeof(body), "{\"error\":\"%s\"}", scout_wifi_form_message(error));
        send_json(400, body);
        return;
    }
    if (!shore_wifi_store_save(next)) {
        send_json(500, "{\"error\":\"The station could not save that. Try again.\"}");
        return;
    }
    g_last_reason = 0;
    scout_wifi_saved(&g_watch);
    Serial.printf("wifi: setup page saved network %s\n", next.ssid);
    send_json(200, "{\"ok\":true}");
}

/* Phones probe these to detect a captive network; anything but their expected answer makes them
 * open the setup page on their own. */
static void redirect_to_page() {
    g_server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString() + "/", true);
    g_server.send(302, "text/plain", "");
}

static void add_routes() {
    g_server.on("/", HTTP_GET, handle_page);
    g_server.on("/api/scan", HTTP_GET, handle_scan);
    g_server.on("/api/status", HTTP_GET, handle_status);
    g_server.on("/api/save", HTTP_POST, handle_save);
    g_server.onNotFound(redirect_to_page);
}

/* ---- Opening, closing, joining ---- */

static void open_portal() {
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(g_ap_name);
    g_dns.setErrorReplyCode(DNSReplyCode::NoError);
    g_dns.start(53, "*", WiFi.softAPIP());
    g_server.begin();
    start_scan();
    Serial.printf("wifi: setup network %s is open; join it from a phone\n", g_ap_name);
}

static void close_portal() {
    g_server.stop();
    g_dns.stop();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    Serial.print("wifi: setup network closed\n");
}

static void begin_join() {
    ScoutWifiConfig config;
    if (!shore_wifi_store_get(&config)) {
        return;
    }
    g_last_reason = 0;
    Serial.printf("wifi: joining %s\n", config.ssid);
    WiFi.begin(config.ssid, config.password[0] ? config.password : nullptr);
}

static void on_disconnect(WiFiEvent_t, WiFiEventInfo_t info) {
    uint8_t reason = info.wifi_sta_disconnected.reason;
    if (reason != WIFI_REASON_ASSOC_LEAVE) { /* our own stop_join, not a failure */
        g_last_reason = reason;
    }
}

static void watch_boot_button(uint32_t now) {
    static uint32_t held_since = 0;
    if (digitalRead(BOOT_PIN) != LOW) {
        held_since = 0;
        return;
    }
    if (held_since == 0) {
        held_since = now ? now : 1;
    } else if (now - held_since >= BOOT_HOLD_MS) {
        g_force_request = true;
        held_since = now + 60000; /* once per hold */
    }
}

static void apply(const ScoutWifiActions &a) {
    if (a.open_portal) {
        open_portal();
    }
    if (a.close_portal) {
        close_portal();
    }
    if (a.stop_join) {
        WiFi.disconnect(false, false);
    }
    if (a.begin_join) {
        begin_join();
    }
}

static void wifi_task(void *) {
    uint32_t last_step = 0;
    for (;;) {
        uint32_t now = millis();
        watch_boot_button(now);
        if (g_force_request) {
            g_force_request = false;
            scout_wifi_force_portal(&g_watch, now);
        }
        if (now - last_step >= 250) {
            last_step = now;
            ScoutWifiConfig config;
            ScoutWifiInputs in = {shore_wifi_store_get(&config), WiFi.status() == WL_CONNECTED,
                                  g_watch.portal_open && WiFi.softAPgetStationNum() > 0, now};
            apply(scout_wifi_step(&g_watch, &in));
        }
        if (g_watch.portal_open) {
            g_dns.processNextRequest();
            g_server.handleClient();
            collect_scan();
        }
        vTaskDelay(pdMS_TO_TICKS(g_watch.portal_open ? 5 : 100));
    }
}

void shore_wifi_begin() {
    pinMode(BOOT_PIN, INPUT_PULLUP);
    WiFi.persistent(false); /* the store keeps the network, not the core's own flash copy */
    WiFi.setAutoReconnect(false); /* scout_wifi_step decides when to retry */
    WiFi.mode(WIFI_STA);
    WiFi.setHostname("scout-shore");
    WiFi.onEvent(on_disconnect, ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
    uint8_t mac[6];
    WiFi.macAddress(mac);
    scout_wifi_ap_name(mac, g_ap_name, sizeof(g_ap_name));
    add_routes();
    scout_wifi_watch_begin(&g_watch, millis());
    /* Core 0 with the network task: the Arduino loop and the LoRa radio run on core 1. */
    xTaskCreatePinnedToCore(wifi_task, "shore_wifi", WIFI_TASK_STACK, nullptr, 1, nullptr, 0);
}

void shore_wifi_open_setup() { g_force_request = true; }

bool shore_wifi_connected() { return WiFi.status() == WL_CONNECTED; }
