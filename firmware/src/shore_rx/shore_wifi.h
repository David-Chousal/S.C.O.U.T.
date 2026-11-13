/* The shore station's WiFi link and its setup network (SCO-310).
 *
 * One FreeRTOS task owns the radio's WiFi side: it joins the saved network, and when there is
 * none, or no connection for 90 s, it also puts up the open setup network SCOUT-Setup-XXXX with a
 * captive page (setup_page.html) where a phone picks a network, a phone hotspot included, and
 * pastes the station's device token. lib/scout_wifi_setup decides when to open, close and join.
 *
 * Holding the BOOT button for 3 s, or sending W over USB, opens the setup network for 10 min even
 * while connected, to move the station to another network. */
#ifndef SHORE_WIFI_H
#define SHORE_WIFI_H

/* Starts the WiFi task. Call after shore_wifi_store_begin(). */
void shore_wifi_begin();

/* Opens the setup network for 10 min. Safe to call from any task. */
void shore_wifi_open_setup();

/* True while joined to a network with an address. */
bool shore_wifi_connected();

#endif /* SHORE_WIFI_H */
