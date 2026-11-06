/* Test helpers for Fred: a scripted stand-in for Gemini's streaming REST endpoint (so model.js
 * runs for real against it), a stand-in for the Workers AI binding, and a reader for the SSE
 * reply. Each scripted turn is { text } or { calls: [{ name, args }] } or { status } (an error). */

import { APP_URL } from "./helpers.js";

const GEMINI = "https://generativelanguage.googleapis.com/";

function geminiStream(turn) {
  const parts = turn.calls
    ? turn.calls.map((c) => ({ functionCall: { name: c.name, args: c.args ?? {} }, thoughtSignature: "sig" }))
    : [{ text: turn.text.slice(0, Math.ceil(turn.text.length / 2)) }, { text: turn.text.slice(Math.ceil(turn.text.length / 2)) }];
  const chunks = parts.map((part, i) => ({ candidates: [{ content: { role: "model", parts: [part] } }],
    ...(i === parts.length - 1 ? { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 } } : {}) }));
  return new Response(chunks.map((c) => `data: ${JSON.stringify(c)}\r\n\r\n`).join(""), { headers: { "Content-Type": "text/event-stream" } });
}

/** Replace fetch for Gemini calls with `turns`, in order. Returns the recorded request bodies. */
export function stubGemini(t, turns) {
  const requests = [];
  const queue = [...turns];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith(GEMINI)) return real(url, init);
    requests.push({ url: String(url), body: JSON.parse(init.body), headers: init.headers });
    const turn = queue.shift() ?? { text: "(no more scripted turns)" };
    if (turn.status) return new Response(JSON.stringify({ error: { status: turn.errorStatus ?? "RESOURCE_EXHAUSTED" } }), { status: turn.status });
    return geminiStream(turn);
  };
  t.after(() => { globalThis.fetch = real; });
  return requests;
}

/** A Workers AI binding answering with `turns` ({ response } or { tool_calls }). */
export function stubWorkersAi(turns) {
  const calls = [];
  const queue = [...turns];
  return { calls, async run(model, input) {
    calls.push({ model, input });
    return queue.shift() ?? { response: "(no more scripted turns)" };
  } };
}

/** Parse a text/event-stream body into [{ event, data }]. */
export async function events(response) {
  const text = await response.text();
  return text.split("\n\n").filter(Boolean).map((block) => {
    const event = /^event: (.*)$/m.exec(block)?.[1];
    const data = /^data: (.*)$/m.exec(block)?.[1];
    return { event, data: data ? JSON.parse(data) : null };
  });
}

export const textOf = (list) => list.filter((e) => e.event === "text").map((e) => e.data.delta).join("");

/** Ask Fred one question as `client`; returns { status, events }. */
export async function ask(client, question, context = {}) {
  if (!client.csrf) await client.refreshCsrf();
  const response = await client.raw("/api/assistant", { method: "POST", body: { messages: [{ role: "user", text: question }], context },
    headers: { "X-CSRF-Token": client.csrf } });
  const isStream = (response.headers.get("Content-Type") || "").startsWith("text/event-stream");
  return { status: response.status, events: isStream ? await events(response) : [], body: isStream ? null : await response.json() };
}

export { APP_URL };
