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
    SCOUT_POWER_NORMAL = 0,    /* full operation: all sensing, transmit in every slot */
    SCOUT_POWER_CONSERVE = 1,  /* skip audio, transmit in fewer slots */
    SCOUT_POWER_CRITICAL = 2,  /* temperature + logging only; no turbidity, audio, or TX */
} scout_power_mode_t;

/* Classify battery voltage into a power mode. conserve_mv > critical_mv. */
scout_power_mode_t scout_power_mode(uint16_t battery_mv, uint16_t conserve_mv, uint16_t critical_mv);

/* Nonessential sensing gates: turbidity runs except in CRITICAL; audio only in NORMAL. */
bool scout_sense_turbidity(scout_power_mode_t mode);
bool scout_sense_audio(scout_power_mode_t mode);

/* Next wake time on the sample grid, strictly after `now_epoch`. E.g. interval 1800 →
 * the next :00 or :30 boundary. Returns now_epoch unchanged if interval_s is 0. */
uint32_t scout_next_wake_epoch(uint32_t now_epoch, uint32_t interval_s);

/* True when `epoch` falls exactly on the sampling grid (e.g. :00 and :30 for 1800 s). */
bool scout_is_sample_time(uint32_t epoch, uint32_t interval_s);

/* Transmit slots are fixed times of day, given as seconds after midnight UTC (SCO-165).
 * Index of the slot `epoch` lands on exactly, or -1 if it isn't a slot time. */
int scout_tx_slot_index(uint32_t epoch, const uint32_t *slots_sod, size_t n);

/* The next thing to wake for, strictly after `now_epoch`: the earlier of the next sample
 * boundary and the next transmit slot (today's or tomorrow's). Pass interval_s 0 for no
 * sampling grid, or n 0 for no slots. */
uint32_t scout_next_event_epoch(uint32_t now_epoch, uint32_t interval_s,
                                const uint32_t *slots_sod, size_t n);

/* Whether a slot actually transmits in this power mode: every slot in NORMAL, every
 * `conserve_every`-th slot (starting at slot 0) in CONSERVE, none in CRITICAL. A missed or
 * skipped slot is simply skipped — there are no retries outside a slot. */
bool scout_slot_transmits(scout_power_mode_t mode, int slot_index, uint32_t conserve_every);

/* Battery gate: true when the pack is at or above the skip-TX threshold. */
bool scout_battery_ok(uint16_t battery_mv, uint16_t min_mv);

/* True when this wake lands exactly on one of the daily audio hours (UTC, minute 00). */
bool scout_should_record_audio(uint32_t now_epoch, const uint8_t *hours_utc, size_t n);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_SCHEDULER_H */
