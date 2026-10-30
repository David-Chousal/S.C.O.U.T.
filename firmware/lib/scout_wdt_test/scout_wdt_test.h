/*
 * Forced watchdog reset for the Stage 5 bench test (integration runbook gate G6).
 *
 * Built only into env feather_m0_wdt_test (-DSCOUT_WDT_TEST). On any boot that the watchdog
 * did not cause, the firmware hangs on one chosen cycle without petting the watchdog, so it
 * fires and resets the board. The boot after that reset sees the watchdog as the cause and
 * never hangs again, so the test produces exactly one reset per power-on or button press.
 *
 * Kept hardware-free (only <stdint.h>) so the rule is unit-tested off-target.
 */
#ifndef SCOUT_WDT_TEST_H
#define SCOUT_WDT_TEST_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Cycle (0 = the first pass after boot) that hangs. Cycle 1, not 0, so one reading is logged
 * first and the test also shows record_seq continuing across the reset. */
#define SCOUT_WDT_TEST_HANG_CYCLE 1u

/* True when this cycle should hang: the last reset was not the watchdog and this is the
 * chosen cycle. */
bool scout_wdt_test_should_hang(bool last_reset_was_watchdog, uint32_t cycle,
                                uint32_t hang_cycle);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_WDT_TEST_H */
