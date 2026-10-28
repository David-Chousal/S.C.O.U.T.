#include "scout_console.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

/* two_product() needs every multiply and subtract rounded separately; a fused multiply-add would
 * make its error term wrong. GCC takes that from -ffp-contract=off in platformio.ini; clang (the
 * native tests on a Mac) also honours this pragma. */
#if defined(__clang__)
#pragma STDC FP_CONTRACT OFF
#endif

namespace {

/* Dekker's error-free product: a * b == *p + *e exactly. */
void two_product(double a, double b, double *p, double *e) {
    const double split = 134217729.0; /* 2^27 + 1 */
    *p = a * b;
    double ca = split * a;
    double a_hi = ca - (ca - a);
    double a_lo = a - a_hi;
    double cb = split * b;
    double b_hi = cb - (cb - b);
    double b_lo = b - b_hi;
    *e = ((a_hi * b_hi - *p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
}

/* Sign of (p + e) - t, exact for the small magnitudes formatted here. */
int exact_sign(double p, double e, double t) {
    double d = p - t;
    double s = d != 0.0 ? d : e;
    return (s > 0.0) - (s < 0.0);
}

/* Appends to a fixed buffer; once anything fails to fit, every later append is refused. */
struct Out {
    char *buf;
    size_t cap;
    size_t len;
    bool ok;
};

void put(Out *o, const char *text) {
    size_t n = strlen(text);
    if (!o->ok || o->len + n + 1 > o->cap) {
        o->ok = false;
        return;
    }
    memcpy(o->buf + o->len, text, n + 1);
    o->len += n;
}

void put_u32(Out *o, uint32_t v) {
    char digits[11];
    char *end = digits + sizeof(digits) - 1;
    char *at = end;
    *at = '\0';
    do {
        *--at = (char)('0' + v % 10u);
        v /= 10u;
    } while (v);
    put(o, at);
}

void put_i32(Out *o, int32_t v) {
    if (v < 0) {
        put(o, "-");
        put_u32(o, (uint32_t)(-(int64_t)v));
    } else {
        put_u32(o, (uint32_t)v);
    }
}

void put_2digits(Out *o, unsigned v) {
    char text[3] = {(char)('0' + v / 10u % 10u), (char)('0' + v % 10u), '\0'};
    put(o, text);
}

void put_fixed(Out *o, double value, unsigned decimals) {
    char text[24];
    if (scout_format_fixed(value, decimals, text, sizeof(text)) == 0) {
        o->ok = false;
        return;
    }
    put(o, text);
}

void key(Out *o, const char *name, bool first = false) {
    put(o, first ? "\"" : ",\"");
    put(o, name);
    put(o, "\":\"");
}

void end_value(Out *o) { put(o, "\""); }

/* Civil date from days since 1970-01-01 (Howard Hinnant's algorithm): no time zone involved. */
void civil_from_days(int32_t z, int32_t *y, unsigned *m, unsigned *d) {
    z += 719468;
    int32_t era = (z >= 0 ? z : z - 146096) / 146097;
    unsigned doe = (unsigned)(z - era * 146097);
    unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    unsigned mp = (5 * doy + 2) / 153;
    *d = doy - (153 * mp + 2) / 5 + 1;
    *m = mp < 10 ? mp + 3 : mp - 9;
    *y = (int32_t)yoe + era * 400 + (*m <= 2);
}

struct NamedBit {
    const char *name;
    uint16_t bit;
};

/* Sorted by name: the CSV joins names in sorted order (schema.py, "|".join(sorted(...))). */
const NamedBit FLAG_NAMES[] = {
    {"BATT_LOW_SKIP_TX", SCOUT_FLAG_BATT_LOW_SKIP_TX}, {"CMD_REJECTED", SCOUT_FLAG_CMD_REJECTED},
    {"HUMIDITY_FAIL", SCOUT_FLAG_HUMIDITY_FAIL},       {"HUMIDITY_HIGH", SCOUT_FLAG_HUMIDITY_HIGH},
    {"POWER_CONSERVE", SCOUT_FLAG_POWER_CONSERVE},     {"RTC_LOST", SCOUT_FLAG_RTC_LOST},
    {"SD_RETRY", SCOUT_FLAG_SD_RETRY},                 {"TEMP_TIMEOUT", SCOUT_FLAG_TEMP_TIMEOUT},
    {"TURBIDITY_RANGE", SCOUT_FLAG_TURBIDITY_RANGE},
};
const NamedBit SOH_NAMES[] = {
    {"LORA_INIT_FAIL", SCOUT_SOH_LORA_INIT_FAIL},
    {"RTC_UNSET", SCOUT_SOH_RTC_UNSET},
    {"SD_INIT_FAIL", SCOUT_SOH_SD_INIT_FAIL},
    {"WATCHDOG_RESET", SCOUT_SOH_WATCHDOG_RESET},
};

void put_names(Out *o, const NamedBit *names, size_t count, uint16_t bits) {
    bool first = true;
    for (size_t i = 0; i < count; i++) {
        if (bits & names[i].bit) {
            if (!first) {
                put(o, "|");
            }
            put(o, names[i].name);
            first = false;
        }
    }
}

/* schema.py ADC_FULL_SCALE and ADC_VREF_V; turbidity_v = round(adc / 4095 * 3.3, 3). */
const double ADC_FULL_SCALE = 4095.0;
const double ADC_VREF_V = 3.3;

/* Next unsigned integer after `key` in `text`, or -1. */
long number_after(const char *text, const char *key, const char *stop) {
    const char *at = strstr(text, key);
    if (at == nullptr || (stop != nullptr && at > stop)) {
        return -1;
    }
    at += strlen(key);
    while (*at == ' ') {
        at++;
    }
    if (*at < '0' || *at > '9') {
        return -1;
    }
    return strtol(at, nullptr, 10);
}

}  // namespace

size_t scout_format_fixed(double value, unsigned decimals, char *out, size_t cap) {
    static const double SCALE[] = {1.0, 10.0, 100.0, 1000.0};
    static const uint32_t UNIT[] = {1u, 10u, 100u, 1000u};
    if (decimals > 3 || !(fabs(value) < 1e6)) {
        return 0;
    }
    double p, e;
    two_product(fabs(value), SCALE[decimals], &p, &e);
    double n = floor(p);
    if (exact_sign(p, e, n) < 0) {
        n -= 1.0;
    }
    int half = exact_sign(p, e, n + 0.5);
    if (half > 0 || (half == 0 && fmod(n, 2.0) != 0.0)) {
        n += 1.0;
    }
    uint32_t units = (uint32_t)n;
    Out o = {out, cap, 0, cap > 0};
    if (signbit(value)) {
        put(&o, "-");
    }
    put_u32(&o, units / UNIT[decimals]);
    if (decimals > 0) {
        put(&o, ".");
        uint32_t frac = units % UNIT[decimals];
        for (uint32_t unit = UNIT[decimals] / 10u; unit > 0; unit /= 10u) {
            char digit[2] = {(char)('0' + frac / unit % 10u), '\0'};
            put(&o, digit);
        }
    }
    return o.ok ? o.len : 0;
}

size_t scout_console_row(const ScoutReading *r, char *out, size_t cap) {
    Out o = {out, cap, 0, cap > 0};
    if (o.ok) {
        out[0] = '\0';
    }
    bool audio = r->audio_present != 0;

    put(&o, "{");
    key(&o, "schema_version", true);
    put_u32(&o, r->schema_version);
    end_value(&o);
    key(&o, "buoy_id");
    put(&o, "SCOUT-");
    if (r->buoy_id < 10) {
        put(&o, "0");
    }
    put_u32(&o, r->buoy_id);
    end_value(&o);

    int32_t year;
    unsigned month, day;
    civil_from_days((int32_t)(r->timestamp / 86400u), &year, &month, &day);
    uint32_t sod = r->timestamp % 86400u;
    key(&o, "timestamp_utc");
    put_i32(&o, year);
    put(&o, "-");
    put_2digits(&o, month);
    put(&o, "-");
    put_2digits(&o, day);
    put(&o, "T");
    put_2digits(&o, sod / 3600u);
    put(&o, ":");
    put_2digits(&o, sod / 60u % 60u);
    put(&o, ":");
    put_2digits(&o, sod % 60u);
    put(&o, "Z");
    end_value(&o);

    key(&o, "record_seq");
    put_u32(&o, r->record_seq);
    end_value(&o);
    key(&o, "temp_c");
    put_fixed(&o, (double)r->temp_c_centi / 100.0, 2);
    end_value(&o);
    key(&o, "turbidity_adc");
    put_u32(&o, r->turbidity_adc);
    end_value(&o);
    key(&o, "turbidity_v");
    put_fixed(&o, (double)r->turbidity_adc / ADC_FULL_SCALE * ADC_VREF_V, 3);
    end_value(&o);
    key(&o, "turbidity_fau");  // uncalibrated, blank by design (SCO-12)
    end_value(&o);
    key(&o, "battery_v");
    put_fixed(&o, (double)r->battery_mv / 1000.0, 2);
    end_value(&o);
    key(&o, "uptime_s");
    put_u32(&o, r->uptime_s);
    end_value(&o);

    key(&o, "audio_file");  // /AUDIO/<YYYYMMDD>/<HHMMSS>Z.WAV, as the buoy names it (SCO-202)
    if (audio) {
        put_i32(&o, year);
        put_2digits(&o, month);
        put_2digits(&o, day);
        put(&o, "/");
        put_2digits(&o, sod / 3600u);
        put_2digits(&o, sod / 60u % 60u);
        put_2digits(&o, sod % 60u);
        put(&o, "Z.WAV");
    }
    end_value(&o);

    key(&o, "flags");
    put_names(&o, FLAG_NAMES, sizeof(FLAG_NAMES) / sizeof(FLAG_NAMES[0]), r->flags);
    end_value(&o);
    key(&o, "soh");
    put_names(&o, SOH_NAMES, sizeof(SOH_NAMES) / sizeof(SOH_NAMES[0]), r->soh);
    end_value(&o);
    key(&o, "fw_version");
    put(&o, "v");
    put_u32(&o, r->fw_major);
    put(&o, ".");
    put_u32(&o, r->fw_minor);
    put(&o, ".");
    put_u32(&o, r->fw_patch);
    end_value(&o);
    key(&o, "internal_temp_c");  // SD card only: the packet carries just the humidity flags
    end_value(&o);
    key(&o, "internal_humidity_pct");
    end_value(&o);

    const char *acoustic_names[] = {"lvl_anthro_cdb", "lvl_mixed_cdb", "lvl_bio_cdb",
                                    "lvl_broad_cdb",  "ndsi_e4",       "snap_count",
                                    "clip_count"};
    const int32_t acoustic[] = {r->lvl_anthro_cdb, r->lvl_mixed_cdb, r->lvl_bio_cdb,
                                r->lvl_broad_cdb,  r->ndsi_e4,       r->snap_count,
                                r->clip_count};
    for (size_t i = 0; i < 7; i++) {
        key(&o, acoustic_names[i]);
        if (audio) {
            put_i32(&o, acoustic[i]);
        }
        end_value(&o);
    }

    key(&o, "tx_count");
    uint8_t tx = scout_flags_tx_count(r->flags);
    if (tx) {
        put_u32(&o, tx);
    }
    end_value(&o);
    put(&o, "}");

    if (!o.ok) {
        if (cap > 0) {
            out[0] = '\0';
        }
        return 0;
    }
    return o.len;
}

size_t scout_console_batch(const ScoutReading *rows, size_t count, char *out, size_t cap,
                           size_t *len) {
    const char head[] = "{\"rows\":[";
    const char tail[] = "]}";
    size_t used = sizeof(head) - 1;
    size_t taken = 0;
    *len = 0;
    if (cap < used + sizeof(tail)) {
        return 0;
    }
    memcpy(out, head, used);
    if (count > SCOUT_CONSOLE_MAX_BATCH) {
        count = SCOUT_CONSOLE_MAX_BATCH;
    }
    for (; taken < count; taken++) {
        size_t comma = taken ? 1 : 0;
        /* Room for the comma, the row with its terminator, and the tail. */
        if (used + comma + sizeof(tail) >= cap) {
            break;
        }
        size_t room = cap - used - comma - (sizeof(tail) - 1);
        size_t n = scout_console_row(&rows[taken], out + used + comma, room);
        if (n == 0) {
            break;
        }
        if (comma) {
            out[used] = ',';
        }
        used += comma + n;
    }
    if (taken == 0) {
        out[0] = '\0';
        return 0;
    }
    memcpy(out + used, tail, sizeof(tail));
    *len = used + sizeof(tail) - 1;
    return taken;
}

int scout_console_bad_row(const char *body) {
    const char *at = body;
    while ((at = strstr(at, "row ")) != nullptr) {
        at += 4;
        if (*at >= '0' && *at <= '9') {
            return (int)strtol(at, nullptr, 10);
        }
    }
    return -1;
}

int scout_console_parse_settings(const char *body, uint8_t *requested, size_t slots) {
    const char *at = strstr(body, "\"buoys\"");
    if (at == nullptr || strchr(at, '[') == nullptr) {
        return -1;
    }
    at = strchr(at, '[');
    uint8_t parsed[256] = {0};
    size_t limit = slots < sizeof(parsed) ? slots : sizeof(parsed);
    int set = 0;
    const char *object;
    while ((object = strchr(at, '{')) != nullptr) {
        const char *close = strchr(object, '}');
        if (close == nullptr) {
            return -1;
        }
        long buoy = number_after(object, "\"buoy_id\":", close);
        long count = number_after(object, "\"tx_count_requested\":", close);
        if (buoy >= 0 && (size_t)buoy < limit && count >= 1 && count <= 3) {
            parsed[buoy] = (uint8_t)count;
            set++;
        }
        at = close + 1;
    }
    memcpy(requested, parsed, limit);
    return set;
}
