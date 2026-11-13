/* Pulls in the Ed25519 public key for SCOUT_OTA builds (SCO-197). The real key lives in the
 * gitignored ota_pubkey.h (tools/ota_release.py keygen writes it); the public TEST key is used
 * only when a build asks for it by name, so a deploy build without the real key fails to compile
 * instead of accepting firmware anyone can sign. */
#ifndef SCOUT_OTA_PUBKEY_SELECT_H
#define SCOUT_OTA_PUBKEY_SELECT_H

#if __has_include("ota_pubkey.h")
#include "ota_pubkey.h"
#elif defined(SCOUT_OTA_ALLOW_EXAMPLE_KEY)
#include "ota_pubkey_example.h"
#else
#error "SCOUT_OTA needs src/ota_pubkey.h: run tools/ota_release.py keygen"
#endif

#endif /* SCOUT_OTA_PUBKEY_SELECT_H */
