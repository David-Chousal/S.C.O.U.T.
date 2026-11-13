/* The scout_boot stub (src/boot/), placed at 0x2000 in front of a SCOUT_OTA application through
 * the core linker script's .sketch_boot section, which moves the application to 0x8000. The
 * bytes are generated: rebuild with `python3 tools/make_boot_image.py` after changing the stub. */
#ifdef SCOUT_OTA

__attribute__((section(".sketch_boot"), used)) const unsigned char g_scout_boot[0x6000] = {
#include "scout_boot_image.h"
};

#endif
