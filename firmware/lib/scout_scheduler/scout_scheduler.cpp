#include "scout_scheduler.h"

scout_power_mode_t scout_power_mode(uint16_t battery_mv, uint16_t conserve_mv,
                                    uint16_t critical_mv) {
    if (battery_mv >= conserve_mv) {
        return SCOUT_POWER_NORMAL;
    }
    if (battery_mv >= critical_mv) {
        return SCOUT_POWER_CONSERVE;
    }
    return SCOUT_POWER_CRITICAL;
}

uint32_t scout_transmit_period_s(scout_power_mode_t mode, uint32_t base_period_s,
                                 uint32_t conserve_factor) {
    switch (mode) {
        case SCOUT_POWER_NORMAL:
            return base_period_s;
        case SCOUT_POWER_CONSERVE:
            return base_period_s * conserve_factor;
        case SCOUT_POWER_CRITICAL:
        default:
            return UINT32_MAX;
    }
}

bool scout_sense_turbidity(scout_power_mode_t mode) {
    return mode != SCOUT_POWER_CRITICAL;
}

bool scout_sense_audio(scout_power_mode_t mode) {
    return mode == SCOUT_POWER_NORMAL;
}

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
