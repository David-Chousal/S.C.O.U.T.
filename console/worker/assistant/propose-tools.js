/* Fred's propose tools (ADR-0013, Phase 2). Each validates the change with the same checks the
 * page runs, so a change the buoy or the console would refuse never becomes a card, then stores
 * it as a pending action. Nothing changes until the person clicks Confirm (actions.js). Members
 * and admins only; guests are never offered these, and confirm re-checks the role regardless. */

import { KEYS, REGISTRY, requestedOf, snapshotError, wantedOf } from "../buoy-settings.js";
import { buoyConfig, estimates } from "../fleet.js";
import { REPORT_COLUMNS, validRequest } from "../reports.js";
import { NEEDS, propose } from "./actions.js";

const SLOT_INDICES = { 1: [0], 2: [0, 2], 3: [0, 1, 2] };
const LABEL = /^[\w .·()-]{1,40}$/u;
const SPEC = new Map(REGISTRY.map((s) => [s.key, s]));
const WAITING = "Shown to the person as a card. Nothing has changed: it runs only if they click Confirm within 10 minutes.";

function sendTimes(count, phaseH) {
  return (SLOT_INDICES[count] ?? []).map((i) => (buoyConfig.slotsSod[i] + phaseH * 3600) % 86400).sort((a, b) => a - b)
    .map((s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}`).join(", ") + " UTC";
}

function life(count) {
  const pick = (scenario, cells) => estimates.with_listen_window.find((r) => r.scenario === scenario && r.tx_per_day === count && r.cells === cells);
  const best = pick("best", 2);
  const worst = pick("pessimistic", 2);
  return best && worst ? `${worst.months}–${best.months} months on 2 D cells (estimate)` : null;
}

async function buoyRow(db, id) {
  return db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(id)).first();
}

const show = (key, value) => (value === null ? `default (${SPEC.get(key).default})` : `${value}${SPEC.get(key).unit ? ` ${SPEC.get(key).unit}` : ""}`);

async function card(ctx, input) {
  const made = await propose(ctx.env, ctx.user, input, ctx.now);
  return { card: made, proposed: input.title, status: WAITING };
}

async function stationByName(db, name) {
  const { results } = await db.prepare("SELECT id, name FROM devices WHERE revoked_at IS NULL").all();
  const wanted = String(name ?? "").trim().toLowerCase();
  const exact = results.find((d) => d.name.toLowerCase() === wanted);
  if (exact || !wanted) return exact ?? null;
  const partial = results.filter((d) => d.name.toLowerCase().includes(wanted));
  return partial.length === 1 ? partial[0] : null;
}

const buoyIdParam = { type: "integer", description: "The buoy's numeric ID" };

export const PROPOSE_TOOLS = [
  {
    name: "propose_settings",
    propose: true,
    needs: NEEDS.settings,
    description: `Propose remote settings for one buoy. changes maps setting keys to a new value, or null for that setting's default. Keys: ${KEYS.join(", ")}.`,
    parameters: { type: "object", properties: { buoy_id: buoyIdParam,
      changes: { type: "object", description: "e.g. { \"tx_count\": 2 }", properties: Object.fromEntries(KEYS.map((k) => [k, { type: "integer", nullable: true, description: SPEC.get(k).label }])) },
    }, required: ["buoy_id", "changes"] },
    async run(ctx, { buoy_id: id, changes }) {
      if (!changes || typeof changes !== "object" || !Object.keys(changes).length) return { error: "Name at least one setting to change." };
      const unknown = Object.keys(changes).filter((k) => !KEYS.includes(k));
      if (unknown.length) return { error: `Unknown setting: ${unknown.join(", ")}. Keys: ${KEYS.join(", ")}.` };
      const buoy = await buoyRow(ctx.env.DB, id);
      if (!buoy) return { error: `No buoy ${id}.` };
      const { results } = await ctx.env.DB.prepare("SELECT * FROM buoy_settings WHERE buoy_id = ?").bind(buoy.buoy_id).all();
      const before = requestedOf(buoy, results);
      const after = { ...before };
      for (const [key, value] of Object.entries(changes)) after[key] = value === null ? null : Number(value);
      const problem = snapshotError(wantedOf(after));
      if (problem) return { error: `The buoy would refuse that: ${problem}` };
      const changed = KEYS.filter((k) => after[k] !== before[k]);
      if (!changed.length) return { error: "Those are already the requested values; nothing to change." };
      const value = (snapshot, key) => snapshot[key] ?? SPEC.get(key).default;
      const details = changed.map((k) => [SPEC.get(k).label, `${show(k, before[k])} → ${show(k, after[k])}`]);
      if (changed.includes("tx_count") || changed.includes("slot_phase_h")) {
        details.push(["Sends at", sendTimes(value(after, "tx_count"), value(after, "slot_phase_h"))]);
      }
      if (changed.includes("tx_count") && life(value(after, "tx_count"))) details.push(["Battery", life(value(after, "tx_count"))]);
      const params = { buoy_id: buoy.buoy_id, changes: Object.fromEntries(changed.map((k) => [k, after[k]])) };
      return card(ctx, { kind: "settings", params, title: `Change ${buoy.label}'s settings`, details });
    },
  },
  {
    name: "propose_restore_defaults",
    propose: true,
    needs: NEEDS.restore_defaults,
    description: "Propose putting one buoy back on every firmware default setting.",
    parameters: { type: "object", properties: { buoy_id: buoyIdParam }, required: ["buoy_id"] },
    async run(ctx, { buoy_id: id }) {
      const buoy = await buoyRow(ctx.env.DB, id);
      if (!buoy) return { error: `No buoy ${id}.` };
      const { results } = await ctx.env.DB.prepare("SELECT * FROM buoy_settings WHERE buoy_id = ?").bind(buoy.buoy_id).all();
      const before = requestedOf(buoy, results);
      const differing = KEYS.filter((k) => before[k] !== null && before[k] !== SPEC.get(k).default);
      const details = differing.length ? differing.map((k) => [SPEC.get(k).label, `${show(k, before[k])} → ${SPEC.get(k).default}`])
        : [["Settings", "Already on defaults; this re-sends them"]];
      return card(ctx, { kind: "restore_defaults", params: { buoy_id: buoy.buoy_id }, title: `Restore ${buoy.label} to defaults`, details });
    },
  },
  {
    name: "propose_rename_buoy",
    propose: true,
    needs: NEEDS.rename_buoy,
    description: "Propose a new console name for a buoy (1-40 letters, numbers, spaces or - . ( )). The buoy keeps its numeric ID.",
    parameters: { type: "object", properties: { buoy_id: buoyIdParam, label: { type: "string" } }, required: ["buoy_id", "label"] },
    async run(ctx, { buoy_id: id, label }) {
      const name = String(label ?? "").trim();
      if (!LABEL.test(name)) return { error: "Use 1–40 letters, numbers, spaces or - . ( )" };
      const buoy = await buoyRow(ctx.env.DB, id);
      if (!buoy) return { error: `No buoy ${id}.` };
      if (buoy.label === name) return { error: `It is already called ${name}.` };
      return card(ctx, { kind: "rename_buoy", params: { buoy_id: buoy.buoy_id, label: name }, title: `Rename buoy ${buoy.buoy_id}`,
        details: [["Name", `${buoy.label} → ${name}`]] });
    },
  },
  {
    name: "propose_report",
    propose: true,
    needs: NEEDS.report,
    description: `Propose a downloadable CSV report. columns from: ${REPORT_COLUMNS.join(", ")}.`,
    parameters: { type: "object", properties: {
      buoys: { type: "array", items: { type: "integer" }, description: "Buoy IDs" },
      from: { type: "string", description: "UTC start like 2026-11-01T00:00:00Z" },
      to: { type: "string", description: "UTC end like 2026-11-05T00:00:00Z" },
      columns: { type: "array", items: { type: "string" } },
    }, required: ["buoys", "from", "to", "columns"] },
    async run(ctx, args) {
      const request = validRequest(args);
      if (request.error) return { error: request.error };
      return card(ctx, { kind: "report", params: { request }, title: "Make a CSV report", details: [
        ["Buoys", request.buoys.join(", ")], ["From", request.from], ["To", request.to], ["Columns", request.columns.join(", ")]] });
    },
  },
  {
    name: "propose_station_route",
    propose: true,
    needs: NEEDS.station_route,
    description: "Admin: propose which active shore station sends a buoy's commands. station is the station's name, or \"none\" to clear it.",
    parameters: { type: "object", properties: { buoy_id: buoyIdParam, station: { type: "string" } }, required: ["buoy_id", "station"] },
    async run(ctx, { buoy_id: id, station }) {
      const buoy = await buoyRow(ctx.env.DB, id);
      if (!buoy) return { error: `No buoy ${id}.` };
      const clear = /^(none|no station|null)$/i.test(String(station ?? "").trim());
      const device = clear ? null : await stationByName(ctx.env.DB, station);
      if (!clear && !device) return { error: `No single active shore station matches "${station}". Call list_stations for the names.` };
      if ((device?.id ?? null) === (buoy.command_device_id ?? null)) return { error: "That is already its route." };
      return card(ctx, { kind: "station_route", params: { buoy_id: buoy.buoy_id, device_id: device?.id ?? null },
        title: `Route ${buoy.label}'s commands`, details: [["Command station", device ? device.name : "none (cleared)"]] });
    },
  },
  {
    name: "propose_revoke_station",
    propose: true,
    needs: NEEDS.revoke_station,
    description: "Admin: propose revoking a shore station's token, which stops it pushing readings. Deleting stays manual on Stations.",
    parameters: { type: "object", properties: { station: { type: "string", description: "The station's name" } }, required: ["station"] },
    async run(ctx, { station }) {
      const device = await stationByName(ctx.env.DB, station);
      if (!device) return { error: `No single active shore station matches "${station}".` };
      const { results } = await ctx.env.DB.prepare("SELECT label FROM buoys WHERE command_device_id = ?").bind(device.id).all();
      const details = [["Station", device.name], ["Effect", "It can no longer push readings or fetch commands"]];
      if (results.length) details.push(["Loses route", results.map((b) => b.label).join(", ")]);
      return card(ctx, { kind: "revoke_station", params: { device_id: device.id }, title: `Revoke ${device.name}'s token`, details });
    },
  },
];
