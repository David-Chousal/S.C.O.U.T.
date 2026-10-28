/* Shore station WiFi and console settings (SCO-237). TEMPLATE: copy it, never fill it in here.
 *
 *   cp firmware/src/shore_rx/shore_secrets_example.h firmware/src/shore_rx/shore_secrets.h
 *
 * shore_secrets.h is gitignored. Without it the station builds with WiFi off: it still receives,
 * prints every frame over USB for the computer bridge (SCO-257), and takes T<epoch> and
 * N<buoy>:<count> over USB, exactly as before.
 *
 * SHORE_CONSOLE_TOKEN is the shore station's device token: an admin creates it on the console's
 * Stations page, which shows it once. It can only push readings and read transmit counts, and
 * revoking it on that page cuts the station off.
 */
#ifndef SHORE_SECRETS_H
#define SHORE_SECRETS_H

#define SHORE_WIFI_SSID ""
#define SHORE_WIFI_PASSWORD ""
#define SHORE_CONSOLE_URL "https://scout-console.scout1.workers.dev"
#define SHORE_CONSOLE_TOKEN ""

#endif /* SHORE_SECRETS_H */
