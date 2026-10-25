/* Hydrophone capture hook — the interface the acoustic summary is wired to (SCO-233).
 *
 * ⚠️ THE CAPTURE PATH IS NOT BUILT. It is SCO-231, which waits on the amplifier choice
 * (SCO-216). Until then record() records nothing and returns false, so the buoy reports
 * audio_present = 0, a blank audio_file and no acoustic summary. Nothing here pretends a
 * recording happened.
 *
 * The contract SCO-231 must meet, so the summary needs no change when it lands:
 *   - Sample PIN_AUDIO_PREAMP at ACOUSTIC_SAMPLE_RATE_HZ for `seconds`, timer-triggered into DMA
 *     double buffers, with the preamp powered through PIN_AUDIO_GATE only while recording.
 *   - Pass every block of raw ADC codes (0..2^ACOUSTIC_ADC_BITS − 1) to the WAV file at
 *     /AUDIO/<path> AND to scout_acoustic_feed(summary, block, n), in order, none dropped.
 *   - Return true only when the whole clip was captured and written; on false the caller
 *     discards the summary and the row says no audio.
 * CPU budget for the summary at 22,050 Hz is estimated in the SCO-233 PR; it must be measured
 * on hardware alongside the SD writes before this is trusted. */
#ifndef SCOUT_DRIVER_AUDIO_CAPTURE_H
#define SCOUT_DRIVER_AUDIO_CAPTURE_H

#include <stdint.h>

#include "../config.h"
#include "scout_acoustic.h"

class AudioCapture {
public:
    /* Record one clip to /AUDIO/<path>, feeding each block to `summary` (already initialised).
     * Returns true only if a recording was actually captured. Not built: always false. */
    bool record(const char *path, uint16_t seconds, ScoutAcoustic *summary) {
        (void)path;
        (void)seconds;
        (void)summary;
        return false;
    }
};

#endif
