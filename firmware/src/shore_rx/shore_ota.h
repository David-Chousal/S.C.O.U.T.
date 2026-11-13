/* The shore station's half of over-the-air firmware updates (OTA design §4-§6, SCO-197), in
 * SCOUT_OTA builds of the ESP32-S3 receiver.
 *
 * The station relays a bundle that was signed on the release machine; it never holds the
 * signing key. The computer loads a bundle over USB (shore/scripts/push_firmware.py writes the
 * lines; scout_shore/ota.py documents them):
 *
 *   FB<buoy>:<length>       start a job for one buoy, replacing any job loaded before
 *   FD<offset>:<hex>        image bytes at an offset
 *   FM<hex>                 manifest + signature (116 bytes); the station checks the image's
 *                           SHA-256 and the Ed25519 signature, then arms the job
 *   FX                      drop the job
 *
 * After each packet from the job's buoy, scout_ota_shore_step decides: offer the image and run
 * a transfer session (the station's loop is blocked for up to ~6.5 min, so frames from other
 * buoys are missed during it), send CONFIRM to a trial of the job's version, or finish.
 * ⚠️ The station transmits for ~15 min per release: not off the bench until the RFM95W
 * FeatherWing's FCC authorization is checked (OTA design §8, SCO-104). */
#ifndef SHORE_OTA_H
#define SHORE_OTA_H

#include <RH_RF95.h>
#include <stdint.h>

#include "scout_ota.h"
#include "scout_packet.h"

/* A USB line starting with 'F': handles it and returns true. Anything else returns false. */
bool shore_ota_line(const char *line);

/* What to do for this packet's buoy. Returns SCOUT_OTA_STEP_NONE when no job is armed for it. */
scout_ota_step_t shore_ota_step(const ScoutReading &r);

/* The version of the armed job, for the CONFIRM frame. */
uint32_t shore_ota_job_version();

/* The job is finished (DONE) or abandoned: free it. */
void shore_ota_finish(scout_ota_step_t why);

/* Offer the image to `buoy_id`, which is listening right now, and run one transfer session. */
void shore_ota_run_session(RH_RF95 &radio, uint16_t buoy_id);

#endif
