/* Setting up the shore station's WiFi from a phone (SCO-310), the hardware-free part.
 *
 * With no saved network, or after 10 s without a connection, the station puts up its own open
 * WiFi network (SCOUT-Setup-XXXX). A phone that joins it gets the setup page, picks a network
 * (a phone's hotspot works), types the password and the station's device token, and the station
 * saves them to flash. This library checks that form, tidies the network list for the page, and
 * decides when the setup network opens and closes and when the station tries to join.
 *
 * A join attempt makes the radio scan other channels, which drops a phone off the setup network,
 * so no attempt starts on its own while a phone is on it; saving starts one straight away. That
 * also covers a phone setting up its own hotspot: it cannot host a hotspot while it is on the
 * setup network, so the join succeeds once the phone leaves and turns its hotspot on. */
#ifndef SCOUT_WIFI_SETUP_H
#define SCOUT_WIFI_SETUP_H

#include <stddef.h>
#include <stdint.h>

#define SCOUT_WIFI_SSID_MAX 32     /* 802.11 limit, in bytes */
#define SCOUT_WIFI_PASSWORD_MAX 64 /* 8–63 characters, or a 64-digit hex key */
#define SCOUT_WIFI_TOKEN_MAX 80    /* the console refuses longer device tokens (worker/device.js) */

#define SCOUT_WIFI_PORTAL_AFTER_MS 10000u    /* no connection this long: open setup */
#define SCOUT_WIFI_PORTAL_CLOSE_MS 60000u    /* connected this long: close setup */
#define SCOUT_WIFI_FORCED_MS 600000u         /* setup opened by hand stays this long */
#define SCOUT_WIFI_JOIN_WINDOW_MS 20000u     /* one join attempt */
#define SCOUT_WIFI_JOIN_RETRY_MS 10000u      /* gap between attempts */

struct ScoutWifiConfig {
    char ssid[SCOUT_WIFI_SSID_MAX + 1];
    char password[SCOUT_WIFI_PASSWORD_MAX + 1];
    char token[SCOUT_WIFI_TOKEN_MAX + 1];
};

enum ScoutWifiFormError {
    SCOUT_WIFI_FORM_OK = 0,
    SCOUT_WIFI_FORM_SSID_EMPTY,
    SCOUT_WIFI_FORM_SSID_TOO_LONG,
    SCOUT_WIFI_FORM_PASSWORD_TOO_SHORT,
    SCOUT_WIFI_FORM_PASSWORD_TOO_LONG,
    SCOUT_WIFI_FORM_TOKEN_MISSING,
    SCOUT_WIFI_FORM_TOKEN_BAD,
};

/* Checks the setup form against what is saved (current may be null) and fills out. A blank
 * password for the saved network keeps its password; a blank token keeps the saved token. */
ScoutWifiFormError scout_wifi_form_apply(const ScoutWifiConfig *current, const char *ssid,
                                         const char *password, const char *token, ScoutWifiConfig *out);

/* What to tell the person on the setup page. */
const char *scout_wifi_form_message(ScoutWifiFormError error);

struct ScoutWifiNetwork {
    char ssid[SCOUT_WIFI_SSID_MAX + 1];
    int8_t rssi;
    bool secured;
};

/* Copies a scan into out without hidden networks, one entry per name (the strongest), strongest
 * first. Returns how many it wrote, at most max. */
size_t scout_wifi_scan_tidy(const ScoutWifiNetwork *in, size_t n, ScoutWifiNetwork *out, size_t max);

/* The list as JSON for the page, only whole entries that fit. Returns the length written. */
size_t scout_wifi_scan_json(const ScoutWifiNetwork *nets, size_t n, char *buf, size_t len);

/* s as the inside of a JSON string; UTF-8 passes through. Stops early if buf is short. */
size_t scout_wifi_json_escape(const char *s, char *buf, size_t len);

/* "SCOUT-Setup-" and the last two bytes of the MAC, so two stations side by side differ. */
void scout_wifi_ap_name(const uint8_t mac[6], char *buf, size_t len);

/* An ESP-IDF disconnect reason as the page's word for it: wrong_password, not_found or failed. */
const char *scout_wifi_reason_name(uint8_t reason);

struct ScoutWifiWatch {
    bool portal_open;
    bool joining;
    bool join_requested; /* set by a save, consumed by the next join (kept while connected) */
    bool was_connected;
    uint32_t down_since;
    uint32_t up_since;
    uint32_t join_started;
    uint32_t join_stopped;
    uint32_t forced_until;
    bool forced;
};

struct ScoutWifiInputs {
    bool configured;  /* a network is saved */
    bool connected;   /* joined and has an address */
    bool ap_clients;  /* a phone is on the setup network */
    uint32_t now_ms;
};

struct ScoutWifiActions {
    bool open_portal;
    bool close_portal;
    bool begin_join;
    bool stop_join;
};

void scout_wifi_watch_begin(ScoutWifiWatch *w, uint32_t now_ms);

/* One pass of the decision, run every few hundred ms. */
ScoutWifiActions scout_wifi_step(ScoutWifiWatch *w, const ScoutWifiInputs *in);

/* The page saved a network: try it on the next step, phone or no phone. */
void scout_wifi_saved(ScoutWifiWatch *w);

/* The BOOT button or the W command: open setup and keep it open for SCOUT_WIFI_FORCED_MS. */
void scout_wifi_force_portal(ScoutWifiWatch *w, uint32_t now_ms);

#endif /* SCOUT_WIFI_SETUP_H */
