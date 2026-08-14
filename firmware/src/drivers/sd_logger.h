/* microSD CSV logger (Adalogger FeatherWing) via the Arduino SD library.
 *
 * On-card files are named YYYYMMDD.CSV (FAT 8.3-safe). The buoy id is constant per card and
 * already in every row, so it is omitted from the filename; the shore store re-adds the
 * <buoy_id>_ prefix per docs/engineering/data-schema.md. */
#ifndef SCOUT_DRIVER_SD_LOGGER_H
#define SCOUT_DRIVER_SD_LOGGER_H

#include <SD.h>
#include <SPI.h>

#include "../config.h"

class SdLogger {
public:
    bool begin() { return SD.begin(PIN_SD_CS); }

    /* Append `line` to <date_ymd>.CSV, writing `header` first when the file is new.
     * `date_ymd` is 8 chars, "YYYYMMDD". Returns false on any I/O failure. */
    bool appendLine(const char *date_ymd, const char *header, const char *line) {
        char path[13];
        snprintf(path, sizeof(path), "%s.CSV", date_ymd);
        bool is_new = !SD.exists(path);
        File f = SD.open(path, FILE_WRITE);
        if (!f) {
            return false;
        }
        if (is_new) {
            f.println(header);
        }
        f.println(line);
        f.close();
        return true;
    }
};

#endif
