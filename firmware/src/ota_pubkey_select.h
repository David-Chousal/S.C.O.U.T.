/* Pulls in the Ed25519 public key for SCOUT_OTA builds (SCO-197). The real key lives in the
 * gitignored ota_pubkey.h (tools/ota_release.py keygen writes it); the public TEST key is used
 * only when a build asks for it by name, so a deploy build without the real key fails to compile
 * instead of accepting firmware anyone can sign. */
#ifndef SCOUT_OTA_PUBKEY_SELECT_H
#define SCOUT_OTA_PUBKEY_SELECT_H

#if __has_include("ota_pubkey.h")
#include "ota_pubkey.h"
/* A copy of ota_pubkey_example.h renamed to ota_pubkey.h still defines this — refuse it so a
 * shipped feather_m0 / feather_esp32s3_shore build cannot silently accept the public test key. */
#ifdef SCOUT_OTA_PUBKEY_IS_EXAMPLE
#error "src/ota_pubkey.h is the EXAMPLE key — replace it (tools/ota_release.py keygen). CI/bench envs use -DSCOUT_OTA_ALLOW_EXAMPLE_KEY instead of copying the example."
#endif
#elif defined(SCOUT_OTA_ALLOW_EXAMPLE_KEY)
#include "ota_pubkey_example.h"
#else
#error "SCOUT_OTA needs src/ota_pubkey.h: run tools/ota_release.py keygen"
#endif

#endif /* SCOUT_OTA_PUBKEY_SELECT_H */
