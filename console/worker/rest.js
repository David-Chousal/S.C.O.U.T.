/* The REST API under /api/v1 (Phase B, SCO-240), for scripts and notebooks with a personal API
 * token. Documented in openapi.json, which is public. Bearer tokens, not cookies, so there is no
 * CSRF to guard; every call is checked against the token's scopes and its owner's role.
 * Firmware upload and cancel (SCO-312) are in firmware.js. */

import { cancelFirmware, FIRMWARE_UPLOAD, listFirmware, uploadFirmware } from "./firmware.js";
import { buoyConfig, listBuoys, requestSettings, requestTxCount } from "./fleet.js";
import { apiError, json } from "./http.js";
import openapi from "./openapi.json" with { type: "json" };
import { listReadings, readingsQuery } from "./readings.js";
import { can } from "./roles.js";
import { authenticateToken } from "./tokens.js";

const READINGS = /^\/api\/v1\/buoys\/(\d{1,5})\/readings$/;
const TX_COUNT = /^\/api\/v1\/buoys\/(\d{1,5})\/tx-count$/;
const SETTINGS = /^\/api\/v1\/buoys\/(\d{1,5})\/settings$/;
const FIRMWARE_CANCEL = /^\/api\/v1\/firmware\/([\w-]{1,64})\/cancel$/;

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

async function reads(env, url, path) {
  if (path === "/api/v1/buoys") return json({ buoys: await listBuoys(env.DB) });
  if (path === "/api/v1/settings") return json({ buoys: await listBuoys(env.DB), firmware: buoyConfig });
  const readings = READINGS.exec(path);
  if (readings) {
    const query = readingsQuery(url.searchParams);
    if (query.error) return apiError(query.error, 400);
    return json({ readings: await listReadings(env.DB, readings[1], query) });
  }
  const firmware = FIRMWARE_UPLOAD.exec(path);
  if (firmware) return json({ jobs: await listFirmware(env.DB, firmware[1]) });
  return null;
}

export async function handleRest(request, env, path) {
  if (path === "/api/v1/openapi.json" && request.method === "GET") return json(openapi);
  const auth = await authenticateToken(env.DB, request);
  if (!auth) return apiError("Send a valid API token: Authorization: Bearer sct_…", 401);
  if (request.method === "GET") {
    if (!auth.scopes.includes("read:telemetry")) return apiError("This token lacks the read:telemetry scope.", 403);
    return (await reads(env, new URL(request.url), path)) ?? apiError("not found", 404);
  }
  const txCount = TX_COUNT.exec(path);
  const settings = SETTINGS.exec(path);
  if (request.method === "POST" && (txCount || settings)) {
    if (!auth.scopes.includes("write:settings")) return apiError("This token lacks the write:settings scope.", 403);
    if (!can(auth.user, "settings.write")) return apiError("The token's owner cannot change settings.", 403);
    const body = await readJson(request);
    if (!body) return apiError("Send a JSON object.", 400);
    const result = txCount
      ? await requestTxCount(env.DB, auth.user, txCount[1], body.tx_count)
      : await requestSettings(env.DB, auth.user, settings[1], body.settings);
    return result.error ? apiError(result.error, 400) : json(result);
  }
  const upload = FIRMWARE_UPLOAD.exec(path);
  const cancel = FIRMWARE_CANCEL.exec(path);
  if (request.method === "POST" && (upload || cancel)) return firmwareWrite(request, env, auth, upload, cancel);
  return apiError("not found", 404);
}

/** Upload or cancel firmware (SCO-312): the token needs write:firmware and its owner must be an admin. */
async function firmwareWrite(request, env, auth, upload, cancel) {
  if (!auth.scopes.includes("write:firmware")) return apiError("This token lacks the write:firmware scope.", 403);
  if (!can(auth.user, "firmware.write")) return apiError("Only an admin's token can upload or cancel firmware.", 403);
  const result = upload
    ? await uploadFirmware(env.DB, auth.user, upload[1], new Uint8Array(await request.arrayBuffer()))
    : await cancelFirmware(env.DB, auth.user, cancel[1]);
  return result.error ? apiError(result.error, result.status) : json(result);
}
