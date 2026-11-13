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

#include "scout_downlink.h"
#include "scout_packet.h"
#include "scout_settings.h"

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

/* What the console wants for one buoy: the transmit count (0 = nothing asked) for buoys still on
 * packet v4, and the whole settings snapshot for v5 buoys. */
typedef struct {
    uint8_t tx_count;
    uint8_t has_settings;
    ScoutSettings settings;
} ScoutWanted;

#define SCOUT_WANTED_MAX_SLOTS 64u

/* Read {"buoys":[{"buoy_id":1,"tx_count_requested":2,"settings":"2,0,30,60,3200,3100,3,70"},...]}
 * into wanted[0..slots-1] (index = buoy_id). "settings" is checked exactly as an S line is
 * (scout_dl_parse_settings_command); a snapshot the buoy would refuse is left out. Buoys the console
 * does not list are cleared. Returns how many buoys have something wanted, or -1 (wanted untouched)
 * if the body is not a settings reply. */
int scout_console_parse_wanted(const char *body, ScoutWanted *wanted, size_t slots);

/* "wifi_setup_requested_at" from the same reply: when an admin pressed Change WiFi on the Stations
 * page (unix seconds), or 0 when there is no live request (SCO-310). */
uint32_t scout_console_wifi_setup_at(const char *body);

#ifdef __cplusplus
}
#endif

#endif /* SCOUT_CONSOLE_H */
