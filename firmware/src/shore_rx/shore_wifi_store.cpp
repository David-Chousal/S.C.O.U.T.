#include "shore_wifi_store.h"

#include <Arduino.h>
#include <Preferences.h>
#include <freertos/semphr.h>
#include <string.h>

#if __has_include("shore_secrets.h")
#include "shore_secrets.h"
#define SHORE_HAVE_SECRETS 1
#elif defined(SHORE_NET_LINK_CHECK)
/* env feather_esp32s3_shore_link_check: dummy values so CI builds the seeding path. Never flash it. */
#define SHORE_WIFI_SSID "link-check"
#define SHORE_WIFI_PASSWORD ""
#define SHORE_CONSOLE_URL "https://console.scoutscu.com"
#define SHORE_CONSOLE_TOKEN "scd_link_check"
#define SHORE_HAVE_SECRETS 1
#else
#define SHORE_CONSOLE_URL "https://console.scoutscu.com"
#define SHORE_HAVE_SECRETS 0
#endif

static const char *NAMESPACE = "shore_wifi";
static ScoutWifiConfig g_config;
static SemaphoreHandle_t g_store_lock = nullptr;
static bool g_creds_changed = false;

class StoreLock {
public:
    StoreLock() { xSemaphoreTake(g_store_lock, portMAX_DELAY); }
    ~StoreLock() { xSemaphoreGive(g_store_lock); }
};

static void read_flash(ScoutWifiConfig *out) {
    memset(out, 0, sizeof(*out));
    Preferences prefs;
    if (!prefs.begin(NAMESPACE, true)) {
        return; /* nothing saved yet: the namespace does not exist */
    }
    prefs.getString("ssid", out->ssid, sizeof(out->ssid));
    prefs.getString("password", out->password, sizeof(out->password));
    prefs.getString("token", out->token, sizeof(out->token));
    prefs.end();
}

static void seed_from_secrets(ScoutWifiConfig *config) {
#if SHORE_HAVE_SECRETS
    if (config->ssid[0] || strlen(SHORE_WIFI_SSID) == 0) {
        return;
    }
    strncpy(config->ssid, SHORE_WIFI_SSID, sizeof(config->ssid) - 1);
    strncpy(config->password, SHORE_WIFI_PASSWORD, sizeof(config->password) - 1);
    strncpy(config->token, SHORE_CONSOLE_TOKEN, sizeof(config->token) - 1);
    Serial.print("wifi: nothing saved; using shore_secrets.h until the setup page saves a network\n");
#else
    (void)config;
#endif
}

void shore_wifi_store_begin() {
    g_store_lock = xSemaphoreCreateMutex();
    ScoutWifiConfig loaded;
    read_flash(&loaded);
    seed_from_secrets(&loaded);
    StoreLock lock;
    g_config = loaded;
}

bool shore_wifi_store_get(ScoutWifiConfig *out) {
    StoreLock lock;
    *out = g_config;
    return g_config.ssid[0] != '\0';
}

bool shore_wifi_store_save(const ScoutWifiConfig &config) {
    ScoutWifiConfig previous;
    read_flash(&previous);
    Preferences prefs;
    if (!prefs.begin(NAMESPACE, false)) {
        Serial.print("wifi: could not open flash to save the network\n");
        return false;
    }
    bool ok = prefs.putString("ssid", config.ssid) > 0 &&
              prefs.putString("password", config.password) == strlen(config.password) &&
              prefs.putString("token", config.token) > 0;
    if (!ok) {
        // Roll back a half-written NVS so a new SSID never sits next to the old password.
        prefs.putString("ssid", previous.ssid);
        prefs.putString("password", previous.password);
        prefs.putString("token", previous.token);
        prefs.end();
        Serial.print("wifi: flash refused the new network; previous values restored\n");
        return false;
    }
    prefs.end();
    StoreLock lock;
    g_config = config;
    g_creds_changed = true;
    return true;
}

bool shore_wifi_store_take_creds_changed() {
    StoreLock lock;
    bool changed = g_creds_changed;
    g_creds_changed = false;
    return changed;
}

const char *shore_console_url() { return SHORE_CONSOLE_URL; }
