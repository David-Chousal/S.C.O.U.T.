#include "scout_shore_clock.h"

void scout_clock_boot(ScoutShoreClock *c, uint32_t now, uint32_t min_valid_epoch) {
    c->source = now >= min_valid_epoch ? SCOUT_CLOCK_KEPT : SCOUT_CLOCK_UNSET;
    c->set_at = c->source == SCOUT_CLOCK_KEPT ? now : 0;
}

void scout_clock_set(ScoutShoreClock *c, ScoutClockSource source, uint32_t now) {
    c->source = source;
    c->set_at = now;
}

bool scout_clock_valid(const ScoutShoreClock *c) { return c->source != SCOUT_CLOCK_UNSET; }

bool scout_clock_ntp_due(const ScoutShoreClock *c, uint32_t now) {
    if (c->source != SCOUT_CLOCK_NTP || now < c->set_at) {
        return true;
    }
    return now - c->set_at >= SCOUT_CLOCK_NTP_RESYNC_S;
}

const char *scout_clock_source_name(ScoutClockSource source) {
    switch (source) {
        case SCOUT_CLOCK_NTP:
            return "ntp";
        case SCOUT_CLOCK_MANUAL:
            return "manual";
        case SCOUT_CLOCK_KEPT:
            return "kept";
        case SCOUT_CLOCK_UNSET:
        default:
            return "unset";
    }
}
