/* Fred's read tools (ADR-0013 → Design). Every role gets them except get_storage,
 * which is admin-only like the Storage page. Each runs the same queries the pages use and returns
 * compact results: no email addresses, token values or hashes, and readings downsampled. */

import { recent } from "../audit.js";
import { REGISTRY } from "../buoy-settings.js";
import { listDashboards } from "../dashboards.js";
import { listDevices } from "../device.js";
import { buoyConfig, listBuoys, SLOT_LABELS } from "../fleet.js";
import { listReadings } from "../readings.js";
import { listReports } from "../reports.js";
import { BUDGET, usage } from "../storage.js";
import { searchDocs } from "./knowledge.js";
import { usageToday } from "./usage.js";

const HOUR_MS = 3600 * 1000;
const DAY_S = 86400;
const MAX_POINTS = 200;
const SLOT_INDICES = { 1: [0], 2: [0, 2], 3: [0, 1, 2] };
const EMAIL = /[^\s@"'<>(),;:]{1,64}@[^\s@"'<>(),;:]{1,190}\.[^\s@"'<>(),;:]{2,63}/g;
const NUMERIC = ["temp_c", "turbidity_fau", "battery_v", "internal_temp_c", "internal_humidity_pct", "lvl_anthro_cdb",
  "lvl_mixed_cdb", "lvl_bio_cdb", "lvl_broad_cdb", "ndsi_e4", "snap_count", "clip_count"];
const iso = (ms) => (ms ? new Date(ms).toISOString().slice(0, 16) + "Z" : null);

/** Every email in `text` becomes that person's name, or "a team member". */
async function nameMap(db) {
  const { results } = await db.prepare("SELECT email, name FROM users").all();
  return new Map(results.map((u) => [u.email.toLowerCase(), u.name || "a team member"]));
}
export function scrubEmails(text, names = new Map()) {
  return String(text ?? "").replace(EMAIL, (email) => names.get(email.toLowerCase()) ?? "a team member");
}

/** The slots a buoy uses (seconds after midnight UTC), from its wanted count and phase. */
function slotsFor(buoy) {
  const value = (key) => buoy.settings_wanted[REGISTRY.findIndex((s) => s.key === key)];
  const count = buoy.tx_count_reported ?? value("tx_count");
  return (SLOT_INDICES[count] ?? []).map((i) => (buoyConfig.slotsSod[i] + value("slot_phase_h") * 3600) % DAY_S).sort((a, b) => a - b);
}

/** Live / Late / Silent / Not heard, as the Fleet page works it out (web/src/lib/buoy-status.ts). */
export function health(buoy, now) {
  if (buoy.disconnected_at) return "disconnected";
  if (!buoy.last_seen_at) return "not heard";
  const slots = slotsFor(buoy);
  const gaps = slots.map((s, i) => ((slots[(i + 1) % slots.length] - s + DAY_S) % DAY_S) || DAY_S);
  const gap = (slots.length > 1 ? Math.max(...gaps) * 1000 : DAY_S * 1000) + HOUR_MS;
  const age = now - buoy.last_seen_at;
  return age <= gap ? "live" : age <= 2 * gap ? "late" : "silent";
}

function nextTransmit(buoy, now) {
  const slots = slotsFor(buoy);
  const dayStart = Math.floor(now / 1000 / DAY_S) * DAY_S;
  for (const day of [dayStart, dayStart + DAY_S]) for (const sod of slots) if ((day + sod) * 1000 > now) return iso((day + sod) * 1000);
  return null;
}

async function latestReading(db, buoyId) {
  return (await listReadings(db, buoyId, { limit: 1 }))[0] ?? null;
}

async function buoySummary(db, buoy, now) {
  const last = await latestReading(db, buoy.buoy_id);
  return {
    buoy_id: buoy.buoy_id, label: buoy.label, health: health(buoy, now), last_heard: iso(buoy.last_seen_at),
    next_transmit: nextTransmit(buoy, now), transmits_a_day: buoy.tx_count_reported, count_state: buoy.state,
    settings_state: buoy.settings_state, battery_v: last?.battery_v ?? null, clock_lost: Boolean(buoy.clock_lost),
  };
}

function stats(rows, key) {
  const values = rows.map((r) => r[key]).filter((v) => v !== "" && v !== null && v !== undefined)
    .map(Number).filter(Number.isFinite);
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { min: Math.min(...values), max: Math.max(...values), mean: Math.round(mean * 1000) / 1000, n: values.length };
}

const buoyIdParam = { type: "integer", description: "The buoy's numeric ID, e.g. 1 for SCOUT-01" };

export const READ_TOOLS = [
  {
    name: "list_buoys",
    description: "Every buoy: label, health (live/late/silent/not heard/disconnected), last heard, next transmit, transmits a day, settings state, battery voltage.",
    parameters: { type: "object", properties: {} },
    run: async ({ env, now }) => ({ buoys: await Promise.all((await listBuoys(env.DB)).map((b) => buoySummary(env.DB, b, now))) }),
  },
  {
    name: "get_buoy",
    description: "One buoy in full: requested vs wanted settings, wanted vs reported digest, settings state, command station, latest reading.",
    parameters: { type: "object", properties: { buoy_id: buoyIdParam }, required: ["buoy_id"] },
    run: async ({ env, now }, { buoy_id: id }) => {
      const buoy = (await listBuoys(env.DB)).find((b) => b.buoy_id === Number(id));
      if (!buoy) return { error: `No buoy ${id}.` };
      const station = buoy.command_device_id
        ? await env.DB.prepare("SELECT name, revoked_at FROM devices WHERE id = ?").bind(buoy.command_device_id).first() : null;
      const names = await nameMap(env.DB);
      return {
        ...(await buoySummary(env.DB, buoy, now)),
        settings: REGISTRY.map((spec, i) => ({ key: spec.key, label: spec.label, unit: spec.unit, default: spec.default,
          requested: buoy.settings_requested[spec.key], wanted: buoy.settings_wanted[i] })),
        digest_wanted: buoy.settings_digest_wanted, digest_reported: buoy.settings_digest_reported,
        command_rejected: Boolean(buoy.cmd_rejected), send_times: SLOT_LABELS[buoy.tx_count_reported] ?? null,
        command_station: station ? `${station.name}${station.revoked_at ? " (revoked)" : ""}` : "none picked",
        last_requested_by: buoy.requested_by ? scrubEmails(buoy.requested_by, names) : null,
        latest_reading: await latestReading(env.DB, buoy.buoy_id),
      };
    },
  },
  {
    name: "get_readings",
    description: "A buoy's readings over a time window, at most 200 points (evenly downsampled), with min/max/mean per variable.",
    parameters: { type: "object", properties: {
      buoy_id: buoyIdParam,
      hours: { type: "integer", description: "How many hours back from now (default 24, max 720)" },
      from: { type: "string", description: "Optional UTC start like 2026-11-04T00:00:00Z (overrides hours)" },
      to: { type: "string", description: "Optional UTC end like 2026-11-05T00:00:00Z" },
      variables: { type: "array", items: { type: "string" }, description: `Which of: ${NUMERIC.join(", ")}. Default: all` },
    }, required: ["buoy_id"] },
    run: async ({ env, now }, args) => {
      const hours = Math.min(720, Math.max(1, Number(args.hours) || 24));
      const stamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
      const from = stamp.test(args.from ?? "") ? args.from : new Date(now - hours * HOUR_MS).toISOString().slice(0, 19) + "Z";
      const to = stamp.test(args.to ?? "") ? args.to : "";
      const rows = (await listReadings(env.DB, Number(args.buoy_id), { from, to, limit: 1000 })).reverse();
      const vars = (Array.isArray(args.variables) ? args.variables : NUMERIC).filter((v) => NUMERIC.includes(v));
      const step = Math.max(1, Math.ceil(rows.length / MAX_POINTS));
      const points = rows.filter((_, i) => i % step === 0)
        .map((r) => ({ t: r.timestamp_utc, ...Object.fromEntries(vars.map((v) => [v, r[v] === "" ? null : r[v]])), flags: r.flags || undefined }));
      return { buoy_id: Number(args.buoy_id), from, to: to || "now", count: rows.length, shown: points.length,
        stats: Object.fromEntries(vars.map((v) => [v, stats(rows, v)])), points };
    },
  },
  {
    name: "list_stations",
    description: "Shore stations (name, active or revoked, last seen), the buoys each one commands, and buoys with no command station.",
    parameters: { type: "object", properties: {} },
    run: async ({ env }) => {
      const devices = await listDevices(env.DB);
      const buoys = await listBuoys(env.DB);
      const active = devices.filter((d) => !d.revoked_at);
      return {
        stations: devices.map((d) => ({ name: d.name, active: !d.revoked_at, last_seen: iso(d.last_seen_at), created: iso(d.created_at),
          commands: buoys.filter((b) => b.command_device_id === d.id).map((b) => b.label) })),
        // With one active station it sends everyone's commands; with more, a buoy needs one picked.
        buoys_without_station: active.length === 1 ? [] : buoys.filter((b) => !active.some((d) => d.id === b.command_device_id)).map((b) => b.label),
      };
    },
  },
  {
    name: "list_reports",
    description: "The person's own CSV reports: buoys, date range, rows, when made and when the file expires.",
    parameters: { type: "object", properties: {} },
    run: async ({ env, user }) => ({ reports: (await listReports(env.DB, user.id)).map((r) => ({ id: r.id, buoys: r.params.buoys,
      from: r.params.from, to: r.params.to, columns: r.params.columns, rows: r.rows, made: iso(r.created_at), file_expires: iso(r.expires_at) })) }),
  },
  {
    name: "list_dashboards",
    description: "Dashboard views the person can see: shared ones and their own, with how many bays each has.",
    parameters: { type: "object", properties: {} },
    run: async ({ env, user }) => ({ dashboards: (await listDashboards(env.DB, user.id)).map((d) => ({ name: d.name,
      shared: d.shared, bays: d.bays.length, updated: iso(d.updated_at) })) }),
  },
  {
    name: "get_audit",
    description: "Recent audit log entries (who changed what, before and after), newest first. Filter by action (e.g. buoy.settings) or target text.",
    parameters: { type: "object", properties: {
      action: { type: "string", description: "Only entries whose action starts with this" },
      target: { type: "string", description: "Only entries whose target contains this" },
      limit: { type: "integer", description: "At most this many (default 20, max 50)" },
    } },
    run: async ({ env }, args) => {
      const names = await nameMap(env.DB);
      const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));
      const entries = (await recent(env.DB, 500))
        .filter((e) => !args.action || e.action.startsWith(args.action))
        .filter((e) => !args.target || String(e.target).toLowerCase().includes(String(args.target).toLowerCase()))
        .slice(0, limit);
      return { entries: entries.map((e) => ({ at: iso(e.at), who: scrubEmails(e.actor_label, names), action: e.action,
        target: scrubEmails(e.target, names), before: scrubEmails(e.before_json ?? "", names) || null,
        after: scrubEmails(e.after_json ?? "", names) || null })) };
    },
  },
  {
    name: "get_storage",
    description: "Admin only: R2 file storage use against the console's budget, and today's assistant usage.",
    needs: "storage.read",
    parameters: { type: "object", properties: {} },
    run: async ({ env, now }) => ({ files: await usage(env.DB, now), budget: BUDGET, assistant_today: await usageToday(env.DB, now) }),
  },
  {
    name: "search_docs",
    description: "Search the project's repo documents (ADRs, engineering design document, facts, decision log, console README). Returns passages with file paths to cite.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Keywords" } }, required: ["query"] },
    run: async (_, { query }) => ({ passages: searchDocs(query, 5) }),
  },
  {
    name: "link_to",
    description: "A console link for a page, optionally a tab or a buoy. Pages: dashboard, fleet, stations, readings, reports, team, settings (tabs buoys, account, browser), developer (tabs tokens, audit), help.",
    parameters: { type: "object", properties: {
      page: { type: "string" }, tab: { type: "string" }, buoy_id: buoyIdParam,
    }, required: ["page"] },
    run: async (_, { page, tab, buoy_id: buoy }) => {
      const PAGES = { dashboard: [], fleet: [], stations: [], readings: [], reports: [], team: [], help: [],
        settings: ["buoys", "account", "browser"], developer: ["tokens", "audit"], audit: [] };
      const key = String(page || "").toLowerCase().replace(/[^a-z]/g, "");
      if (key.startsWith("audit")) return { path: "/developer/?tab=audit" };
      if (!Object.hasOwn(PAGES, key)) return { error: `No page called ${page}.` };
      const params = new URLSearchParams();
      if (tab && PAGES[key].includes(tab) && tab !== PAGES[key][0]) params.set("tab", tab);
      if (buoy && key === "settings") params.set("buoy", String(Number(buoy)));
      const query = params.toString();
      return { path: `/${key}/${query ? `?${query}` : ""}` };
    },
  },
];
