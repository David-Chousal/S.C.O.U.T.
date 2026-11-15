/* Each buoy's site MMM (Maximum Monthly Mean, °C), the climatology heat stress needs (SCO-314,
 * ADR-0017). Set on Settings → Buoys by a member or admin, two ways:
 *
 *   look up   give the buoy's latitude and longitude; the Worker asks NOAA Coral Reef Watch's
 *             5 km product (ERDDAP dataset NOAA_DHW) for the newest day at the nearest grid cell
 *             and takes MMM = CRW_SST − CRW_HOTSPOT. CRW defines HotSpot as SST − MMM and keeps
 *             negative values (valid range −15…15), so this is the product's own MMM for that cell.
 *   by hand   type the MMM, e.g. read off the site's CRW virtual station.
 *
 * Every change goes in the audit log. A land or ice cell has no SST, so the lookup says so. */

import { record } from "./audit.js";

export const CRW_DATASET_URL = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW.json";
export const MMM_RANGE_C = [10, 35];
const LOOKUP_TIMEOUT_MS = 20_000;

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const round2 = (value) => Math.round(value * 100) / 100;

/** The ERDDAP query for one point on the newest day. Coordinates go in as numbers only. */
export function crwQuery(latitude, longitude) {
  const at = `[(last)][(${latitude.toFixed(4)})][(${longitude.toFixed(4)})]`;
  return `${CRW_DATASET_URL}?${encodeURIComponent(`CRW_SST${at},CRW_HOTSPOT${at}`)}`;
}

/** NOAA's reply → { mmm, cellLat, cellLon, day } or { error } in words. */
export function parseCrwReply(body) {
  const columns = body?.table?.columnNames;
  const row = body?.table?.rows?.[0];
  if (!Array.isArray(columns) || !Array.isArray(row)) return { error: "NOAA's reply was not in the expected shape." };
  const value = (name) => row[columns.indexOf(name)];
  const sst = value("CRW_SST");
  const hs = value("CRW_HOTSPOT");
  if (!isNumber(sst) || !isNumber(hs)) {
    return { error: "NOAA has no sea temperature for that 5 km cell (land, ice or no data). Move the point offshore or enter the MMM by hand." };
  }
  const mmm = round2(sst - hs);
  if (mmm < MMM_RANGE_C[0] || mmm > MMM_RANGE_C[1]) return { error: `NOAA gave an MMM of ${mmm} °C, outside ${MMM_RANGE_C.join("–")} °C.` };
  return { mmm, cellLat: value("latitude"), cellLon: value("longitude"), day: String(value("time") || "").slice(0, 10) };
}

/** Ask NOAA CRW for the MMM at a point. Never throws: failures come back as { error }. */
export async function lookupMmm(latitude, longitude) {
  let response;
  try {
    response = await fetch(crwQuery(latitude, longitude), { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
  } catch (error) {
    console.error(`console: CRW lookup failed: ${String(error?.name ?? "unknown").slice(0, 64)}`);
    return { error: "NOAA Coral Reef Watch did not answer. Try again later, or enter the MMM by hand." };
  }
  if (!response.ok) {
    console.error(`console: CRW lookup status ${response.status}`);
    return { error: `NOAA Coral Reef Watch refused the lookup (HTTP ${response.status}). Try again later, or enter the MMM by hand.` };
  }
  try {
    return parseCrwReply(await response.json());
  } catch {
    return { error: "NOAA's reply was not JSON." };
  }
}

function coordinates(body) {
  const latitude = body?.latitude === undefined || body?.latitude === null || body?.latitude === "" ? null : Number(body.latitude);
  const longitude = body?.longitude === undefined || body?.longitude === null || body?.longitude === "" ? null : Number(body.longitude);
  if ((latitude === null) !== (longitude === null)) return { error: "Give both latitude and longitude, or neither." };
  if (latitude !== null && !(latitude >= -90 && latitude <= 90)) return { error: "Latitude is −90 to 90 (south is negative)." };
  if (longitude !== null && !(longitude >= -180 && longitude <= 180)) return { error: "Longitude is −180 to 180 (west is negative)." };
  return { latitude, longitude };
}

/** The MMM part of a buoy row, as the API shows it, or null when none is set. */
export function mmmOf(buoy) {
  if (buoy.mmm_c === null || buoy.mmm_c === undefined) return null;
  return { value_c: buoy.mmm_c, source: buoy.mmm_source, latitude: buoy.latitude ?? null, longitude: buoy.longitude ?? null,
    cell_latitude: buoy.mmm_cell_lat ?? null, cell_longitude: buoy.mmm_cell_lon ?? null, set_by: buoy.mmm_set_by ?? null,
    set_at: buoy.mmm_set_at ?? null };
}

/** What to store for a request body: { lookup: true, latitude, longitude } | { mmm_c, latitude?,
 * longitude? } | { mmm_c: null } to clear. → the new columns, or { error }. */
async function wantedMmm(body, buoy) {
  const given = coordinates(body);
  if (given.error) return given;
  // Coordinates left out of the body keep the buoy's current ones.
  const omitted = !Object.hasOwn(body ?? {}, "latitude") && !Object.hasOwn(body ?? {}, "longitude");
  const place = omitted ? { latitude: buoy.latitude ?? null, longitude: buoy.longitude ?? null } : given;
  if (body?.lookup === true) {
    if (place.latitude === null) return { error: "Give the buoy's latitude and longitude to look up its MMM." };
    const found = await lookupMmm(place.latitude, place.longitude);
    if (found.error) return { ...found, status: 502 };
    return { ...place, mmm_c: found.mmm, mmm_source: "noaa_crw_5km", mmm_cell_lat: found.cellLat, mmm_cell_lon: found.cellLon };
  }
  if (body?.mmm_c === null) return { ...place, mmm_c: null, mmm_source: null, mmm_cell_lat: null, mmm_cell_lon: null };
  const mmm = Number(body?.mmm_c);
  if (body?.mmm_c === undefined || body?.mmm_c === "" || !(mmm >= MMM_RANGE_C[0] && mmm <= MMM_RANGE_C[1])) {
    return { error: `Give the MMM in °C, ${MMM_RANGE_C[0]}–${MMM_RANGE_C[1]}.` };
  }
  return { ...place, mmm_c: round2(mmm), mmm_source: "manual", mmm_cell_lat: null, mmm_cell_lon: null };
}

const COLUMNS = ["latitude", "longitude", "mmm_c", "mmm_source", "mmm_cell_lat", "mmm_cell_lon"];

/** Set, look up or clear one buoy's MMM and location, and audit the change. */
export async function setMmm(db, actor, buoyId, body, now = Date.now()) {
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  const wanted = await wantedMmm(body, buoy);
  if (wanted.error) return wanted;
  const before = Object.fromEntries(COLUMNS.map((key) => [key, buoy[key] ?? null]));
  const after = Object.fromEntries(COLUMNS.map((key) => [key, wanted[key] ?? null]));
  if (COLUMNS.every((key) => before[key] === after[key])) return { mmm: mmmOf(buoy) };
  await db.prepare("UPDATE buoys SET latitude = ?, longitude = ?, mmm_c = ?, mmm_source = ?, mmm_cell_lat = ?, mmm_cell_lon = ?, " +
    "mmm_set_by = ?, mmm_set_at = ? WHERE buoy_id = ?")
    .bind(...COLUMNS.map((key) => after[key]), actor.email, now, buoy.buoy_id).run();
  await record(db, { actor, action: "buoy.mmm", target: buoy.label, before, after });
  return { mmm: mmmOf({ ...buoy, ...after, mmm_set_by: actor.email, mmm_set_at: now }) };
}
