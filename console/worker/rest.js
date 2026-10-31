/* The REST API under /api/v1 (Phase B, SCO-240), for scripts and notebooks with a personal API
 * token. Documented in openapi.json, which is public. Bearer tokens, not cookies, so there is no
 * CSRF to guard; every call is checked against the token's scopes and its owner's role. */

import { buoyConfig, listBuoys, requestTxCount } from "./fleet.js";
import { apiError, json } from "./http.js";
import openapi from "./openapi.json" with { type: "json" };
import { listReadings, readingsQuery } from "./readings.js";
import { can } from "./roles.js";
import { authenticateToken } from "./tokens.js";

const READINGS = /^\/api\/v1\/buoys\/(\d{1,5})\/readings$/;
const TX_COUNT = /^\/api\/v1\/buoys\/(\d{1,5})\/tx-count$/;

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
  if (request.method === "POST" && txCount) {
    if (!auth.scopes.includes("write:settings")) return apiError("This token lacks the write:settings scope.", 403);
    if (!can(auth.user, "settings.write")) return apiError("The token's owner cannot change settings.", 403);
    const body = await readJson(request);
    if (!body) return apiError("Send a JSON object.", 400);
    const result = await requestTxCount(env.DB, auth.user, txCount[1], body.tx_count);
    return result.error ? apiError(result.error, 400) : json(result);
  }
  return apiError("not found", 404);
}
