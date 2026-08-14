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

/* Power-resilience modes (MVP graceful-degradation), ordered by severity. As the battery
 * falls the buoy first slows transmission, then drops nonessential sensing, always keeping
 * core temperature logging. */
typedef enum {
    SCOUT_POWER_NORMAL = 0,    /* full operation: all sensing, transmit each period */
    SCOUT_POWER_CONSERVE = 1,  /* skip audio, transmit less often */
    SCOUT_POWER_CRITICAL = 2,  /* temperature + logging only; no turbidity, audio, or TX */
} scout_power_mode_t;

/* Classify battery voltage into a power mode. conserve_mv > critical_mv. */
scout_power_mode_t scout_power_mode(uint16_t battery_mv, uint16_t conserve_mv, uint16_t critical_mv);

/* Transmit period for a mode: NORMAL → base_period_s, CONSERVE → base × conserve_factor,
 * CRITICAL → UINT32_MAX (never; callers should also gate on mode != CRITICAL). */
uint32_t scout_transmit_period_s(scout_power_mode_t mode, uint32_t base_period_s,
                                 uint32_t conserve_factor);

/* Nonessential sensing gates: turbidity runs except in CRITICAL; audio only in NORMAL. */
bool scout_sense_turbidity(scout_power_mode_t mode);
bool scout_sense_audio(scout_power_mode_t mode);

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
