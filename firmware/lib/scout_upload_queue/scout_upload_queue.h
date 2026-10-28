/*
 * scout_upload_queue — readings the shore station has received but not yet pushed to the
 * console (SCO-237), as pure functions.
 *
 * The S3 keeps listening while WiFi or the console is down, so decoded readings wait here and go
 * up in order once it is back. Re-sending is safe: the console stores each (buoy_id, record_seq)
 * once. When the queue is full the OLDEST reading is dropped (and counted), so the console still
 * shows the latest state after a long outage; every reading is on the buoy's SD card regardless,
 * and the computer bridge (SCO-257) and SD-card import recover what the queue could not hold.
 * RAM only: a power cut empties it, for the same reason.
 *
 * Kept hardware-free (no Arduino, no locks) so it is unit-tested off-target; the caller locks.
 */
#ifndef SCOUT_UPLOAD_QUEUE_H
#define SCOUT_UPLOAD_QUEUE_H

#include <stddef.h>
#include <stdint.h>

#include "scout_packet.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Two buoys × three slots a day is six readings: 256 is about six weeks offline (~14 KB). */
#define SCOUT_UPLOAD_QUEUE_CAPACITY 256

typedef struct {
    ScoutReading items[SCOUT_UPLOAD_QUEUE_CAPACITY];
    size_t head;      /* oldest reading */
    size_t count;
    uint32_t dropped; /* oldest readings overwritten because the queue was full */
} ScoutUploadQueue;

void scout_upload_queue_init(ScoutUploadQueue *q);

/* Adds a reading; when full, drops the oldest first. */
void scout_upload_queue_push(ScoutUploadQueue *q, const ScoutReading *r);

/* Copies up to `max` of the oldest readings, oldest first, without removing them. Returns how
 * many were copied. */
size_t scout_upload_queue_peek(const ScoutUploadQueue *q, ScoutReading *out, size_t max);

/* Removes the `n` oldest readings (all of them if n > count). */
void scout_upload_queue_pop(ScoutUploadQueue *q, size_t n);

/* Removes the reading `index` places from the oldest: one the console refused as invalid,
 * which would otherwise block the queue forever. */
void scout_upload_queue_remove(ScoutUploadQueue *q, size_t index);

#ifdef __cplusplus
}
#endif

#endif /* SCOUT_UPLOAD_QUEUE_H */
