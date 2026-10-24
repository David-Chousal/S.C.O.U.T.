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

bool scout_is_sample_time(uint32_t epoch, uint32_t interval_s) {
    return interval_s != 0 && epoch % interval_s == 0;
}

int scout_tx_slot_index(uint32_t epoch, const uint32_t *slots_sod, size_t n) {
    uint32_t second_of_day = epoch % SCOUT_SECONDS_PER_DAY;
    for (size_t i = 0; i < n; i++) {
        if (slots_sod[i] == second_of_day) {
            return (int)i;
        }
    }
    return -1;
}

uint32_t scout_next_event_epoch(uint32_t now_epoch, uint32_t interval_s,
                                const uint32_t *slots_sod, size_t n) {
    uint32_t best = (interval_s != 0) ? scout_next_wake_epoch(now_epoch, interval_s) : UINT32_MAX;
    uint32_t midnight = now_epoch - (now_epoch % SCOUT_SECONDS_PER_DAY);
    for (size_t i = 0; i < n; i++) {
        uint32_t slot = midnight + slots_sod[i];
        if (slot <= now_epoch) {
            slot += SCOUT_SECONDS_PER_DAY;  // already passed today → tomorrow's
        }
        if (slot < best) {
            best = slot;
        }
    }
    return best;
}

bool scout_slot_transmits(scout_power_mode_t mode, int slot_index, uint32_t conserve_every) {
    if (slot_index < 0) {
        return false;
    }
    switch (mode) {
        case SCOUT_POWER_NORMAL:
            return true;
        case SCOUT_POWER_CONSERVE:
            return conserve_every == 0 || (uint32_t)slot_index % conserve_every == 0;
        case SCOUT_POWER_CRITICAL:
        default:
            return false;
    }
}

bool scout_in_listen_window(uint32_t epoch, const uint32_t *slots_sod, size_t n,
                            uint32_t half_width_s) {
    uint32_t second_of_day = epoch % SCOUT_SECONDS_PER_DAY;
    for (size_t i = 0; i < n; i++) {
        uint32_t ahead =
            (second_of_day + SCOUT_SECONDS_PER_DAY - slots_sod[i]) % SCOUT_SECONDS_PER_DAY;
        uint32_t behind = SCOUT_SECONDS_PER_DAY - ahead;
        uint32_t distance = ahead < behind ? ahead : behind;
        if (distance <= half_width_s) {
            return true;
        }
    }
    return false;
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
