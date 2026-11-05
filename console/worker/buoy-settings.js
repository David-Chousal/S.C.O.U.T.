/* Remote buoy settings (docs/engineering/firmware-remote-settings-plan.md).
 *
 * The registry is the firmware's table (firmware/lib/scout_settings), exported into
 * buoy-config.json by scripts/export_buoy_config.py, so the console refuses exactly what a buoy
 * would refuse. The console stores only what the team *requested*, per buoy and per setting; the
 * transmit count keeps its own column (buoys.tx_count_requested, SCO-198) and every other
 * setting is a row in buoy_settings. A buoy's wanted snapshot is the defaults overlaid with its
 * requests. The shore station sends that snapshot, signed with the buoy's key (never here), and
 * the buoy's v5 packets report the digest of what it runs; when the two digests match, every
 * setting is confirmed. */

import buoyConfig from "./buoy-config.json" with { type: "json" };

export const REGISTRY = buoyConfig.remote;
export const KEYS = REGISTRY.map((spec) => spec.key);
export const DEFAULTS = REGISTRY.map((spec) => spec.default);
const TIER_GAP_MV = buoyConfig.tierGapMv;
const BY_KEY = new Map(REGISTRY.map((spec) => [spec.key, spec]));

/** CRC-16/CCITT-FALSE, as firmware/lib/scout_packet computes it. */
export function crc16(bytes) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

/** The digest a buoy reports for `values` (ID order): 4 lowercase hex digits. */
export function digestHex(values) {
  const bytes = values.flatMap((v) => [v & 0xff, (v >> 8) & 0xff]);
  return crc16(bytes).toString(16).padStart(4, "0");
}

export function allows(spec, value) {
  if (!Number.isInteger(value)) return false;
  if (spec.choices) return spec.choices.includes(value);
  return value >= spec.min && value <= spec.max && (value - spec.min) % spec.step === 0;
}

/** null when a buoy would accept `values` (ID order) as a whole, else a sentence saying why not. */
export function snapshotError(values) {
  if (!Array.isArray(values) || values.length !== REGISTRY.length) return "Every setting needs a value.";
  for (const [i, spec] of REGISTRY.entries()) {
    if (!allows(spec, values[i])) {
      const range = spec.choices ? spec.choices.join(", ") : `${spec.min}–${spec.max} in steps of ${spec.step}`;
      return `${spec.label} must be ${range}${spec.unit ? ` ${spec.unit}` : ""}.`;
    }
  }
  const at = (key) => values[KEYS.indexOf(key)];
  if (at("critical_mv") + TIER_GAP_MV > at("conserve_mv")) {
    return `Critical must sit at least ${TIER_GAP_MV} mV under conserve.`;
  }
  return null;
}

/** { key: requested value | null } for one buoy, from its row and its buoy_settings rows. */
export function requestedOf(buoy, rows) {
  const requested = Object.fromEntries(KEYS.map((key) => [key, null]));
  requested.tx_count = buoy.tx_count_requested ?? null;
  for (const row of rows) if (BY_KEY.has(row.setting_key) && row.setting_key !== "tx_count") requested[row.setting_key] = row.value;
  return requested;
}

/** The snapshot the buoy should run: defaults overlaid with what was requested. */
export function wantedOf(requested) {
  return REGISTRY.map((spec) => requested[spec.key] ?? spec.default);
}

/** confirmed | pending | rejected | unreported | default, like countState for the whole set. */
export function settingsState(buoy, requested) {
  const reported = buoy.settings_digest_reported ?? null;
  const anyRequested = Object.values(requested).some((value) => value !== null);
  if (!anyRequested) return reported === null || reported === digestHex(DEFAULTS) ? "default" : "confirmed";
  if (reported === digestHex(wantedOf(requested))) return "confirmed";
  if (buoy.cmd_rejected) return "rejected";
  return reported === null ? "unreported" : "pending";
}
