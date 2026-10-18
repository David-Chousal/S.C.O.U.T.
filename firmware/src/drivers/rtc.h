/* PCF8523 real-time clock on the Adalogger FeatherWing (via RTClib) — the battery-backed wall
 * clock. It does not wake the MCU: standby wake comes from the SAMD21's own RTC (SCO-196), and
 * main.cpp re-reads this clock after every wake, so the SAMD21 RTC only ever times one interval
 * and its drift never accumulates. */
#ifndef SCOUT_DRIVER_RTC_H
#define SCOUT_DRIVER_RTC_H

#include <RTClib.h>

/* Named ScoutRtc, not Rtc: the SAMD21 CMSIS device header (samd21g18a.h) defines
 * `typedef union {...} Rtc` for the MCU's own RTC peripheral, and a bare `class Rtc` here
 * collides with it — "using typedef-name 'Rtc' after 'class'" — which breaks every target
 * build. The native test env never includes CMSIS, so the collision is invisible off-target. */
class ScoutRtc {
public:
    bool begin() { return rtc_.begin(); }

    /* True if the clock lost power / was never set — the time can't be trusted. */
    bool lostPower() { return rtc_.lostPower() || !rtc_.initialized(); }

    uint32_t nowEpoch() { return rtc_.now().unixtime(); }

    void setTime(uint32_t epoch) { rtc_.adjust(DateTime((uint32_t)epoch)); }

private:
    RTC_PCF8523 rtc_;
};

#endif
