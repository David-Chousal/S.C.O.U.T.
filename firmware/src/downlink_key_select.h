/* Pulls in the settings-downlink keys for SCOUT_DOWNLINK builds (SCO-198). The real keys live
 * in the gitignored downlink_key.h; the public example keys are used only when a build asks for
 * them by name, so a deploy build without real keys fails to compile instead of shipping them. */
#ifndef SCOUT_DOWNLINK_KEY_SELECT_H
#define SCOUT_DOWNLINK_KEY_SELECT_H

#if __has_include("downlink_key.h")
#include "downlink_key.h"
/* A copy of downlink_key_example.h renamed to downlink_key.h still defines this — refuse it so a
 * shipped build cannot silently use the public example HMAC keys. */
#ifdef SCOUT_DOWNLINK_KEY_IS_EXAMPLE
#error "src/downlink_key.h still has the EXAMPLE keys — replace every key with random bytes. CI/bench envs use -DSCOUT_DOWNLINK_ALLOW_EXAMPLE_KEY instead of copying the example."
#endif
#elif defined(SCOUT_DOWNLINK_ALLOW_EXAMPLE_KEY)
#include "downlink_key_example.h"
#else
#error "SCOUT_DOWNLINK needs src/downlink_key.h: copy downlink_key_example.h and set real keys"
#endif

#endif /* SCOUT_DOWNLINK_KEY_SELECT_H */
