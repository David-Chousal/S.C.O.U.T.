#include "scout_upload_queue.h"

static size_t slot(const ScoutUploadQueue *q, size_t index) {
    return (q->head + index) % SCOUT_UPLOAD_QUEUE_CAPACITY;
}

void scout_upload_queue_init(ScoutUploadQueue *q) {
    q->head = 0;
    q->count = 0;
    q->dropped = 0;
}

void scout_upload_queue_push(ScoutUploadQueue *q, const ScoutReading *r) {
    if (q->count == SCOUT_UPLOAD_QUEUE_CAPACITY) {
        scout_upload_queue_pop(q, 1);
        q->dropped++;
    }
    q->items[slot(q, q->count)] = *r;
    q->count++;
}

size_t scout_upload_queue_peek(const ScoutUploadQueue *q, ScoutReading *out, size_t max) {
    size_t n = max < q->count ? max : q->count;
    for (size_t i = 0; i < n; i++) {
        out[i] = q->items[slot(q, i)];
    }
    return n;
}

void scout_upload_queue_pop(ScoutUploadQueue *q, size_t n) {
    if (n > q->count) {
        n = q->count;
    }
    q->head = slot(q, n);
    q->count -= n;
}

void scout_upload_queue_remove(ScoutUploadQueue *q, size_t index) {
    if (index >= q->count) {
        return;
    }
    for (size_t i = index; i + 1 < q->count; i++) {
        q->items[slot(q, i)] = q->items[slot(q, i + 1)];
    }
    q->count--;
}
