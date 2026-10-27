/* acoustic_config.h — assembles the ScoutAcousticConfig from the values in config.h.
 *
 * Shared by main.cpp and test/test_acoustic, so the native tests run the exact configuration
 * the buoy flies. Hardware-free: config.h and scout_acoustic.h need only <stdint.h>. */
#ifndef SCOUT_ACOUSTIC_CONFIG_H
#define SCOUT_ACOUSTIC_CONFIG_H

#include "config.h"
#include "scout_acoustic.h"

static inline ScoutAcousticConfig scout_acoustic_build_config() {
    ScoutAcousticConfig cfg;
    cfg.adc_bits = ACOUSTIC_ADC_BITS;
    cfg.input_shift = ACOUSTIC_INPUT_SHIFT;
    cfg.dc_pole_shift = ACOUSTIC_DC_POLE_SHIFT;
    cfg.dc_frac_bits = ACOUSTIC_DC_FRAC_BITS;
    for (int i = 0; i < SCOUT_ACOUSTIC_SECTIONS; i++) {
        cfg.sections[i].c1 = (int8_t)ACOUSTIC_BIQUADS[i][0];
        cfg.sections[i].gain = ACOUSTIC_BIQUADS[i][1];
        cfg.sections[i].a1 = (int16_t)ACOUSTIC_BIQUADS[i][2];
        cfg.sections[i].a2 = (int16_t)ACOUSTIC_BIQUADS[i][3];
        cfg.sections[i].shift = (uint8_t)ACOUSTIC_BIQUADS[i][4];
    }
    cfg.snap_threshold_q4 = ACOUSTIC_SNAP_THRESHOLD_Q4;
    cfg.snap_min_abs = ACOUSTIC_SNAP_MIN_ABS;
    cfg.snap_refractory_samples = ACOUSTIC_SNAP_REFRACTORY_SAMPLES;
    cfg.snap_floor_shift = ACOUSTIC_SNAP_FLOOR_SHIFT;
    cfg.snap_warmup_samples = ACOUSTIC_SNAP_WARMUP_SAMPLES;
    cfg.snap_warmup_shift = ACOUSTIC_SNAP_WARMUP_SHIFT;
    cfg.clip_margin = ACOUSTIC_CLIP_MARGIN;
    return cfg;
}

#endif /* SCOUT_ACOUSTIC_CONFIG_H */
