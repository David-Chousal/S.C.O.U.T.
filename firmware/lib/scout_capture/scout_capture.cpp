#include "scout_capture.h"

static void put_u16(uint8_t *p, uint16_t v) {
    p[0] = (uint8_t)(v & 0xFF);
    p[1] = (uint8_t)(v >> 8);
}

static void put_u32(uint8_t *p, uint32_t v) {
    for (int i = 0; i < 4; i++) {
        p[i] = (uint8_t)((v >> (8 * i)) & 0xFF);
    }
}

void scout_wav_header(uint8_t out[SCOUT_WAV_HEADER_SIZE], uint32_t sample_rate,
                      uint32_t n_samples) {
    const uint16_t channels = 1;
    const uint16_t bits = 16;
    const uint16_t block_align = channels * bits / 8;
    uint32_t data_bytes = n_samples * block_align;

    out[0] = 'R'; out[1] = 'I'; out[2] = 'F'; out[3] = 'F';
    put_u32(out + 4, 36u + data_bytes);
    out[8] = 'W'; out[9] = 'A'; out[10] = 'V'; out[11] = 'E';
    out[12] = 'f'; out[13] = 'm'; out[14] = 't'; out[15] = ' ';
    put_u32(out + 16, 16u);          /* fmt chunk size */
    put_u16(out + 20, 1u);           /* PCM */
    put_u16(out + 22, channels);
    put_u32(out + 24, sample_rate);
    put_u32(out + 28, sample_rate * block_align);
    put_u16(out + 32, block_align);
    put_u16(out + 34, bits);
    out[36] = 'd'; out[37] = 'a'; out[38] = 't'; out[39] = 'a';
    put_u32(out + 40, data_bytes);
}

void scout_wav_convert(const uint16_t *in, int16_t *out, size_t n, uint8_t adc_bits) {
    const int32_t top = (1 << adc_bits) - 1;
    const int32_t mid = 1 << (adc_bits - 1);
    const int32_t scale = 1 << (16 - adc_bits);
    for (size_t i = 0; i < n; i++) {
        int32_t code = in[i] > top ? top : in[i];
        out[i] = (int16_t)((code - mid) * scale);
    }
}
