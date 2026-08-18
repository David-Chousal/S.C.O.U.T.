/* S.C.O.U.T. chat proxy — a Cloudflare Worker.
 *
 * Why this exists: the public site is static (GitHub Pages) and must never ship the Groq API
 * key. This Worker is the only place the key lives (as a Cloudflare secret). The site POSTs a
 * short conversation here; the Worker injects the project knowledge (fetched from the published
 * chat-context.txt), calls Groq, and returns the reply. See chatbot/README.md to deploy.
 *
 * Config (wrangler.toml [vars], except the secret):
 *   GROQ_API_KEY  — secret, set with `wrangler secret put GROQ_API_KEY` (NEVER commit it)
 *   CONTEXT_URL   — URL of the published chat-context.txt (the Hub + core docs)
 *   ALLOWED_ORIGIN— the site origin allowed to call this Worker (CORS)
 *   MODEL         — Groq model id (default openai/gpt-oss-120b)
 */

const SYSTEM_PROMPT = [
  "You are Fred, the assistant for S.C.O.U.T. (Santa Clara Oceanic Utilities Transmitter), a",
  "solar-powered nearshore reef-monitoring buoy built as a Santa Clara University senior",
  "design capstone. Answer questions about the project: the research, the science, the",
  "hardware and software, the team, and the plan.",
  "",
  "Rules:",
  "- Your name is Fred. If asked who you are, say you're Fred, the S.C.O.U.T. project assistant.",
  "- Answer ONLY from the KNOWLEDGE below. It is the project's current source of truth.",
  "- If the answer isn't in the knowledge, say you don't have that detail and suggest the",
  "  docs or GitHub repo — do not invent facts, numbers, dates, or part numbers.",
  "- Be concise and specific. Prefer 1–4 short sentences. Use plain language.",
  "- When a fact is contested or unresolved in the knowledge, say so rather than guessing.",
].join("\n");

// Light in-isolate cache for the knowledge context.
let _ctx = null;
let _ctxAt = 0;
const CTX_TTL_MS = 10 * 60 * 1000;

async function getContext(env) {
  const now = Date.now();
  if (_ctx && now - _ctxAt < CTX_TTL_MS) return _ctx;
  try {
    const r = await fetch(env.CONTEXT_URL, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) {
      _ctx = await r.text();
      _ctxAt = now;
    }
  } catch (e) {
    /* fall through to whatever we last had */
  }
  return _ctx || "(project knowledge is temporarily unavailable)";
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    if (!env.GROQ_API_KEY) return json({ error: "server not configured" }, 500, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid JSON" }, 400, cors); }

    const raw = Array.isArray(body.messages) ? body.messages : null;
    if (!raw || !raw.length) return json({ error: "messages required" }, 400, cors);

    // Keep only the last few turns; cap each message so a client can't blow up the prompt.
    const messages = raw.slice(-8).map((m) => ({
      role: m && m.role === "assistant" ? "assistant" : "user",
      content: String((m && m.content) || "").slice(0, 2000),
    }));

    const context = await getContext(env);
    const system = SYSTEM_PROMPT + "\n\n=== KNOWLEDGE ===\n" + context;

    let groqRes;
    try {
      groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.MODEL || "openai/gpt-oss-120b",
          temperature: 0.2,
          // Groq counts max_tokens toward the per-minute budget, so this is a rate-limit
          // knob as much as a length one. 400 still covers the 1-4 sentence replies the
          // system prompt asks for. Raise it if the account moves off the free tier.
          max_tokens: 400,
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
    } catch (e) {
      return json({ error: "could not reach the model" }, 502, cors);
    }

    if (!groqRes.ok) {
      const detail = (await groqRes.text().catch(() => "")).slice(0, 300);
      // Map the upstream failure to a status that says what actually broke. Returning 502 for
      // everything once hid a decommissioned model id behind a generic "bad gateway" — a 4xx
      // from Groq means *our* request or config is wrong, which is not an upstream outage.
      const status =
        groqRes.status === 429
          ? 429 // rate / token limit — the caller should back off and retry
          : groqRes.status >= 400 && groqRes.status < 500
            ? 500 // bad model id, bad key, malformed request — our side
            : 502; // genuine upstream failure
      return json({ error: "model error", detail, upstream: groqRes.status }, status, cors);
    }

    const data = await groqRes.json();
    const reply =
      (data && data.choices && data.choices[0] && data.choices[0].message &&
        data.choices[0].message.content) ||
      "Sorry, I couldn't produce an answer.";
    return json({ reply }, 200, cors);
  },
};
