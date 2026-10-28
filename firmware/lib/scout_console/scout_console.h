/*
 * scout_console — what the shore station sends to, and reads from, the S.C.O.U.T. Console
 * (SCO-237), as pure functions.
 *
 * The ESP32-S3 shore station pushes each decoded reading to the console's device API as a schema
 * row (`POST /api/device/readings`, console/worker/device.js) and reads the transmit count asked
 * of each buoy (`GET /api/device/settings`). The console keeps a row exactly as sent, and the
 * computer bridge and SD-card import build the same rows in Python, so scout_console_row() must
 * match shore/scout_shore/schema.py reading_to_row() to the character. Python's float formatting
 * is the hard part, so numbers are formatted here with exact rounding, never printf("%f").
 * test/test_console/row_vectors.h, generated from the Python, holds the two together.
 *
 * Kept hardware-free (no Arduino, no heap) so it is unit-tested off-target.
 */
#ifndef SCOUT_CONSOLE_H
#define SCOUT_CONSOLE_H

#include <stddef.h>
#include <stdint.h>

#include "scout_packet.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Longest row scout_console_row() writes, with its terminator (measured worst case ~560). */
#define SCOUT_CONSOLE_ROW_MAX 768

/* The console refuses more rows than this in one request (MAX_ROWS in device.js). */
#define SCOUT_CONSOLE_MAX_BATCH 200

/* Python's format(value, ".<decimals>f"): rounds the exact binary value of `value`, ties to
 * even, and keeps the sign of a negative value that rounds to zero ("-0.00"). decimals <= 3 and
 * |value| < 1e6. Returns the length written, or 0 if it does not fit or is out of range. */
size_t scout_format_fixed(double value, unsigned decimals, char *out, size_t cap);

/* One schema row as compact JSON, keys in schema order, every value a string. Returns the
 * length written (without the terminator), or 0 if `cap` is too small. */
size_t scout_console_row(const ScoutReading *r, char *out, size_t cap);

/* {"rows":[...]} with as many of `rows` as fit in `cap` (at most SCOUT_CONSOLE_MAX_BATCH).
 * Returns how many rows went in; *len gets the body length. 0 rows means `cap` is too small. */
size_t scout_console_batch(const ScoutReading *rows, size_t count, char *out, size_t cap,
                           size_t *len);

/* The index in "row <n> is not a valid schema row", the console's 400 for a bad row; -1 when
 * the body names no row. */
int scout_console_bad_row(const char *body);

/* Read {"buoys":[{"buoy_id":1,"tx_count_requested":2},...]} into requested[0..slots-1]
 * (index = buoy_id, 0 = nothing requested). Buoys the console does not list are cleared,
 * because the console is the source of truth once it answers; ids >= slots and counts outside
 * 1-3 are skipped. Returns how many buoys were set, or -1 (requested untouched) if the body is
 * not a settings reply. */
int scout_console_parse_settings(const char *body, uint8_t *requested, size_t slots);

#ifdef __cplusplus
}
#endif

#endif /* SCOUT_CONSOLE_H */
