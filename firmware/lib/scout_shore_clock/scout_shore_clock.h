/*
 * scout_shore_clock — where the shore station's time came from, and when to refresh it (SCO-237),
 * as pure functions.
 *
 * The station's clock only tags whether a packet landed inside its slot window and stamps
 * downlink counters; readings carry the buoy's own timestamp. Sources, best first:
 *
 *   NTP     over WiFi, re-synced every SCOUT_CLOCK_NTP_RESYNC_S while WiFi is up.
 *   MANUAL  "T<unix-epoch>" over USB (firmware/tools/set_rtc.py), the fallback with no WiFi.
 *   KEPT    found already set at boot: the ESP32's RTC timer keeps system time through every
 *           reset except power-on (ESP-IDF "System Time"), so a crash or watchdog reset does not
 *           lose it. The internal clock is also what keeps time between NTP syncs.
 *   UNSET   power-on with no WiFi and no USB: there is no battery-backed clock on the S3.
 *
 * Kept hardware-free so it is unit-tested off-target.
 */
#ifndef SCOUT_SHORE_CLOCK_H
#define SCOUT_SHORE_CLOCK_H

#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

/* The ESP32's clock drifts on the order of seconds a day; the slot window is ±120 s. */
#define SCOUT_CLOCK_NTP_RESYNC_S (6u * 3600u)

typedef enum {
    SCOUT_CLOCK_UNSET = 0,
    SCOUT_CLOCK_KEPT,
    SCOUT_CLOCK_MANUAL,
    SCOUT_CLOCK_NTP,
} ScoutClockSource;

typedef struct {
    ScoutClockSource source;
    uint32_t set_at; /* epoch seconds when the source last set the clock */
} ScoutShoreClock;

/* At boot: a clock already past min_valid_epoch survived the reset (KEPT); otherwise UNSET. */
void scout_clock_boot(ScoutShoreClock *c, uint32_t now, uint32_t min_valid_epoch);

/* Record that `source` just set the clock to `now`. */
void scout_clock_set(ScoutShoreClock *c, ScoutClockSource source, uint32_t now);

bool scout_clock_valid(const ScoutShoreClock *c);

/* True when the station should ask NTP: never synced by NTP, or the last sync is stale (or the
 * clock moved backwards past it). */
bool scout_clock_ntp_due(const ScoutShoreClock *c, uint32_t now);

const char *scout_clock_source_name(ScoutClockSource source);

#ifdef __cplusplus
}
#endif

#endif /* SCOUT_SHORE_CLOCK_H */
