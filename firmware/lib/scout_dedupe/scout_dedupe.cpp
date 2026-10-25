#include "scout_dedupe.h"

void scout_dedupe_init(ScoutDedupe *d) {
    d->count = 0;
    d->next = 0;
}

bool scout_dedupe_first_seen(ScoutDedupe *d, uint16_t buoy_id, uint32_t record_seq) {
    for (size_t i = 0; i < d->count; i++) {
        if (d->buoy_id[i] == buoy_id && d->record_seq[i] == record_seq) {
            return false;
        }
    }
    d->buoy_id[d->next] = buoy_id;
    d->record_seq[d->next] = record_seq;
    d->next = (d->next + 1) % SCOUT_DEDUPE_CAPACITY;
    if (d->count < SCOUT_DEDUPE_CAPACITY) {
        d->count++;
    }
    return true;
}
