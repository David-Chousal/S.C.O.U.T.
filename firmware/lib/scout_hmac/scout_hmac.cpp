#include "scout_hmac.h"

#include <string.h>

static const uint32_t K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};

static uint32_t rotr(uint32_t x, uint32_t n) {
    return (x >> n) | (x << (32u - n));
}

static void compress(uint32_t state[8], const uint8_t block[SCOUT_SHA256_BLOCK_BYTES]) {
    uint32_t w[64];
    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)block[4 * i] << 24) | ((uint32_t)block[4 * i + 1] << 16) |
               ((uint32_t)block[4 * i + 2] << 8) | (uint32_t)block[4 * i + 3];
    }
    for (int i = 16; i < 64; i++) {
        uint32_t s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
        uint32_t s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3];
    uint32_t e = state[4], f = state[5], g = state[6], h = state[7];
    for (int i = 0; i < 64; i++) {
        uint32_t t1 = h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i];
        uint32_t t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }
    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
    state[5] += f;
    state[6] += g;
    state[7] += h;
}

void scout_sha256_init(ScoutSha256 *ctx) {
    static const uint32_t H0[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                                   0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
    memcpy(ctx->state, H0, sizeof(H0));
    ctx->length_bits = 0;
    ctx->block_len = 0;
}

void scout_sha256_update(ScoutSha256 *ctx, const uint8_t *data, size_t len) {
    for (size_t i = 0; i < len; i++) {
        ctx->block[ctx->block_len++] = data[i];
        if (ctx->block_len == SCOUT_SHA256_BLOCK_BYTES) {
            compress(ctx->state, ctx->block);
            ctx->block_len = 0;
        }
    }
    ctx->length_bits += (uint64_t)len * 8u;
}

void scout_sha256_final(ScoutSha256 *ctx, uint8_t out[SCOUT_SHA256_DIGEST_BYTES]) {
    uint64_t length_bits = ctx->length_bits;
    uint8_t pad = 0x80;
    scout_sha256_update(ctx, &pad, 1);
    uint8_t zero = 0;
    while (ctx->block_len != SCOUT_SHA256_BLOCK_BYTES - 8u) {
        scout_sha256_update(ctx, &zero, 1);
    }
    uint8_t len_be[8];
    for (int i = 0; i < 8; i++) {
        len_be[i] = (uint8_t)(length_bits >> (56 - 8 * i));
    }
    scout_sha256_update(ctx, len_be, 8);
    for (int i = 0; i < 8; i++) {
        out[4 * i] = (uint8_t)(ctx->state[i] >> 24);
        out[4 * i + 1] = (uint8_t)(ctx->state[i] >> 16);
        out[4 * i + 2] = (uint8_t)(ctx->state[i] >> 8);
        out[4 * i + 3] = (uint8_t)ctx->state[i];
    }
}

void scout_hmac_sha256(const uint8_t *key, size_t key_len, const uint8_t *msg, size_t msg_len,
                       uint8_t out[SCOUT_SHA256_DIGEST_BYTES]) {
    uint8_t block_key[SCOUT_SHA256_BLOCK_BYTES];
    memset(block_key, 0, sizeof(block_key));
    ScoutSha256 ctx;
    if (key_len > SCOUT_SHA256_BLOCK_BYTES) {
        scout_sha256_init(&ctx);
        scout_sha256_update(&ctx, key, key_len);
        scout_sha256_final(&ctx, block_key);
    } else {
        memcpy(block_key, key, key_len);
    }

    uint8_t pad[SCOUT_SHA256_BLOCK_BYTES];
    for (size_t i = 0; i < sizeof(pad); i++) {
        pad[i] = block_key[i] ^ 0x36;
    }
    uint8_t inner[SCOUT_SHA256_DIGEST_BYTES];
    scout_sha256_init(&ctx);
    scout_sha256_update(&ctx, pad, sizeof(pad));
    scout_sha256_update(&ctx, msg, msg_len);
    scout_sha256_final(&ctx, inner);

    for (size_t i = 0; i < sizeof(pad); i++) {
        pad[i] = block_key[i] ^ 0x5c;
    }
    scout_sha256_init(&ctx);
    scout_sha256_update(&ctx, pad, sizeof(pad));
    scout_sha256_update(&ctx, inner, sizeof(inner));
    scout_sha256_final(&ctx, out);
}

bool scout_ct_equal(const uint8_t *a, const uint8_t *b, size_t len) {
    uint8_t diff = 0;
    for (size_t i = 0; i < len; i++) {
        diff |= (uint8_t)(a[i] ^ b[i]);
    }
    return diff == 0;
}
