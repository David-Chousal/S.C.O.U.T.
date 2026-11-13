/* The shore station's WiFi network and device token, kept in flash (SCO-310).
 *
 * The setup page (shore_wifi.cpp) writes them; the network task (shore_net.cpp) reads them. They
 * survive power loss and reflashing the same partition table. A developer's gitignored
 * shore_secrets.h, when present, only fills an empty store on first boot. */
#ifndef SHORE_WIFI_STORE_H
#define SHORE_WIFI_STORE_H

#include "scout_wifi_setup.h"

/* Loads what is saved; call once before the WiFi and network tasks start. */
void shore_wifi_store_begin();

/* Copies what is saved into out. Returns true when a network is saved. */
bool shore_wifi_store_get(ScoutWifiConfig *out);

/* Saves config to flash and memory. Returns false if flash refused it. */
bool shore_wifi_store_save(const ScoutWifiConfig &config);

/* True once after a successful save; the network task clears it to reset push backoff. */
bool shore_wifi_store_take_creds_changed();

/* The console the station pushes to: shore_secrets.h's SHORE_CONSOLE_URL, else the live one. */
const char *shore_console_url();

#endif /* SHORE_WIFI_STORE_H */
