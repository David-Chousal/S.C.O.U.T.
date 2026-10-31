/*
 * scout_dedupe — drop repeated readings at the shore station (SCO-24), as pure functions.
 *
 * Same key as the Python store (shore/scout_shore/store.py): (buoy_id, record_seq, timestamp).
 * The timestamp is in the key because a buoy that loses power restarts record_seq at 0, and a
 * repeat always carries its original's timestamp. The
 * station keeps only the most recent SCOUT_DEDUPE_CAPACITY keys, which is enough because a
 * repeat arrives within one transmit slot of the original; the full history is the dashboard's
 * job, not the radio's.
 *
 * Kept hardware-free (only <stdint.h>) so it is unit-tested off-target.
 */
#ifndef SCOUT_DEDUPE_H
#define SCOUT_DEDUPE_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

/* Two buoys × three slots a day is six readings; 16 covers more than two days of both. */
#define SCOUT_DEDUPE_CAPACITY 16

typedef struct {
    uint16_t buoy_id[SCOUT_DEDUPE_CAPACITY];
    uint32_t record_seq[SCOUT_DEDUPE_CAPACITY];
    uint32_t timestamp[SCOUT_DEDUPE_CAPACITY];
    size_t count; /* filled entries, up to capacity */
    size_t next;  /* slot the next new key overwrites */
} ScoutDedupe;

void scout_dedupe_init(ScoutDedupe *d);

/* True the first time a key is seen (and remembers it); false for a repeat. When full, the
 * oldest key is forgotten. */
bool scout_dedupe_first_seen(ScoutDedupe *d, uint16_t buoy_id, uint32_t record_seq, uint32_t timestamp);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_DEDUPE_H */
