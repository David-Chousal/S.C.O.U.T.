#include "scout_link.h"

/* Headroom factor against the watchdog: the longest un-petted stretch must fit at least
 * twice over. A tighter margin would leave nothing for SD retries or a slow sensor in the
 * same wake. */
#define SCOUT_LINK_WDT_HEADROOM 2u

uint8_t scout_link_repeat_count(scout_power_mode_t mode, uint8_t normal_repeats,
                                uint8_t conserve_repeats) {
    switch (mode) {
        case SCOUT_POWER_NORMAL:
            return normal_repeats;
        case SCOUT_POWER_CONSERVE:
            return conserve_repeats;
        default:
            return 0; /* CRITICAL: never transmit */
    }
}

uint32_t scout_link_repeat_delay_ms(uint8_t completed, uint32_t base_delay_ms) {
    if (completed == 0) {
        return 0;
    }
    return base_delay_ms * (uint32_t)completed;
}

uint32_t scout_link_max_segment_ms(uint8_t repeats, uint32_t base_delay_ms,
                                   uint32_t tx_budget_ms) {
    if (repeats == 0) {
        return 0;
    }
    /* The last copy has no gap after it, so the widest gap follows copy (repeats - 1). */
    return tx_budget_ms + scout_link_repeat_delay_ms((uint8_t)(repeats - 1), base_delay_ms);
}

bool scout_link_fits_watchdog(uint8_t repeats, uint32_t base_delay_ms, uint32_t tx_budget_ms,
                              uint32_t wdt_timeout_ms) {
    uint32_t segment = scout_link_max_segment_ms(repeats, base_delay_ms, tx_budget_ms);
    if (segment == 0) {
        return true;
    }
    return segment * SCOUT_LINK_WDT_HEADROOM <= wdt_timeout_ms;
}
