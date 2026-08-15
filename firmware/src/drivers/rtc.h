/* PCF8523 real-time clock on the Adalogger FeatherWing (via RTClib).
 * Periodic wake uses the PCF8523 countdown timer, which is the chip's natural fit for a fixed
 * interval — wire its INT1 to PIN_RTC_INT so the MCU can wake from standby. */
#ifndef SCOUT_DRIVER_RTC_H
#define SCOUT_DRIVER_RTC_H

#include <RTClib.h>
#include <Wire.h>

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

    /* After waking, clear the countdown-timer flag (Control_2 CTAF) so INT1 releases and the
     * timer re-arms for the next interval. Preserves the other Control_2 bits. */
    void ackTimer() {
        Wire.beginTransmission(PCF8523_ADDR);
        Wire.write(PCF8523_CONTROL_2);
        Wire.endTransmission(false);
        Wire.requestFrom((int)PCF8523_ADDR, 1);
        uint8_t control_2 = Wire.available() ? Wire.read() : 0;
        control_2 &= (uint8_t)~PCF8523_CTAF;  // flags clear on writing 0; others unchanged
        Wire.beginTransmission(PCF8523_ADDR);
        Wire.write(PCF8523_CONTROL_2);
        Wire.write(control_2);
        Wire.endTransmission();
    }

private:
    static const uint8_t PCF8523_ADDR = 0x68;
    static const uint8_t PCF8523_CONTROL_2 = 0x01;
    static const uint8_t PCF8523_CTAF = 0x40;  // countdown timer A flag
    RTC_PCF8523 rtc_;
};

#endif
