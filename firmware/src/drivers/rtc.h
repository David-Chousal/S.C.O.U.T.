/* PCF8523 real-time clock on the Adalogger FeatherWing (via RTClib).
 * Periodic wake uses the PCF8523 countdown timer, which is the chip's natural fit for a fixed
 * interval — wire its INT1 to PIN_RTC_INT so the MCU can wake from standby. */
#ifndef SCOUT_DRIVER_RTC_H
#define SCOUT_DRIVER_RTC_H

#include <RTClib.h>

#include "../config.h"

class Rtc {
public:
    bool begin() { return rtc_.begin(); }

    /* True if the clock lost power / was never set — the time can't be trusted. */
    bool lostPower() { return rtc_.lostPower() || !rtc_.initialized(); }

    uint32_t nowEpoch() { return rtc_.now().unixtime(); }

    void setTime(uint32_t epoch) { rtc_.adjust(DateTime((uint32_t)epoch)); }

    /* Pulse INT1 every `minutes` via the countdown timer, to wake the MCU on schedule. */
    void enablePeriodicWake(uint8_t minutes) {
        rtc_.deconfigureAllTimers();
        rtc_.enableCountdownTimer(PCF8523_FrequencyMinute, minutes);
    }

private:
    RTC_PCF8523 rtc_;
};

#endif
