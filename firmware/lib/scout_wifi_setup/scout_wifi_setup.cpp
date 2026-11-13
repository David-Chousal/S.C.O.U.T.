#include "scout_wifi_setup.h"

#include <stdio.h>
#include <string.h>

/* ---- The setup form ---- */

static bool all_hex(const char *s) {
    for (; *s; s++) {
        bool hex = (*s >= '0' && *s <= '9') || (*s >= 'a' && *s <= 'f') || (*s >= 'A' && *s <= 'F');
        if (!hex) {
            return false;
        }
    }
    return true;
}

static bool is_space(char c) { return c == ' ' || c == '\t' || c == '\r' || c == '\n'; }

static ScoutWifiFormError pick_password(const ScoutWifiConfig *current, const char *ssid,
                                        const char *password, char *out) {
    size_t len = strlen(password);
    if (len == 0) {
        bool same_network = current && strcmp(current->ssid, ssid) == 0;
        strcpy(out, same_network ? current->password : "");
        return SCOUT_WIFI_FORM_OK;
    }
    if (len < 8) {
        return SCOUT_WIFI_FORM_PASSWORD_TOO_SHORT;
    }
    if (len > SCOUT_WIFI_PASSWORD_MAX || (len == SCOUT_WIFI_PASSWORD_MAX && !all_hex(password))) {
        return SCOUT_WIFI_FORM_PASSWORD_TOO_LONG;
    }
    strcpy(out, password);
    return SCOUT_WIFI_FORM_OK;
}

static ScoutWifiFormError pick_token(const ScoutWifiConfig *current, const char *token, char *out) {
    while (is_space(*token)) {
        token++;
    }
    size_t len = strlen(token);
    while (len > 0 && is_space(token[len - 1])) {
        len--;
    }
    if (len == 0) {
        if (current && current->token[0]) {
            strcpy(out, current->token);
            return SCOUT_WIFI_FORM_OK;
        }
        return SCOUT_WIFI_FORM_TOKEN_MISSING;
    }
    if (len > SCOUT_WIFI_TOKEN_MAX || strncmp(token, "scd_", 4) != 0) {
        return SCOUT_WIFI_FORM_TOKEN_BAD;
    }
    for (size_t i = 0; i < len; i++) {
        if (token[i] <= ' ' || token[i] > '~') {
            return SCOUT_WIFI_FORM_TOKEN_BAD;
        }
    }
    memcpy(out, token, len);
    out[len] = '\0';
    return SCOUT_WIFI_FORM_OK;
}

ScoutWifiFormError scout_wifi_form_apply(const ScoutWifiConfig *current, const char *ssid,
                                         const char *password, const char *token, ScoutWifiConfig *out) {
    size_t ssid_len = strlen(ssid);
    if (ssid_len == 0) {
        return SCOUT_WIFI_FORM_SSID_EMPTY;
    }
    if (ssid_len > SCOUT_WIFI_SSID_MAX) {
        return SCOUT_WIFI_FORM_SSID_TOO_LONG;
    }
    ScoutWifiConfig next;
    memset(&next, 0, sizeof(next));
    strcpy(next.ssid, ssid);
    ScoutWifiFormError error = pick_password(current, ssid, password, next.password);
    if (error == SCOUT_WIFI_FORM_OK) {
        error = pick_token(current, token, next.token);
    }
    if (error == SCOUT_WIFI_FORM_OK) {
        *out = next;
    }
    return error;
}

const char *scout_wifi_form_message(ScoutWifiFormError error) {
    switch (error) {
    case SCOUT_WIFI_FORM_OK: return "";
    case SCOUT_WIFI_FORM_SSID_EMPTY: return "Pick a network or type its name.";
    case SCOUT_WIFI_FORM_SSID_TOO_LONG: return "That network name is longer than WiFi allows (32 bytes).";
    case SCOUT_WIFI_FORM_PASSWORD_TOO_SHORT: return "WiFi passwords are at least 8 characters.";
    case SCOUT_WIFI_FORM_PASSWORD_TOO_LONG: return "WiFi passwords are at most 63 characters.";
    case SCOUT_WIFI_FORM_TOKEN_MISSING:
        return "Paste the station token from the console's Stations page.";
    case SCOUT_WIFI_FORM_TOKEN_BAD:
        return "That is not a station token. It starts with scd_ and comes from the Stations page.";
    }
    return "That did not work.";
}

/* ---- The network list ---- */

size_t scout_wifi_scan_tidy(const ScoutWifiNetwork *in, size_t n, ScoutWifiNetwork *out, size_t max) {
    size_t count = 0;
    for (size_t i = 0; i < n; i++) {
        if (in[i].ssid[0] == '\0') {
            continue;
        }
        size_t at = 0;
        while (at < count && strcmp(out[at].ssid, in[i].ssid) != 0) {
            at++;
        }
        if (at < count) {
            if (in[i].rssi > out[at].rssi) {
                out[at] = in[i];
            }
        } else if (count < max) {
            out[count++] = in[i];
        }
    }
    for (size_t i = 1; i < count; i++) {
        ScoutWifiNetwork held = out[i];
        size_t j = i;
        while (j > 0 && out[j - 1].rssi < held.rssi) {
            out[j] = out[j - 1];
            j--;
        }
        out[j] = held;
    }
    return count;
}

/* JSON string body for s; bytes from 0x80 pass through, so UTF-8 names stay as they are. */
size_t scout_wifi_json_escape(const char *s, char *buf, size_t len) {
    size_t at = 0;
    for (; *s && at + 7 < len; s++) {
        unsigned char c = (unsigned char)*s;
        if (c == '"' || c == '\\') {
            buf[at++] = '\\';
            buf[at++] = (char)c;
        } else if (c < 0x20) {
            at += (size_t)snprintf(buf + at, len - at, "\\u%04x", c);
        } else {
            buf[at++] = (char)c;
        }
    }
    buf[at] = '\0';
    return at;
}

size_t scout_wifi_scan_json(const ScoutWifiNetwork *nets, size_t n, char *buf, size_t len) {
    if (len < 3) {
        if (len) {
            buf[0] = '\0';
        }
        return 0;
    }
    size_t at = 0;
    buf[at++] = '[';
    for (size_t i = 0; i < n; i++) {
        char name[SCOUT_WIFI_SSID_MAX * 6 + 8];
        scout_wifi_json_escape(nets[i].ssid, name, sizeof(name));
        char entry[sizeof(name) + 64];
        int w = snprintf(entry, sizeof(entry), "%s{\"ssid\":\"%s\",\"rssi\":%d,\"secured\":%s}",
                         i ? "," : "", name, nets[i].rssi, nets[i].secured ? "true" : "false");
        if (w < 0 || at + (size_t)w + 2 > len) {
            break; /* keep room for "]" and the terminator */
        }
        memcpy(buf + at, entry, (size_t)w);
        at += (size_t)w;
    }
    buf[at++] = ']';
    buf[at] = '\0';
    return at;
}

void scout_wifi_ap_name(const uint8_t mac[6], char *buf, size_t len) {
    snprintf(buf, len, "SCOUT-Setup-%02X%02X", mac[4], mac[5]);
}

const char *scout_wifi_reason_name(uint8_t reason) {
    switch (reason) {
    case 15:  /* 4-way handshake timeout */
    case 202: /* auth fail */
    case 204: /* handshake timeout */
        return "wrong_password";
    case 201: /* no AP found */
        return "not_found";
    default:
        return "failed";
    }
}

/* ---- When the setup network opens and the station tries to join ---- */

static bool reached(uint32_t now, uint32_t since, uint32_t span) { return (uint32_t)(now - since) >= span; }

void scout_wifi_watch_begin(ScoutWifiWatch *w, uint32_t now_ms) {
    memset(w, 0, sizeof(*w));
    w->down_since = now_ms;
    w->join_stopped = now_ms - SCOUT_WIFI_JOIN_RETRY_MS; /* the first join may start at once */
}

void scout_wifi_saved(ScoutWifiWatch *w) { w->join_requested = true; }

void scout_wifi_force_portal(ScoutWifiWatch *w, uint32_t now_ms) {
    w->forced = true;
    w->forced_until = now_ms + SCOUT_WIFI_FORCED_MS;
}

static void track_link(ScoutWifiWatch *w, const ScoutWifiInputs *in) {
    if (in->connected && !w->was_connected) {
        w->up_since = in->now_ms;
    } else if (!in->connected && w->was_connected) {
        w->down_since = in->now_ms;
        w->join_stopped = in->now_ms - SCOUT_WIFI_JOIN_RETRY_MS; /* rejoin at once */
    }
    w->was_connected = in->connected;
    if (w->forced && (int32_t)(in->now_ms - w->forced_until) >= 0) {
        w->forced = false;
    }
}

static void decide_portal(ScoutWifiWatch *w, const ScoutWifiInputs *in, ScoutWifiActions *a) {
    bool want_open = !in->configured || w->forced ||
                     (!in->connected && reached(in->now_ms, w->down_since, SCOUT_WIFI_PORTAL_AFTER_MS));
    bool may_close = in->configured && !w->forced && in->connected &&
                     reached(in->now_ms, w->up_since, SCOUT_WIFI_PORTAL_CLOSE_MS);
    if (want_open && !w->portal_open) {
        w->portal_open = true;
        a->open_portal = true;
    } else if (may_close && w->portal_open) {
        w->portal_open = false;
        a->close_portal = true;
    }
}

static void decide_join(ScoutWifiWatch *w, const ScoutWifiInputs *in, ScoutWifiActions *a) {
    if (in->connected || !in->configured) {
        a->stop_join = w->joining && !in->connected;
        w->joining = false;
        if (!in->configured) {
            w->join_requested = false;
        }
        /* A save while connected stays pending: the station drops the old network after a
         * changed save, and that drop may land a step later. */
        return;
    }
    bool phone_on_setup = w->portal_open && in->ap_clients;
    bool start = w->join_requested ||
                 (!w->joining && !phone_on_setup && reached(in->now_ms, w->join_stopped, SCOUT_WIFI_JOIN_RETRY_MS));
    if (start) {
        w->joining = true;
        w->join_requested = false;
        w->join_started = in->now_ms;
        a->begin_join = true;
    } else if (w->joining && reached(in->now_ms, w->join_started, SCOUT_WIFI_JOIN_WINDOW_MS)) {
        w->joining = false;
        w->join_stopped = in->now_ms;
        a->stop_join = true;
    }
}

ScoutWifiActions scout_wifi_step(ScoutWifiWatch *w, const ScoutWifiInputs *in) {
    ScoutWifiActions a = {false, false, false, false};
    track_link(w, in);
    decide_portal(w, in, &a);
    decide_join(w, in, &a);
    return a;
}
