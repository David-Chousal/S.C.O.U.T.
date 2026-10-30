#include "scout_wdt_test.h"

bool scout_wdt_test_should_hang(bool last_reset_was_watchdog, uint32_t cycle,
                                uint32_t hang_cycle) {
    return !last_reset_was_watchdog && cycle == hang_cycle;
}
