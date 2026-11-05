# Console Assistant Plan

> **Summary** — A plan for **Fred**, an AI assistant in the team console
> (`console.scoutscu.com`), built on the **free tier of Google's Gemini API**. Fred answers
> questions about the project and the live fleet, and helps run the console: it proposes
> changes such as buoy settings, renames, station assignments and reports, and nothing changes
> until the person clicks Confirm. Drafted 2026-11-05
> ([SCO-299](https://linear.app/scout1/issue/SCO-299)). **Not adopted and not built.** It
> becomes ADR-0013 once the decisions at the end are made. The top bar already has a disabled
> "Ask Fred" slot for it.

---

## Why Gemini's free tier

The project has no budget line for an AI service. Three free routes were weighed on 2026-11-05:

| Option | For | Against |
|---|---|---|
| **Gemini API, free tier** (chosen) | Free with a Google account, no card. Strong enough for tool calling and multi-step diagnosis; very large context window | Low per-minute and per-day request limits that Google changes without notice; free-tier prompts and replies may be used to improve Google's products and read by human reviewers |
| Cloudflare Workers AI, free tier | Already on our platform, no key at all | Open models noticeably weaker at chaining tools and at saying "I don't know"; smaller context |
| Anthropic API (Claude) | Strongest at tool use | No free tier; a Claude Pro subscription does not include API access |

Gemini wins on capability for zero cost. Its two weaknesses shape the plan: the **rate
limits** (see [Limits and fallback](#limits-and-fallback)) and the **data terms** (see
[Data and privacy](#data-and-privacy)). The model sits behind one small interface, so moving to
Workers AI or a paid key later is a one-file change.

## What Fred should do

| Ask | Example | How Fred answers |
|---|---|---|
| **Explain the console** | "What does Pending mean on Settings?" | From the console's own Help content and the settings registry |
| **Explain the project** | "Why can't we send audio over LoRa?" | From the repo docs (ADRs, EDD, `facts.md`), citing the file it used |
| **Read the live system** | "Which buoys missed a transmission today?" · "What was Reef north's water temperature overnight?" | Calls read tools against the same D1 data the pages show |
| **Diagnose** | "Why is buoy 2 still Pending?" | Combines the two: its digest, last packet version, station routing and the firmware rules |
| **Manage, with confirmation** | "Drop buoy 1 to two transmits a day" · "Assign buoy 3 to the Hawaii station" | Builds the change, shows a confirm card with the effect (send times, battery life), and runs it only on Confirm |
| **Navigate** | "Take me to the audit log" | Links into the console, including `?tab=` deep links |
| **Brief** (later) | A morning note: silent buoys, rejected settings, storage | Runs on the existing daily cron |

**What Fred never does:** reveal or create secrets (API tokens, station tokens, invite links,
reset links), change roles, disable accounts, delete anything, or act without the person's
click. Anything the person's role cannot do, Fred cannot do for them.

## Architecture

```
browser ── POST /api/assistant (session + CSRF) ──► Worker
   ▲  streamed reply (SSE)                           │ 1. load the user and their role
   │                                                 │ 2. system prompt + knowledge pack
   │  confirm card ──► POST /api/assistant/confirm   │ 3. Gemini function-calling loop (max 8 turns)
   │                     │                           │      read tools → existing D1 queries
   │                     ▼                           │      propose tools → a pending action row
   │           runs the existing handler as the user │ 4. store the turn, count the requests
   │           (same can() check, audited)           ▼
   └──────────────────────────────────────── Gemini API (free tier)
```

- **Runs in the existing Worker.** No new service: a new `worker/assistant/` folder, a new
  `/api/assistant` route behind the same session and CSRF checks as `/api/*`, and the Gemini
  key as a Worker secret (`GEMINI_API_KEY`, set with `wrangler secret put`, never in
  `wrangler.toml` or the repo).
- **Calls Gemini over plain `fetch`** to its REST endpoint, with streaming and function
  calling. No SDK, so the Worker bundle stays small.
- **Model:** the strongest Gemini **Flash** model offered on the free tier for everything; a
  lighter Flash-Lite model, if it has its own allowance, for the morning brief and conversation
  titles. Both IDs live in one constant (`worker/assistant/model.js`), because Google retires
  and renames models often.
- **One interface for the model.** `model.js` exposes `chat(messages, tools)` and returns text
  and tool calls in our own shape. Gemini's request format stays inside it, so the fallback
  (Workers AI) or a paid provider is a second implementation of the same function.
- **Fred acts as the person, never above them.** Every tool runs through the same functions
  the pages use, with the person's session. A guest gets read tools only; propose tools are
  not offered to the model at all for a role that could not run them, and the confirm
  endpoint re-checks `can()` regardless.
- **Writes are two-step.** A propose tool validates the change (the same checks the Settings
  page runs, so a set the buoy would refuse never becomes a card), stores a pending action
  for 10 minutes, and returns a summary. The UI shows it as a card; Confirm calls
  `/api/assistant/confirm`, which runs the real handler. The audit log records it with
  "via Fred", so it is clear who asked and how.
- **Streaming:** the Worker streams the reply to the browser as server-sent events, with a
  line per tool call ("Looked at Fleet", "Read buoy 1's readings").

## What Fred knows

The repo's Markdown is about 2 MB, roughly half a million tokens. Gemini's context could hold
much of it, but the free tier also limits **tokens per minute**, so sending it all with every
question would exhaust the allowance in a few questions. Knowledge comes in three layers:

| Layer | Contents | How it reaches the model |
|---|---|---|
| **Always in the prompt** (kept under ~15k tokens) | What the console is, its pages and roles, the Help content, the remote-settings registry (`buoy-config.json`), the canonical values in [`facts.md`](../hub/facts.md), the rules Fred follows | System instruction on every request |
| **Searchable** | Every `docs/**.md`, the console README, ADRs, the decision log | A `search_docs` tool over a chunk index built at deploy time (keyword ranking in the Worker; no vector database). Returns passages with their file path so Fred can cite them |
| **Live** | Fleet, readings, settings, stations, reports, dashboards, audit log, storage | Read tools (below) |

A script, `console/scripts/build_assistant_knowledge.py`, builds the knowledge pack and the
chunk index from the repo during the deploy workflow, so Fred is always as current as `main`.
Notion is not a source: it is frozen since 2026-10-23.

## Tools

Declared to Gemini as function declarations. **Read** (every role):

| Tool | Returns | Backed by |
|---|---|---|
| `list_buoys` | Each buoy: label, health, last heard, next transmit, battery estimate, settings state | `fleet.js`, `buoy-status` logic |
| `get_buoy` | One buoy in full: wanted vs reported digest, requested settings, station route | `buoy-settings.js`, `fleet.js` |
| `get_readings` | A buoy's readings over a window, downsampled to at most 200 points, with min/max/mean | `readings.js` |
| `list_stations` | Stations, their buoys, last seen, orphaned buoys | `device.js` |
| `list_reports` · `list_dashboards` | Names, owners, dates | `reports.js`, `dashboards.js` |
| `get_audit` | Recent audit entries, filterable by action or target | `audit.js` |
| `get_storage` (admin) | D1 and R2 use against the budget | `storage.js` |
| `search_docs` | Passages from the repo docs, with file paths | the chunk index |
| `link_to` | A console URL for a page, tab or buoy | `nav.ts` routes |

**Propose** (member and up; each becomes a confirm card):

| Tool | Change | Role |
|---|---|---|
| `propose_settings` | Any of the eight remote settings for a buoy (card shows new send times and the battery effect of a count change) | member |
| `propose_restore_defaults` | A buoy back to firmware defaults | member |
| `propose_rename_buoy` | A buoy's console name | member |
| `propose_report` | Create a report from a description | member |
| `propose_station_route` | Which station commands a buoy | admin |
| `propose_revoke_station` | Revoke a shore-station token (deleting stays manual) | admin |

Anything not in these tables is out of scope until added here.

## The panel

- **Ask Fred** in the top bar opens a panel on the right (a full-screen sheet on phones), on
  every page. A keyboard shortcut opens it when shortcuts are on.
- Fred is told which page and tab the person is on and which buoy is in view, so "why is this
  one late?" works.
- Replies render Markdown, with links into the console and citations to repo files.
  Confirm cards use the existing card and `Key` components; a pending card expires visibly.
- A standing line under the input: *"Fred uses Google Gemini's free tier. Google may review
  what you type. Don't share personal information."*
- **Conversations are not kept** (decided 2026-11-05). The conversation lives only in the open
  panel; the browser sends it back with each question and it is gone when the tab closes.
  There is no history list. A "New conversation" key clears it.

## Data and privacy

**The free-tier terms are the main trade-off.** Google may use free-tier prompts and replies to
improve its products, and human reviewers may read them. For S.C.O.U.T. that is acceptable for
project data: buoy readings, settings and station names are not sensitive, and much of the data
is public on the project site already. It is not acceptable for personal or secret data, so:

- **Never sent:** passwords, token values or hashes, invite and reset links, anyone's email
  address. The team tool returns names and roles only; the audit tool strips emails to names.
- **Warned about:** what people type. The panel notice above says so on every conversation,
  including for guests outside the team.
- **Stored in D1** (migration `0011-assistant.sql`): only `assistant_actions` (pending
  proposals, deleted when confirmed, declined or 10 minutes old) and `assistant_usage`
  (request and token counts per user per day, no text). **No question or reply is stored.**
  A confirmed change still lands in the audit log, as every change does.
- **Prompt injection:** buoy labels, station names and report text are typed by people and
  could carry instructions. Tool results are passed as data, the system instruction says so,
  and the confirm step means injected text can at most produce a card the person declines.
- **Account:** the key is created in Google AI Studio on **David's own Google account**
  (decided 2026-11-05). It lives only as the Worker secret. At the capstone handover, whoever
  keeps the console creates a key on their own account and replaces the secret; David then
  deletes his key.

## Limits and fallback

The free tier's real constraint is **requests per minute and per day**, shared by everyone
using the console. Google publishes the current numbers in AI Studio and has changed them
several times, so the console reads them from Worker vars rather than hard-coding them.

- **Per-person fair share:** a daily question cap per person (guests lower), so one person
  cannot spend the team's allowance.
- **Each question is several requests:** every tool round trip is one model call, so the loop
  is capped at 8 turns and read tools return compact, downsampled results.
- **When Gemini refuses with a rate-limit error:** back off once, then fall back to Workers AI
  (free, already on Cloudflare, an `[ai]` binding) for that question, and say so in the reply
  ("Gemini is busy; answered with a smaller model"). Propose tools stay off on the fallback,
  so a weaker model never drafts a change.
- **When both are out:** Fred says it is over today's limit; the panel and history stay readable.
- **Before a demo** (CDR, open house, Hawaii briefings): check the day's usage on
  Developer → Storage, where assistant usage shows beside D1 and R2.
- **If the free tier stops being enough:** the same interface takes a paid Gemini key or an
  Anthropic key; that is a budget decision, not a rebuild.

## Testing

- **Worker tests** (node:test, the D1 shim) with the model interface stubbed: each tool returns
  the right data; a guest is never offered a propose tool; confirm re-checks the role, refuses
  an expired or someone else's action, and writes the audit row; caps refuse cleanly; a
  rate-limit error falls back to Workers AI with propose tools off.
- **Web tests** (vitest): the panel streams, shows the notice, renders a confirm card, and
  handles a refusal.
- **Eval set:** about 40 questions with the expected tool calls and facts
  (`console/test/assistant-evals.json`), run by hand against the real Gemini model before each
  prompt or model change, scored and recorded. It includes injection attempts in buoy labels
  and requests Fred must refuse. Run it again whenever Google changes the free model.

## Phases

| Phase | Delivers | Exit |
|---|---|---|
| **0 — Decide** | The decisions below; ADR-0013; a Gemini key from AI Studio as a Worker secret | ADR accepted |
| **1 — Ask** | Panel, streaming, knowledge pack, `search_docs`, every read tool, usage logging, the Workers AI fallback | Fred answers the eval set's read questions correctly; guests and members use it for a week within the free limits |
| **2 — Act** | Propose tools, confirm cards, "via Fred" audit entries | Every propose tool tested end to end; no write without Confirm |
| **3 — Brief** | Morning brief on the daily cron, shown on the Dashboard | Runs for a week with no false alarms |

Phase 1 is a few days of work, Phase 2 about as much again; neither touches the firmware or
the shore station.

## Decisions needed before building

1. ~~**Which Google account holds the key?**~~ **Decided 2026-11-05: David's own Google
   account**, replaced at handover (see [Data and privacy](#data-and-privacy)).
2. **Is the free tier's data use acceptable?** The plan says yes for project data, with the
   notice in the panel. Worth a word with the advisors, since the console is a university
   project.
3. ~~**Can guests use Fred?**~~ **Decided 2026-11-05: yes, read-only**, with a lower daily
   cap than members. Guests are never offered propose tools, and the confirm endpoint refuses
   them regardless.
4. ~~**Keep conversations 30 days, or not at all?**~~ **Decided 2026-11-05: not at all.** The
   cost is that a wrong answer cannot be looked up afterwards, so the eval set carries the
   debugging, and a "Report this answer" key copies that one exchange to the clipboard for the
   person to paste into a Linear issue.
5. ~~**Is "Fred" the name, and which writes are in Phase 2?**~~ **Decided 2026-11-05: "Fred",
   and all six propose tools in the table above**, the two admin ones included.

## Risks

- **Free limits hit at the worst moment** (a demo). Mitigated by per-person caps, the Workers AI
  fallback and checking usage beforehand.
- **Google changes the free tier** (limits, models, or ends it). The interface makes a switch
  one file; the eval set shows whether the new model is good enough.
- **Wrong answers stated confidently.** Mitigated by citing files and tool results, and by the
  eval set. Fred should say when it does not know.
- **A change nobody meant.** Every write needs a click on a card that states the effect.
- **Stale knowledge.** The pack is rebuilt on every deploy from `main`; live data always comes
  from tools, never from the pack.
