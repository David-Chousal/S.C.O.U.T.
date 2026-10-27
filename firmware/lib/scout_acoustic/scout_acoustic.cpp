#include "scout_acoustic.h"

/* Every step below mirrors analytics/utils/acoustic_summary.py line for line. Signed right
 * shifts are arithmetic (GCC on ARM and on the host, and Python's >>), and left shifts of
 * values that can be negative are written as multiplications to stay defined in C++11. */

#define LOG2_FRAC_BITS 16
#define CDB_PER_LOG2_E6 301030LL         /* 1000 × log10(2) × 1000 */
#define NDSI_SCALE 10000LL
#define NDSI_HEADROOM (1ULL << 48)

void scout_acoustic_init(ScoutAcoustic *a, const ScoutAcousticConfig *cfg) {
    *a = ScoutAcoustic();
    a->cfg = *cfg;
    a->warmup = cfg->snap_warmup_samples;
}

static int16_t clamp16(int64_t v) {
    return v < INT16_MIN ? INT16_MIN : v > INT16_MAX ? INT16_MAX : (int16_t)v;
}

static int16_t biquad(int32_t x, const ScoutBiquad *c, ScoutBiquadState *s) {
    int32_t v = x + c->c1 * (int32_t)s->x1 + s->x2;
    int32_t feedback = (int32_t)c->a1 * s->y1 + (int32_t)c->a2 * s->y2;
    int64_t acc = (int64_t)c->gain * v - (int64_t)feedback * ((int64_t)1 << (c->shift - 14)) +
                  s->err;
    int64_t y = acc >> c->shift;
    if (y > INT16_MAX) {
        y = INT16_MAX;
        s->err = 0;
    } else if (y < INT16_MIN) {
        y = INT16_MIN;
        s->err = 0;
    } else {
        s->err = (int32_t)(acc & (((int64_t)1 << c->shift) - 1));
    }
    s->x2 = s->x1;
    s->x1 = (int16_t)x;
    s->y2 = s->y1;
    s->y1 = (int16_t)y;
    return (int16_t)y;
}

static void snap_step(ScoutAcoustic *a, int32_t magnitude) {
    const ScoutAcousticConfig *cfg = &a->cfg;
    if (a->warmup > 0) {
        a->floor_q8 += (magnitude * 256 - a->floor_q8) >> cfg->snap_warmup_shift;
        a->warmup--;
        return;
    }
    if (a->refractory > 0) { /* the snap's own tail neither counts nor raises the floor */
        a->refractory--;
        return;
    }
    uint32_t threshold_q12 = (uint32_t)a->floor_q8 * cfg->snap_threshold_q4;
    uint32_t floor_q12 = (uint32_t)cfg->snap_min_abs << 12;
    if (threshold_q12 < floor_q12) {
        threshold_q12 = floor_q12;
    }
    if ((uint32_t)magnitude * 4096u > threshold_q12) {
        if (a->snap_count < UINT16_MAX) {
            a->snap_count++;
        }
        a->refractory = cfg->snap_refractory_samples;
    } else {
        a->floor_q8 += (magnitude * 256 - a->floor_q8) >> cfg->snap_floor_shift;
    }
}

void scout_acoustic_feed(ScoutAcoustic *a, const uint16_t *samples, size_t n) {
    const ScoutAcousticConfig *cfg = &a->cfg;
    const int32_t adc_max = (1 << cfg->adc_bits) - 1;
    const int32_t adc_mid = 1 << (cfg->adc_bits - 1);
    const int32_t lo_rail = cfg->clip_margin;
    const int32_t hi_rail = adc_max - cfg->clip_margin;
    const ScoutBiquad *sec = cfg->sections;
    ScoutBiquadState *st = a->sections;

    for (size_t i = 0; i < n; i++) {
        int32_t s = samples[i] > adc_max ? adc_max : samples[i];
        if ((s <= lo_rail || s >= hi_rail) && a->clip_count < UINT16_MAX) {
            a->clip_count++;
        }
        int32_t x = (s - adc_mid) * (1 << cfg->input_shift);
        if (!a->started) { /* start the DC blocker at the first sample, not at a step */
            a->dc_x1 = x;
            a->started = 1;
        }
        a->dc_acc += (x - a->dc_x1) * (1 << cfg->dc_frac_bits) - (a->dc_acc >> cfg->dc_pole_shift);
        a->dc_x1 = x;
        int32_t d = clamp16(a->dc_acc >> cfg->dc_frac_bits);

        int32_t anthro = biquad(biquad(d, &sec[0], &st[0]), &sec[1], &st[1]);
        int32_t mixed = biquad(biquad(d, &sec[2], &st[2]), &sec[3], &st[3]);
        int32_t bio = biquad(biquad(d, &sec[4], &st[4]), &sec[5], &st[5]);
        a->energy_broad += (uint64_t)(uint32_t)(d * d);
        a->energy_anthro += (uint64_t)(uint32_t)(anthro * anthro);
        a->energy_mixed += (uint64_t)(uint32_t)(mixed * mixed);
        a->energy_bio += (uint64_t)(uint32_t)(bio * bio);
        snap_step(a, bio < 0 ? -bio : bio);
        a->samples++;
    }
}

int32_t scout_acoustic_log2_q16(uint64_t value) {
    int32_t exponent = 0;
    while (exponent < 63 && (value >> (exponent + 1)) != 0) {
        exponent++;
    }
    uint64_t mantissa = exponent <= 30 ? value << (30 - exponent) : value >> (exponent - 30);
    int32_t fraction = 0;
    for (int i = 0; i < LOG2_FRAC_BITS; i++) {
        mantissa = (mantissa * mantissa) >> 30;
        fraction <<= 1;
        if (mantissa >= (1ULL << 31)) {
            mantissa >>= 1;
            fraction |= 1;
        }
    }
    return (exponent << LOG2_FRAC_BITS) | fraction;
}

/* num / den rounded half away from zero; den > 0. */
static int64_t div_round(int64_t num, int64_t den) {
    int64_t magnitude = (num < 0 ? -num : num);
    int64_t quotient = (magnitude + den / 2) / den;
    return num < 0 ? -quotient : quotient;
}

static int16_t level_cdb(uint64_t energy, uint32_t count, uint64_t full_scale_power) {
    if (count == 0) {
        return 0;
    }
    if (energy == 0) {
        return SCOUT_ACOUSTIC_LEVEL_SILENT;
    }
    int64_t log2_ratio = (int64_t)scout_acoustic_log2_q16(energy) -
                         scout_acoustic_log2_q16(count) -
                         scout_acoustic_log2_q16(full_scale_power);
    return clamp16(div_round(log2_ratio * CDB_PER_LOG2_E6, 1000LL << LOG2_FRAC_BITS));
}

static int16_t ndsi_e4(uint64_t bio, uint64_t anthro) {
    while (bio + anthro >= NDSI_HEADROOM) {
        bio >>= 1;
        anthro >>= 1;
    }
    uint64_t total = bio + anthro;
    if (total == 0) {
        return 0;
    }
    return (int16_t)div_round(((int64_t)bio - (int64_t)anthro) * NDSI_SCALE, (int64_t)total);
}

void scout_acoustic_finalize(const ScoutAcoustic *a, ScoutAcousticSummary *out) {
    ScoutAcousticSummary r = ScoutAcousticSummary();
    if (a->samples > 0) {
        uint64_t amplitude = (uint64_t)((1 << (a->cfg.adc_bits - 1)) - 1) << a->cfg.input_shift;
        uint64_t reference = amplitude * amplitude / 2; /* full-scale sine = 0 dB */
        r.lvl_anthro_cdb = level_cdb(a->energy_anthro, a->samples, reference);
        r.lvl_mixed_cdb = level_cdb(a->energy_mixed, a->samples, reference);
        r.lvl_bio_cdb = level_cdb(a->energy_bio, a->samples, reference);
        r.lvl_broad_cdb = level_cdb(a->energy_broad, a->samples, reference);
        r.ndsi_e4 = ndsi_e4(a->energy_bio, a->energy_anthro);
        r.snap_count = a->snap_count;
        r.clip_count = a->clip_count;
    }
    *out = r;
}

void scout_acoustic_slot_store(ScoutAcousticSlot *slot, const ScoutAcousticSummary *summary) {
    slot->summary = *summary;
    slot->valid = 1;
}

uint8_t scout_acoustic_slot_take(ScoutAcousticSlot *slot, ScoutAcousticSummary *out) {
    uint8_t had = slot->valid;
    *out = had ? slot->summary : ScoutAcousticSummary();
    slot->summary = ScoutAcousticSummary();
    slot->valid = 0;
    return had;
}
