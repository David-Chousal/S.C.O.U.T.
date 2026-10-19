/*
 * scout_timeset — the bench clock-set command, as a pure function (SCO-201).
 *
 * Nothing on the buoy knows the real time until a human gives it one: a new or reset PCF8523
 * starts from whatever it powers up with, and the transmit slots are UTC times of day. At boot,
 * while USB is connected, main.cpp accepts one line "T<unix-epoch>" (seconds, UTC) and writes it
 * to the RTC. firmware/tools/set_rtc.py sends it.
 */
#ifndef SCOUT_TIMESET_H
#define SCOUT_TIMESET_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

/* Parse "T<digits>" (trailing CR/LF/spaces ignored). Writes *out_epoch and returns true only
 * for a value that fits in 32 bits and is >= min_epoch; otherwise leaves *out_epoch alone. */
bool scout_parse_time_command(const char *line, uint32_t min_epoch, uint32_t *out_epoch);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_TIMESET_H */
