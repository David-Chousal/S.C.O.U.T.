/*
 * scout_scheduler — duty-cycle timing decisions, as pure functions.
 *
 * Kept hardware-free (only <stdint.h>/<stddef.h>) so the scheduling math is unit-tested
 * off-target. The state machine in main.cpp calls these; they own no state and touch no
 * peripherals.
 */
#ifndef SCOUT_SCHEDULER_H
#define SCOUT_SCHEDULER_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_SECONDS_PER_DAY 86400u

/* Next wake time on the sample grid, strictly after `now_epoch`. E.g. interval 1800 →
 * the next :00 or :30 boundary. Returns now_epoch unchanged if interval_s is 0. */
uint32_t scout_next_wake_epoch(uint32_t now_epoch, uint32_t interval_s);

/* True when it's time to transmit: never transmitted (last_tx_epoch == 0), or at least
 * `period_s` has elapsed since the last transmission (period_s = 86400 for once/day). */
bool scout_is_transmit_cycle(uint32_t now_epoch, uint32_t last_tx_epoch, uint32_t period_s);

/* Battery gate: true when the pack is at or above the skip-TX threshold. */
bool scout_battery_ok(uint16_t battery_mv, uint16_t min_mv);

/* True when this wake lands exactly on one of the daily audio hours (UTC, minute 00). */
bool scout_should_record_audio(uint32_t now_epoch, const uint8_t *hours_utc, size_t n);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_SCHEDULER_H */
