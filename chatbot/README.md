# S.C.O.U.T. chat proxy

A tiny [Cloudflare Worker](https://developers.cloudflare.com/workers/) that powers the "Ask
S.C.O.U.T." chat widget on the site. It is the **only** place the Groq API key lives — the
static site never sees it.

```
browser (chat widget)  ──POST──►  this Worker  ──►  Groq API
                                       │
                                       └── fetches chat-context.txt (the Hub + core docs)
                                           from the published site, injected as the system prompt
```

The knowledge is the published `chat-context.txt`, regenerated on every site publish, so the bot
stays current without redeploying the Worker.

## Deploy (one-time)

Requires a free Cloudflare account.

```bash
npm install -g wrangler          # or: npx wrangler ...
cd chatbot
wrangler login                   # opens a browser to authorize
wrangler secret put GROQ_API_KEY # paste the Groq key when prompted (NEVER commit it)
wrangler deploy
```

`wrangler deploy` prints the Worker URL, e.g. `https://scout-chat.<your-subdomain>.workers.dev`.

## Wire it to the site

Set that URL in **`analytics/telemetry/site/layout.py`** → `CHAT_ENDPOINT`, then rebuild/redeploy
the site. (The site ships with a placeholder endpoint; until it points at your Worker, the widget
shows a "not configured yet" note instead of calling anything.)

If you use a custom site domain, also update `ALLOWED_ORIGIN` (and `CONTEXT_URL`) in
`wrangler.toml` and `wrangler deploy` again.

## Security

- The Groq key is a Cloudflare **secret** (`wrangler secret put`), never in this repo or in the
  browser. `wrangler.toml` holds only non-secret config.
- **Rotate the key** in the Groq console if it was ever shared in plaintext (chat, email, a paste).
- The Worker only accepts POSTs from `ALLOWED_ORIGIN`, caps message length and history, and asks
  the model to answer only from the provided knowledge.

## Config (wrangler.toml `[vars]`)

| Var | Meaning |
|---|---|
| `CONTEXT_URL` | URL of the published `chat-context.txt` |
| `ALLOWED_ORIGIN` | Site origin allowed to call the Worker (CORS) |
| `MODEL` | Groq model id (default `openai/gpt-oss-120b`) |
| `GROQ_API_KEY` | **secret** — set via `wrangler secret put`, not here |
