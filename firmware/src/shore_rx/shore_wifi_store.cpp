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
static const char *CFG_KEY = "cfg";  /* one blob so SSID/password/token never half-commit */
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
    size_t n = prefs.getBytesLength(CFG_KEY);
    if (n == sizeof(*out) && prefs.getBytes(CFG_KEY, out, sizeof(*out)) == sizeof(*out)) {
        out->ssid[sizeof(out->ssid) - 1] = '\0';
        out->password[sizeof(out->password) - 1] = '\0';
        out->token[sizeof(out->token) - 1] = '\0';
        prefs.end();
        return;
    }
    /* Legacy three-string layout from before the atomic blob (migrate on next save). */
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
    /* One putBytes so a torn write cannot leave a new SSID with the old password. */
    bool ok = prefs.putBytes(CFG_KEY, &config, sizeof(config)) == sizeof(config);
    if (!ok) {
        bool restored;
        if (previous.ssid[0] == '\0') {
            prefs.remove(CFG_KEY);  /* empty was already the saved state */
            restored = true;
        } else {
            restored = prefs.putBytes(CFG_KEY, &previous, sizeof(previous)) == sizeof(previous);
        }
        prefs.end();
        if (restored) {
            Serial.print("wifi: flash refused the new network; previous values restored\n");
        } else {
            Serial.print("wifi: flash refused the new network; previous values could not be "
                         "restored — reopen SoftAP and save again\n");
        }
        return false;
    }
    /* Drop legacy keys once the blob is the source of truth. */
    prefs.remove("ssid");
    prefs.remove("password");
    prefs.remove("token");
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
