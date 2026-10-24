/*
 * scout_sht4x — SHT40 housing humidity/temperature, as pure functions (SCO-205).
 *
 * The SHT40 (Adafruit 4885, I2C 0x44) sits inside the sealed electronics housing. A rising
 * humidity reading is the early warning that the housing is taking on water, so the buoy can
 * be retrieved before the electronics drown. The I2C transaction lives in
 * src/drivers/sht40.h; the parts that can be wrong without hardware live here and are tested.
 *
 * Frame (Sensirion SHT4x datasheet): T_msb, T_lsb, CRC(T), RH_msb, RH_lsb, CRC(RH).
 */
#ifndef SCOUT_SHT4X_H
#define SCOUT_SHT4X_H

#include <stddef.h>
#include <stdint.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define SCOUT_SHT4X_I2C_ADDR 0x44
#define SCOUT_SHT4X_CMD_MEASURE_HIGH 0xFD  /* high-precision T + RH, ~8.3 ms */
#define SCOUT_SHT4X_CMD_SOFT_RESET 0x94
#define SCOUT_SHT4X_FRAME_BYTES 6

/* Sensirion CRC-8: polynomial 0x31, init 0xFF, no reflection, no final XOR. */
uint8_t scout_sht4x_crc8(const uint8_t *data, size_t len);

/* Check both CRCs and convert. RH is cropped to 0-100 %. On a CRC failure returns false and
 * leaves the outputs untouched, so a bad bus read can never look like a real value. */
bool scout_sht4x_parse(const uint8_t frame[SCOUT_SHT4X_FRAME_BYTES], float *temp_c,
                       float *rh_pct);

/* True when housing humidity is at or above the alert threshold. */
bool scout_humidity_high(float rh_pct, float threshold_pct);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_SHT4X_H */
