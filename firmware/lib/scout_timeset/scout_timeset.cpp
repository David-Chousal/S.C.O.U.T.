#include "scout_timeset.h"

static bool is_trailing_space(char c) {
    return c == '\r' || c == '\n' || c == ' ' || c == '\t';
}

bool scout_parse_time_command(const char *line, uint32_t min_epoch, uint32_t *out_epoch) {
    if (line == NULL || out_epoch == NULL || line[0] != 'T') {
        return false;
    }
    uint64_t value = 0;
    int digits = 0;
    const char *p = line + 1;
    for (; *p >= '0' && *p <= '9'; p++) {
        value = value * 10u + (uint64_t)(*p - '0');
        if (value > UINT32_MAX) {
            return false;  // overflow: also stops a runaway digit string early
        }
        digits++;
    }
    for (; *p != '\0'; p++) {
        if (!is_trailing_space(*p)) {
            return false;  // a non-digit inside the number, or junk after it
        }
    }
    if (digits == 0 || value < min_epoch) {
        return false;
    }
    *out_epoch = (uint32_t)value;
    return true;
}

bool scout_clock_trusted(bool rtc_ok, bool lost_power, uint32_t now, uint32_t min_epoch) {
    return rtc_ok && !lost_power && now >= min_epoch;
}

int32_t scout_clock_correction_s(uint32_t buoy_now, uint32_t shore_now, uint32_t deadband_s,
                                 uint32_t max_step_s) {
    bool ahead = shore_now > buoy_now;  // the buoy is behind and must move forward
    uint32_t distance = ahead ? shore_now - buoy_now : buoy_now - shore_now;
    if (distance <= deadband_s) {
        return 0;
    }
    uint32_t step = distance < max_step_s ? distance : max_step_s;
    if (step > (uint32_t)INT32_MAX) {
        step = (uint32_t)INT32_MAX;
    }
    return ahead ? (int32_t)step : -(int32_t)step;
}
