/*
 * ota_pubkey_example.h — the PUBLIC TEST key for over-the-air firmware (SCO-197).
 *
 * Its private half is the test seed bytes 0..31, which is published in test/test_ota and
 * scripts/check_packet_contract.py, so anyone can sign firmware this key accepts. A build only
 * falls back to it with -DSCOUT_OTA_ALLOW_EXAMPLE_KEY (compile checks and the bench), and says so
 * at boot. A real build uses src/ota_pubkey.h, written by
 *     python3 tools/ota_release.py keygen --key ~/scout-ota.key --header src/ota_pubkey.h
 */
#ifndef SCOUT_OTA_PUBKEY_H
#define SCOUT_OTA_PUBKEY_H

#include <stdint.h>

#define SCOUT_OTA_PUBKEY_IS_EXAMPLE 1

static const uint8_t SCOUT_OTA_PUBKEY[32] = {
    0x03, 0xa1, 0x07, 0xbf, 0xf3, 0xce, 0x10, 0xbe, 0x1d, 0x70, 0xdd, 0x18, 0xe7, 0x4b, 0xc0, 0x99,
    0x67, 0xe4, 0xd6, 0x30, 0x9b, 0xa5, 0x0d, 0x5f, 0x1d, 0xdc, 0x86, 0x64, 0x12, 0x55, 0x31, 0xb8};

#endif
