/* Fred's model interface (ADR-0013 → Decision 1).
 *
 * One function, chat({ system, messages, tools, onText }), in our own message shape, so Gemini's
 * request format stays in this file and the fallback (Workers AI) is a second implementation of
 * the same function. Plain fetch, no SDK, so the Worker bundle stays small.
 *
 * Messages:  { role: "user", text }
 *            { role: "assistant", text, toolCalls: [{ id, name, args, signature? }] }
 *            { role: "tool", results: [{ id, name, result }] }
 * Tools:     [{ name, description, parameters }]   (JSON Schema object)
 * Returns:   { text, toolCalls, usage: { in, out } }
 *
 * Google retires and renames models often, so every model ID lives in MODELS. The free tier's
 * Flash models were checked against Google's model and pricing pages on 2026-11-05. */

export const MODELS = Object.freeze({
  // Free tier, 2026-11-05: Flash-Lite allows about 500 requests a day per project; gemini-3.8-flash
  // and 3.6-flash allow 20, which a single question (2-9 model calls) can nearly use up.
  chat: "gemini-3.5-flash-lite",
  brief: "gemini-3.5-flash-lite",
  fallback: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", // Workers AI, supports function calling
});

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_OUTPUT_TOKENS = 2048;

/** Gemini or Workers AI said "too many requests" (or "overloaded"): try the other one. */
export class ModelBusy extends Error {}

/** Anything else that went wrong talking to a model. The message is safe to show. */
export class ModelError extends Error {}

function geminiContents(messages) {
  return messages.map((m) => {
    if (m.role === "user") return { role: "user", parts: [{ text: m.text }] };
    if (m.role === "tool") {
      return { role: "user", parts: m.results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.result } } })) };
    }
    const parts = m.text ? [{ text: m.text }] : [];
    for (const call of m.toolCalls ?? []) {
      parts.push({ functionCall: { name: call.name, args: call.args }, ...(call.signature ? { thoughtSignature: call.signature } : {}) });
    }
    return { role: "model", parts };
  });
}

/** Server-sent events from a fetch body, one parsed `data:` object at a time. */
async function* sseData(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    let cut;
    while ((cut = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const event = buffer.slice(0, cut);
      buffer = buffer.slice(cut).replace(/^\r?\n\r?\n/, "");
      const data = event.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
      if (data) yield JSON.parse(data);
    }
    if (done) return;
  }
}

async function geminiFailure(response) {
  const detail = await response.json().catch(() => ({}));
  const status = detail?.error?.status ?? "";
  if (/prepayment|credits are depleted/i.test(detail?.error?.message ?? "")) {
    // Not a rate limit: the key's Google project has billing on and no credit left, so it is off
    // the free tier. Fall back like a rate limit, but say why in the log.
    console.error("assistant: gemini key's project has no credit (billing enabled); create the key in a project without billing");
  }
  if (response.status === 429 || response.status === 503 || status === "RESOURCE_EXHAUSTED" || status === "UNAVAILABLE") {
    return new ModelBusy(`Gemini is busy (${response.status}).`);
  }
  // Google's message can name the project; keep only the status for the log and the reader.
  console.error("assistant: gemini error", response.status, status);
  return new ModelError(`Gemini refused the request (${response.status}${status ? ` ${status}` : ""}).`);
}

export function geminiModel(env, id = MODELS.chat) {
  return {
    provider: "gemini",
    id,
    async chat({ system, messages, tools = [], onText = () => {} }) {
      if (!env.GEMINI_API_KEY) throw new ModelError("Fred has no Gemini key (GEMINI_API_KEY).");
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: geminiContents(messages),
        generationConfig: { temperature: 0.2, maxOutputTokens: MAX_OUTPUT_TOKENS },
        ...(tools.length ? { tools: [{ functionDeclarations: tools.map(({ name, description, parameters }) => ({ name, description, parameters })) }] } : {}),
      };
      let response;
      try {
        response = await fetch(`${GEMINI_URL}/${id}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify(body),
        });
      } catch {
        throw new ModelError("Could not reach Gemini.");
      }
      if (!response.ok || !response.body) throw await geminiFailure(response);
      let text = "";
      const toolCalls = [];
      const usage = { in: 0, out: 0 };
      for await (const chunk of sseData(response.body)) {
        if (chunk.error) throw new ModelError(`Gemini stopped: ${chunk.error.status ?? "error"}.`);
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.thought) continue;
          if (typeof part.text === "string" && part.text) {
            text += part.text;
            onText(part.text);
          }
          if (part.functionCall) {
            toolCalls.push({ id: `call_${toolCalls.length}`, name: part.functionCall.name, args: part.functionCall.args ?? {},
              signature: part.thoughtSignature });
          }
        }
        if (chunk.usageMetadata) {
          usage.in = chunk.usageMetadata.promptTokenCount ?? usage.in;
          usage.out = chunk.usageMetadata.candidatesTokenCount ?? usage.out;
        }
      }
      return { text, toolCalls, usage };
    },
  };
}

function workersAiMessages(system, messages) {
  const out = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "user") out.push({ role: "user", content: m.text });
    else if (m.role === "tool") {
      for (const r of m.results) out.push({ role: "tool", name: r.name, tool_call_id: r.id, content: JSON.stringify(r.result) });
    } else {
      out.push({ role: "assistant", content: m.text || "",
        ...(m.toolCalls?.length ? { tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: JSON.stringify(c.args) } })) } : {}) });
    }
  }
  return out;
}

/** A function call the model wrote as its reply body ({ type: "function", function: { name, parameters } }),
 * which Llama on Workers AI sometimes does instead of filling tool_calls; null when it is prose. */
function callInBody(body) {
  let value = body;
  if (typeof body === "string") {
    if (!/^\s*\{[\s\S]*"name"[\s\S]*\}\s*$/.test(body)) return null;
    try { value = JSON.parse(body); } catch { return null; }
  }
  const fn = value?.function ?? value;
  return fn && typeof fn === "object" && typeof fn.name === "string" ? { name: fn.name, arguments: fn.parameters ?? fn.arguments ?? {} } : null;
}

/** Text and tool calls from a Workers AI result, in any of the shapes it returns. */
function workersAiReply(result) {
  const message = result?.choices?.[0]?.message;
  const listed = result?.tool_calls?.length ? result.tool_calls : message?.tool_calls ?? [];
  const body = result?.response ?? message?.content ?? "";
  const inBody = listed.length ? null : callInBody(body);
  return { text: inBody || typeof body !== "string" ? "" : body, calls: workersAiCalls(inBody ? [inBody] : listed) };
}

/** Workers AI returns tool calls either flat ({ name, arguments }) or OpenAI-style. */
function workersAiCalls(raw = []) {
  return raw.map((call, i) => {
    const fn = call.function ?? call;
    let args = fn.arguments ?? fn.parameters ?? {};
    if (typeof args === "string") {
      try { args = JSON.parse(args); } catch { args = {}; }
    }
    return { id: call.id ?? `call_${i}`, name: fn.name, args };
  });
}

export function workersAiModel(env, id = MODELS.fallback) {
  return {
    provider: "workers-ai",
    id,
    async chat({ system, messages, tools = [], onText = () => {} }) {
      if (!env.AI) throw new ModelError("The Workers AI fallback is not bound (AI).");
      let result;
      try {
        result = await env.AI.run(id, {
          messages: workersAiMessages(system, messages),
          max_tokens: MAX_OUTPUT_TOKENS,
          ...(tools.length ? { tools: tools.map(({ name, description, parameters }) => ({ type: "function", function: { name, description, parameters } })) } : {}),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/429|rate|capacity|limit/i.test(message)) throw new ModelBusy("Workers AI is over its limit.");
        console.error("assistant: workers ai error", message);
        throw new ModelError("The fallback model failed.");
      }
      const { text, calls } = workersAiReply(result);
      if (text) onText(text);
      return { text, toolCalls: calls, usage: { in: result?.usage?.prompt_tokens ?? 0, out: result?.usage?.completion_tokens ?? 0 } };
    },
  };
}
