# ADR-0013 — Fred, the Console Assistant, on Gemini's Free Tier

- **Status:** 🟡 Open — four of five decisions made 2026-11-05; decision 2 (is the free tier's
  data use acceptable) waits on the advisors. Built on branch `console/fred-assistant`, not
  deployed.
- **Date raised:** 2026-11-05 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-299](https://linear.app/scout1/issue/SCO-299)
- **Builds on:** [ADR-0012](0012-authenticated-console.md) (the console, its roles and audit log)

> **Summary** — Fred is an AI assistant inside the team console (`console.scoutscu.com`). It
> answers questions about the console, the project and the live fleet, and proposes changes
> (buoy settings, renames, reports, station routes) that run only when the person clicks
> Confirm. It runs in the console Worker on the **free tier of Google's Gemini API**, falls back
> to Cloudflare Workers AI when Gemini is busy, stores no conversation, and acts as the person
> asking, never above them. This record began as the plan drafted on 2026-11-05.

---

## Context

David wants an assistant in the console that knows the project and the live fleet and can help
run it: explain a page, find why a buoy is Pending, change a setting. The project has no budget
line for an AI service, and the console runs on Cloudflare's free tier (ADR-0012).

## Options

Three free routes were weighed on 2026-11-05:

| Option | For | Against |
|---|---|---|
| **A. Gemini API, free tier** (chosen) | Free with a Google account, no card. Strong enough for tool calling and multi-step diagnosis; very large context window | Low per-minute and per-day request limits that Google changes without notice; free-tier prompts and replies may be used to improve Google's products and read by human reviewers |
| B. Cloudflare Workers AI, free tier | Already on our platform, no key at all | Open models noticeably weaker at chaining tools and at saying "I don't know"; smaller context |
| C. Anthropic API (Claude) | Strongest at tool use | No free tier; a Claude Pro subscription does not include API access |

Gemini wins on capability for zero cost. Its weaknesses shape the design: the **rate limits**
(caps and a fallback) and the **data terms** (what is never sent, and a standing notice).

## Decision

1. **Gemini's free tier, behind one interface.** `console/worker/assistant/model.js` exposes
   `chat({ system, messages, tools, onText })` over plain `fetch` (no SDK), with streaming and
   function calling. Model IDs live in one constant, checked against Google's model and pricing
   pages on 2026-11-05: **`gemini-3.8-flash`** for questions (free tier; Google's recommended
   Flash for new projects) and **`gemini-3.5-flash-lite`** for the morning brief. Workers AI
   (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) is a second implementation of the same function.
   Moving to a paid key or another provider is a change to that one file.
2. **🟡 Open: is the free tier's data use acceptable?** The working answer is yes for project
   data (readings, settings and station names are not sensitive and much is public on the
   project site), with the panel notice below. It needs a word with the advisors, since the
   console is a university project. Built as if accepted.
3. **The key is on David's own Google account** (decided 2026-11-05). It lives only as the Worker
   secret `GEMINI_API_KEY` (locally in the gitignored `console/.dev.vars`). At handover, whoever
   keeps the console makes a key on their own account and replaces the secret; David then
   deletes his. **The key's Google project must not have billing enabled**: on 2026-11-05 the
   key first supplied belonged to a project on prepaid billing with no credit left, and Google
   refused every model ("prepayment credits are depleted") rather than serving the free tier.
4. **Guests can use Fred, read-only** (decided 2026-11-05), with a lower daily cap. They are
   never offered propose tools, and the confirm endpoint refuses them regardless.
5. **Conversations are not kept** (decided 2026-11-05). A conversation lives only in the open
   panel; the browser sends it back with each question and it is gone when the tab closes. D1
   holds only pending confirm cards (deleted when confirmed, declined or 10 minutes old) and
   per-person daily counts. A "Report this answer" key copies one exchange to the clipboard
   for a Linear issue, since a wrong answer cannot be looked up afterwards.
6. **Named Fred, with all six propose tools** (decided 2026-11-05), the two admin ones included.
7. **Fred acts as the person, never above them.** Tools run the same functions the pages use.
   Propose tools are not offered to a role that could not run them, and confirm re-checks
   `can()`. Every confirmed change is audited as `<email> via Fred`.
8. **Writes are two-step.** A propose tool validates with the page's own checks (a set the buoy
   would refuse never becomes a card), stores a pending action for 10 minutes and returns a card.
   Only `POST /api/assistant/confirm` runs it, once.
9. **The morning brief is facts first.** The daily cron works out the facts in code (silent or
   late buoys, rejected or stuck settings, quiet shore stations, storage near budget) and only
   Gemini Flash-Lite phrases them; without Gemini the facts are stored as they are. **Workers AI
   does not write the brief** (decided while building, 2026-11-05): in local testing it padded
   the facts with lines the data did not support.
10. **Daily caps come from Worker vars**, since Google changes the free limits without notice:
    `ASSISTANT_DAILY_CAP` (members and admins, 40) and `ASSISTANT_DAILY_CAP_GUEST` (10).

## Design

```
browser ── POST /api/assistant (session + CSRF) ──► Worker
   ▲  streamed reply (SSE)                           │ 1. load the user and their role
   │                                                 │ 2. system instruction + knowledge pack
   │  confirm card ──► POST /api/assistant/confirm   │ 3. function-calling loop (max 8 model calls)
   │                     │                           │      read tools → existing D1 queries
   │                     ▼                           │      propose tools → a pending action row
   │           runs the existing handler as the user │ 4. count the question and the model calls
   │           (same can() check, audited)           ▼
   └──────────────────────────────────────── Gemini API (free tier) · Workers AI (fallback)
```

- **Routes** (behind the console session and CSRF token, not part of the public `/api/v1`):
  `GET /api/assistant/status`, `GET /api/assistant/brief`, `POST /api/assistant` (SSE events
  `text`, `tool`, `action`, `notice`, `reset`, `done`, `error`), `POST /api/assistant/confirm`,
  `POST /api/assistant/decline`.
- **Knowledge.** Three layers. In every system instruction (about 6k tokens): the Help page's
  text, the remote-settings registry and the rows of [`facts.md`](../hub/facts.md). Searchable
  with `search_docs`: every tracked `docs/**.md`, the README and the console README, split by
  heading, ranked by keyword (no vector database). Live: the read tools. All of it is built by
  `console/scripts/build_assistant_knowledge.py` into a generated, uncommitted
  `knowledge.json`, which `npm test`, `npm run dev` and the deploy workflow build first, so Fred
  is as current as `main`. Notion is not a source (frozen since 2026-10-23).
- **Read tools** (every role; `get_storage` admins only): `list_buoys`, `get_buoy`,
  `get_readings` (at most 200 points with min/max/mean), `list_stations`, `list_reports`,
  `list_dashboards`, `get_audit` (emails replaced by names), `get_storage`, `search_docs`,
  `link_to`.
- **Propose tools** (members and up; the last two admins only): `propose_settings` (card shows
  new send times and the battery effect), `propose_restore_defaults`, `propose_rename_buoy`,
  `propose_report`, `propose_station_route`, `propose_revoke_station` (deleting stays manual).
- **Limits and fallback.** A Gemini rate-limit error is retried once after a short back-off; if it
  is still busy, or there is no key, Workers AI answers that question with **propose tools
  off**, is told it cannot draft changes, and the panel says a smaller model answered. If both
  are out, Fred says it is over today's limit. Admins see the day's questions, model calls,
  fallbacks and tokens on Settings → Buoys → File storage; check it before a demo.
- **The panel.** Ask Fred in the top bar (or A, with shortcuts on) opens a panel on the right, a
  full-screen sheet on phones. Fred is told the page, tab and buoy in view. Replies render a
  safe Markdown subset as React elements (never HTML), console paths become in-app links and
  cited repo files link to GitHub. Under the input, always: *"Fred uses Google Gemini's free
  tier. Google may review what you type. Don't share personal information."*

## Data and privacy

- **Never sent to a model:** passwords, token values or hashes, invite and reset links, email
  addresses. The system instruction names the person by name and role only; `get_audit` and
  `get_buoy` replace emails with names.
- **Stored in D1:** `assistant_actions` and `assistant_usage` (migration 0011), and
  `assistant_briefs` (0012). No question or reply. Pending actions are left out of the nightly
  backup, like sessions.
- **Prompt injection:** buoy labels, station names and report text are typed by people. Tool
  results are passed as function responses, the system instruction says they are data, and the
  confirm step means injected text can at most produce a card the person declines. The eval
  set includes an injection in a buoy label and in the question.

## Consequences

- One more outside service. If Google ends or shrinks the free tier, the fallback keeps Fred
  answering (weaker, no changes) and the interface makes a switch one file.
- **The fallback is noticeably weaker.** In local testing (2026-11-05) Llama on Workers AI
  sometimes wrote its tool call as reply text (now handled), invented a tool name (refused), and
  once answered "which buoys missed a transmission" from the settings state instead of the
  health state. It is a stop-gap, never a source of changes or of the brief.
- **Tests:** Worker tests stub Gemini's REST endpoint and the Workers AI binding (every tool,
  role gating, confirm expiry, ownership and audit, caps, the fallback, the brief). Web tests
  cover the panel, cards and brief. The eval set (`console/test/assistant-evals.json`, 41
  questions) is run by hand against the real model with
  `node scripts/run-assistant-evals.mjs`; **it has not been scored yet**, because the first key
  was refused (decision 3).

## References

- Gemini API models, pricing (free tier per model) and rate limits —
  <https://ai.google.dev/gemini-api/docs/models>, <https://ai.google.dev/gemini-api/docs/pricing>,
  <https://ai.google.dev/gemini-api/docs/rate-limits> (read 2026-11-05)
- Gemini API additional terms (free-tier data use) — <https://ai.google.dev/gemini-api/terms>
- Workers AI function calling — <https://developers.cloudflare.com/workers-ai/features/function-calling/>
- [ADR-0012](0012-authenticated-console.md) · [`console/README.md`](../../console/README.md#fred-the-assistant)
