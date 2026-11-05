/* One question, answered: the function-calling loop (at most 8 model calls), the role filter on
 * tools, and the fallback. Gemini first; on a rate-limit error, back off once and retry; still
 * busy (or no key), answer with Workers AI with propose tools off, and say so. */

import { can } from "../roles.js";
import { geminiModel, ModelBusy, ModelError, workersAiModel } from "./model.js";
import { systemInstruction } from "./prompt.js";
import { countCall } from "./usage.js";

const MAX_TURNS = 8;
const DEFAULT_RETRY_MS = 2000;
const FALLBACK_NOTE = "You are the smaller backup model because Gemini is busy, so you have no propose tools and cannot draft " +
  "changes. If the person asks for a change, say so plainly, and tell them they can make it themselves on the page (call " +
  "link_to) or ask again later. Do not tell them their role cannot do it unless the role above says so.";

const LABELS = {
  list_buoys: "Looked at Fleet", get_buoy: "Read buoy {buoy_id}", get_readings: "Read buoy {buoy_id}'s readings",
  list_stations: "Looked at Stations", list_reports: "Looked at Reports", list_dashboards: "Looked at dashboards",
  get_audit: "Read the audit log", get_storage: "Looked at storage", search_docs: "Searched the docs for “{query}”",
  link_to: "Found a link", propose_settings: "Drafted a settings change", propose_restore_defaults: "Drafted a restore to defaults",
  propose_rename_buoy: "Drafted a rename", propose_report: "Drafted a report", propose_station_route: "Drafted a station route",
  propose_revoke_station: "Drafted a station revoke",
};

export function toolLabel(name, args = {}) {
  if (!LABELS[name]) return "Tried a tool it doesn't have";
  return LABELS[name].replace(/\{(\w+)\}/g, (_, key) => String(args[key] ?? "").slice(0, 60));
}

/** The tools this person may be offered: role-checked, and without propose tools when `propose` is false. */
export function toolsFor(user, tools, { propose = true } = {}) {
  return tools.filter((t) => (!t.needs || can(user, t.needs)) && (propose || !t.propose));
}

async function runTool(ctx, tools, call) {
  const tool = tools.find((t) => t.name === call.name);
  if (!tool) return { error: `There is no tool called ${call.name} for you.` };
  try {
    return await tool.run(ctx, call.args ?? {});
  } catch (error) {
    console.error("assistant: tool failed", call.name, error instanceof Error ? error.stack : error);
    return { error: "That tool failed on our side." };
  }
}

async function converse(ctx, model, tools, history, emit) {
  const messages = [...history];
  let streamed = false;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const reply = await model.chat({ system: ctx.system, messages, tools, onText: (delta) => {
      streamed = true;
      emit("text", { delta });
    } }).catch((error) => {
      if (streamed && error instanceof ModelBusy) emit("reset", {});
      throw error;
    });
    await countCall(ctx.env, ctx.user.id, { usage: reply.usage, fallback: model.provider !== "gemini" }, ctx.now);
    if (!reply.toolCalls.length) {
      if (!reply.text.trim()) emit("text", { delta: "I couldn't put an answer together. Try asking another way." });
      return { provider: model.provider };
    }
    messages.push({ role: "assistant", text: reply.text, toolCalls: reply.toolCalls });
    const results = [];
    for (const call of reply.toolCalls) {
      emit("tool", { name: call.name, label: toolLabel(call.name, call.args) });
      const result = await runTool(ctx, tools, call);
      if (result?.card) emit("action", result.card);
      results.push({ id: call.id, name: call.name, result });
    }
    messages.push({ role: "tool", results });
  }
  emit("text", { delta: "\n\nI used my step limit for one question. Ask again more narrowly and I'll pick up from there." });
  return { provider: model.provider };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{ env: object, user: object, history: object[], context?: object, tools: object[], emit: Function, now?: number }} input
 * @returns {Promise<{ provider: string }>}
 */
export async function answer({ env, user, history, context = {}, tools, emit, now = Date.now() }) {
  const ctx = { env, user, now, system: systemInstruction(user, context, now) };
  const offered = toolsFor(user, tools);
  if (env.GEMINI_API_KEY) {
    const gemini = geminiModel(env);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await converse(ctx, gemini, offered, history, emit);
      } catch (error) {
        if (!(error instanceof ModelBusy)) throw error;
        if (attempt === 0) await wait(Number(env.ASSISTANT_RETRY_MS ?? DEFAULT_RETRY_MS));
      }
    }
  }
  if (!env.AI) throw new ModelBusy("Fred is over today's limit.");
  emit("notice", { message: env.GEMINI_API_KEY
    ? "Gemini is busy, so a smaller model answered. It can't draft changes."
    : "Gemini isn't set up here, so a smaller model answered. It can't draft changes." });
  const fallback = { ...ctx, system: `${ctx.system}\n\n# Right now\n${FALLBACK_NOTE}` };
  return converse(fallback, workersAiModel(env), toolsFor(user, tools, { propose: false }), history, emit);
}

export { ModelBusy, ModelError };
