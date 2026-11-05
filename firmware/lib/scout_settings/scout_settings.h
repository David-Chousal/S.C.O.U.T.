/*
 * scout_settings — the buoy settings that can be changed by radio, as pure data and functions
 * (docs/engineering/firmware-remote-settings-plan.md).
 *
 * THIS TABLE IS THE ONE SOURCE. scripts/export_buoy_config.py reads it into
 * console/worker/buoy-settings.json; shore/scout_shore/settings.py mirrors it, and
 * shore/tests/test_settings_registry.py fails if either drifts. Rules:
 *   - IDs are append-only and never reused. Adding a setting bumps SCOUT_SETTINGS_LAYOUT and the
 *     CMD frame version, because a frame carries every setting (scout_downlink).
 *   - Only settings that cannot stop the buoy hearing the next command belong here: never the
 *     radio parameters, the listen window or the downlink key.
 *
 * The digest (CRC-16/CCITT-FALSE over the values as little-endian u16, in ID order) rides in
 * every v5 packet, so the shore and the console can confirm the buoy uses exactly what was asked.
 *
 * Hardware-free (stdint only) and unit-tested off-target.
 */
#ifndef SCOUT_SETTINGS_H
#define SCOUT_SETTINGS_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

/* Setting IDs. The value of setting ID n is ScoutSettings.v[n - 1]. */
#define SCOUT_SET_TX_COUNT 1u        /* transmits a day: 1, 2, 3 */
#define SCOUT_SET_SLOT_PHASE 2u      /* hours added to every slot and audio hour: 0-7 */
#define SCOUT_SET_SAMPLE_MIN 3u      /* minutes between readings: 15, 30, 60 */
#define SCOUT_SET_AUDIO_CLIP_S 4u    /* seconds per hydrophone clip: 0 (off), 15, 30, 60 */
#define SCOUT_SET_CONSERVE_MV 5u     /* conserve below this battery voltage: 3000-3600 mV */
#define SCOUT_SET_CRITICAL_MV 6u     /* critical below this: 2900-3500 mV, >= 50 mV under conserve */
#define SCOUT_SET_CONSERVE_EVERY 7u  /* in conserve, transmit in every Nth used slot: 1-3 */
#define SCOUT_SET_HUMIDITY_PCT 8u    /* housing humidity alert: 40-95 %RH */
#define SCOUT_SETTINGS_COUNT 8u

/* Bumped whenever the table's IDs or meaning change; stored with the block in flash. */
#define SCOUT_SETTINGS_LAYOUT 1u

/* Defaults: what a buoy runs before any command, and after a stored block fails its checks. */
#define SCOUT_SET_DEFAULT_TX_COUNT 3u
#define SCOUT_SET_DEFAULT_SLOT_PHASE 0u
#define SCOUT_SET_DEFAULT_SAMPLE_MIN 30u
#define SCOUT_SET_DEFAULT_AUDIO_CLIP_S 60u
#define SCOUT_SET_DEFAULT_CONSERVE_MV 3200u
#define SCOUT_SET_DEFAULT_CRITICAL_MV 3100u
#define SCOUT_SET_DEFAULT_CONSERVE_EVERY 3u
#define SCOUT_SET_DEFAULT_HUMIDITY_PCT 70u

/* The critical threshold must sit at least this far under the conserve one. */
#define SCOUT_SET_MIN_TIER_GAP_MV 50u

#define SCOUT_SETTING_MAX_CHOICES 4u

/* A setting's allowed values: either the listed `choices`, or min..max in steps of `step`. */
typedef struct {
    uint8_t id;
    const char *key;  /* the name the console and the shore use */
    uint16_t def;
    uint16_t min;
    uint16_t max;
    uint16_t step;
    uint8_t n_choices;  /* 0 = use min/max/step */
    uint16_t choices[SCOUT_SETTING_MAX_CHOICES];
} ScoutSettingSpec;

extern const ScoutSettingSpec SCOUT_SETTING_SPECS[SCOUT_SETTINGS_COUNT];

typedef struct {
    uint16_t v[SCOUT_SETTINGS_COUNT];
} ScoutSettings;

/* Read one setting by ID (1..SCOUT_SETTINGS_COUNT). */
static inline uint16_t scout_setting(const ScoutSettings *s, uint8_t id) {
    return s->v[id - 1u];
}

void scout_settings_defaults(ScoutSettings *out);

/* True when `value` is allowed for setting `id` on its own. */
bool scout_setting_value_ok(uint8_t id, uint16_t value);

/* True when every value is allowed and the set holds together (critical under conserve). */
bool scout_settings_valid(const ScoutSettings *s);

/* CRC-16/CCITT-FALSE over the values as little-endian u16, in ID order. */
uint16_t scout_settings_digest(const ScoutSettings *s);

/* Seconds between readings. */
uint32_t scout_settings_sample_interval_s(const ScoutSettings *s);

/* The slots in use: the transmit count picks from `base_sod` (3 entries, scout_scheduler), and
 * the slot phase moves each one later by that many hours. Returns how many were written to `out`
 * (room for 3). Phase 0-7 keeps every slot inside the same UTC day and in order. */
size_t scout_settings_tx_slots(const ScoutSettings *s, const uint32_t base_sod[3], uint32_t *out);

/* The audio hours: `base_hours` (n entries) moved by the slot phase, so each clip still comes
 * 10 min before its slot. Returns n. */
size_t scout_settings_audio_hours(const ScoutSettings *s, const uint8_t *base_hours, size_t n,
                                  uint8_t *out);

/* The block kept in flash so settings survive a power loss:
 *   magic u32 | layout u8 | count u8 | values u16 × count | last_cmd_counter u32 | crc16 u16
 * little-endian. */
#define SCOUT_SETTINGS_BLOCK_MAGIC 0x5C5E7701u
#define SCOUT_SETTINGS_BLOCK_SIZE (4u + 1u + 1u + 2u * SCOUT_SETTINGS_COUNT + 4u + 2u)

size_t scout_settings_block_encode(const ScoutSettings *s, uint32_t last_cmd_counter, uint8_t *out);

/* False (outputs untouched) unless magic, layout, count, CRC and every value check out. */
bool scout_settings_block_decode(const uint8_t *buf, size_t len, ScoutSettings *s,
                                 uint32_t *last_cmd_counter);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_SETTINGS_H */
