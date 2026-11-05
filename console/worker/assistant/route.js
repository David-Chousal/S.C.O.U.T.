/* /api/assistant*: Fred's routes, behind the same session and CSRF checks as the rest of /api.
 *
 *   GET  /api/assistant/status   → { enabled, used, cap }
 *   GET  /api/assistant/brief    → { brief: { day, text, provider, created_at } | null }  (the morning brief)
 *   POST /api/assistant          { messages: [{ role: "user"|"assistant", text }], context: { page, tab, buoy } }
 *                                → text/event-stream: text · tool · action · notice · reset · done · error
 *   POST /api/assistant/confirm  { id } → runs a proposed change as the person (role re-checked, audited "via Fred")
 *   POST /api/assistant/decline  { id } → drops it
 *
 * The conversation lives only in the open panel: the browser sends it back with each question,
 * and nothing of it is stored here (ADR-0013). Only counts land in assistant_usage. */

import { constantTimeEqual } from "../crypto.js";
import { apiError, json, sameOrigin, SECURITY_HEADERS } from "../http.js";
import { loadSession } from "../sessions.js";
import { confirm, decline } from "./actions.js";
import { latestBrief } from "./brief.js";
import { answer, ModelBusy } from "./loop.js";
import { PROPOSE_TOOLS } from "./propose-tools.js";
import { READ_TOOLS } from "./read-tools.js";
import { capFor, takeQuestion, today } from "./usage.js";

const MAX_BODY_CHARS = 64 * 1024;
const MAX_MESSAGES = 20;
const MAX_TEXT = 4000;

export const TOOLS = [...READ_TOOLS, ...PROPOSE_TOOLS];

/** A request body → { history, context }, or { error }. */
export function validQuestion(body) {
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (!messages.length) return { error: "Ask a question." };
  const history = [];
  for (const m of messages) {
    if (!["user", "assistant"].includes(m?.role) || typeof m.text !== "string") return { error: "Each message needs a role and text." };
    history.push({ role: m.role, text: m.text.slice(0, MAX_TEXT) });
  }
  if (history.at(-1).role !== "user" || !history.at(-1).text.trim()) return { error: "End with your question." };
  while (history[0].role !== "user") history.shift();
  const raw = body.context ?? {};
  const word = (v) => (typeof v === "string" && /^[\w/?=&.-]{1,80}$/.test(v) ? v : undefined);
  const buoy = Number(raw.buoy);
  return { history, context: { page: word(raw.page), tab: word(raw.tab), buoy: Number.isInteger(buoy) && buoy > 0 ? buoy : undefined } };
}

function sse(run) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event, data) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        await run(emit);
      } catch (error) {
        if (!(error instanceof ModelBusy)) console.error("assistant: failed", error instanceof Error ? error.stack : error);
        emit("error", { message: error instanceof ModelBusy
          ? "Fred is over today's free limit. Try again later, or tomorrow."
          : error?.message && error.name === "ModelError" ? error.message : "Fred hit a problem on our side. It has been logged." });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { ...SECURITY_HEADERS, "Content-Type": "text/event-stream; charset=utf-8", "X-Accel-Buffering": "no" } });
}

async function readBody(request) {
  if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return null;
  try {
    const body = JSON.parse(text || "{}");
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

async function ask(request, env, session) {
  const body = await readBody(request);
  if (!body) return apiError("Send a JSON object of at most 64 KB.", 415);
  const question = validQuestion(body);
  if (question.error) return apiError(question.error, 400);
  if (!env.GEMINI_API_KEY && !env.AI) return apiError("Fred is not set up on this console.", 503);
  const now = Date.now();
  const taken = await takeQuestion(env, session.user, now);
  if (!taken.ok) return apiError(`That's your ${taken.cap} questions for today (UTC). Fred resets at midnight UTC.`, 429);
  return sse(async (emit) => {
    const done = await answer({ env, user: session.user, history: question.history, context: question.context, tools: TOOLS, emit, now });
    emit("done", { provider: done.provider, used: taken.used, cap: taken.cap });
  });
}

export async function handleAssistant(request, env, path) {
  if (request.method === "POST" && !sameOrigin(request, env.APP_URL)) return apiError("Requests must come from the console itself.", 403);
  const session = await loadSession(env.DB, request);
  if (!session) return apiError("Sign in first.", 401);
  if (request.method === "GET" && path === "/api/assistant/status") {
    const row = await env.DB.prepare("SELECT questions FROM assistant_usage WHERE user_id = ? AND day = ?").bind(session.user.id, today()).first();
    return json({ enabled: Boolean(env.GEMINI_API_KEY || env.AI), used: row?.questions ?? 0, cap: capFor(env, session.user.role) });
  }
  if (request.method === "GET" && path === "/api/assistant/brief") return json({ brief: await latestBrief(env.DB) });
  if (request.method !== "POST") return apiError("method not allowed", 405);
  if (!constantTimeEqual(request.headers.get("X-CSRF-Token") || "", session.csrf)) {
    return apiError("This page is out of date. Reload it and try again.", 403);
  }
  if (path === "/api/assistant") return ask(request, env, session);
  if (path === "/api/assistant/confirm" || path === "/api/assistant/decline") {
    const body = await readBody(request);
    if (!body) return apiError("Send a JSON object.", 415);
    const result = await (path.endsWith("confirm") ? confirm : decline)(env, session.user, body.id);
    return result.error ? apiError(result.error, result.status) : json(result);
  }
  return apiError("not found", 404);
}
