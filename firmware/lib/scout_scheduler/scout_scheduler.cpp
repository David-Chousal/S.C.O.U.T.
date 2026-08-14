#include "scout_scheduler.h"

uint32_t scout_next_wake_epoch(uint32_t now_epoch, uint32_t interval_s) {
    if (interval_s == 0) {
        return now_epoch;
    }
    return ((now_epoch / interval_s) + 1) * interval_s;
}

bool scout_is_transmit_cycle(uint32_t now_epoch, uint32_t last_tx_epoch, uint32_t period_s) {
    if (last_tx_epoch == 0) {
        return true;  // never transmitted yet
    }
    if (now_epoch < last_tx_epoch) {
        return false;  // clock moved backwards (RTC reset) — wait for a fresh baseline
    }
    return (now_epoch - last_tx_epoch) >= period_s;
}

bool scout_battery_ok(uint16_t battery_mv, uint16_t min_mv) {
    return battery_mv >= min_mv;
}

bool scout_should_record_audio(uint32_t now_epoch, const uint8_t *hours_utc, size_t n) {
    uint32_t second_of_day = now_epoch % SCOUT_SECONDS_PER_DAY;
    if (second_of_day % 3600u != 0) {
        return false;  // only on the top of an hour
    }
    uint8_t hour = (uint8_t)(second_of_day / 3600u);
    for (size_t i = 0; i < n; i++) {
        if (hours_utc[i] == hour) {
            return true;
        }
    }
    return false;
}
