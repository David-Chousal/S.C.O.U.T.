/* The shore station's WiFi side (SCO-237): NTP, pushing readings to the console, and pulling
 * the transmit count asked of each buoy. Runs as its own FreeRTOS task on core 0, so the LoRa
 * loop on core 1 never waits on the network.
 *
 * The two sides share ShoreShared under one mutex: the radio loop adds decoded readings to the
 * queue and reads the clock and requested counts; the network task drains the queue and updates
 * the clock and counts. Every path that worked before still works without WiFi: frames are
 * printed over USB for the computer bridge (SCO-257), and T<epoch> / N<buoy>:<count> are read
 * over USB. */
#ifndef SHORE_NET_H
#define SHORE_NET_H

#include <stdint.h>

#include "scout_shore_clock.h"
#include "scout_upload_queue.h"

#define SHORE_MAX_BUOY_ID 8 /* two planned per station (2026-09-24) */

struct ShoreShared {
    ScoutUploadQueue queue;
    ScoutShoreClock clock;
    uint8_t requested[SHORE_MAX_BUOY_ID + 1]; /* index = buoy_id; 0 = nothing requested */
};

extern ShoreShared g_shared;

/* Holds the shared-state mutex for its scope. */
class ShoreLock {
public:
    ShoreLock();
    ~ShoreLock();
    ShoreLock(const ShoreLock &) = delete;
    ShoreLock &operator=(const ShoreLock &) = delete;
};

/* Creates the mutex and the shared state; call first in setup(). */
void shore_shared_begin(uint32_t now, uint32_t min_valid_epoch);

/* Starts the network task when shore_secrets.h gives a WiFi network and a device token; otherwise
 * prints why WiFi is off and returns. */
void shore_net_begin();

#endif /* SHORE_NET_H */
