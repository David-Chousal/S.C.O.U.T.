#include "scout_sht4x.h"

uint8_t scout_sht4x_crc8(const uint8_t *data, size_t len) {
    uint8_t crc = 0xFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int bit = 0; bit < 8; bit++) {
            crc = (crc & 0x80u) ? (uint8_t)((crc << 1) ^ 0x31u) : (uint8_t)(crc << 1);
        }
    }
    return crc;
}

bool scout_sht4x_parse(const uint8_t frame[SCOUT_SHT4X_FRAME_BYTES], float *temp_c,
                       float *rh_pct) {
    if (scout_sht4x_crc8(frame, 2) != frame[2] || scout_sht4x_crc8(frame + 3, 2) != frame[5]) {
        return false;
    }
    uint16_t t_raw = (uint16_t)((frame[0] << 8) | frame[1]);
    uint16_t rh_raw = (uint16_t)((frame[3] << 8) | frame[4]);
    // Datasheet conversions: T = -45 + 175 * S_T / 65535, RH = -6 + 125 * S_RH / 65535.
    float rh = -6.0f + 125.0f * (float)rh_raw / 65535.0f;
    if (rh < 0.0f) {
        rh = 0.0f;
    } else if (rh > 100.0f) {
        rh = 100.0f;
    }
    *temp_c = -45.0f + 175.0f * (float)t_raw / 65535.0f;
    *rh_pct = rh;
    return true;
}

bool scout_humidity_high(float rh_pct, float threshold_pct) {
    return rh_pct >= threshold_pct;
}
