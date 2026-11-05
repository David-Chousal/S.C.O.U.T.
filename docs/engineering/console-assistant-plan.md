# Console Assistant Plan

> **Summary** — A plan for **Fred**, an AI assistant in the team console
> (`console.scoutscu.com`). Fred answers questions about the project and the live fleet, and
> helps run the console: it proposes changes such as buoy settings, renames, station
> assignments and reports, and nothing changes until the person clicks Confirm. Drafted
> 2026-11-05 ([SCO-299](https://linear.app/scout1/issue/SCO-299)). **Not adopted and not built.** It becomes ADR-0013 once the decisions at the end
> are made. The top bar already has a disabled "Ask Fred" slot for it.

---

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
   │                                                 │ 2. system prompt + knowledge pack (cached)
   │  confirm card ──► POST /api/assistant/confirm   │ 3. Claude tool-use loop (max 8 turns)
   │                     │                           │      read tools → existing D1 queries
   │                     ▼                           │      propose tools → a pending action row
   │           runs the existing handler as the user │ 4. store the turn, count the tokens
   │           (same can() check, audited)           ▼
   └──────────────────────────────────────── Anthropic Messages API
```

- **Runs in the existing Worker.** No new service: a new `worker/assistant/` folder, a new
  `/api/assistant` route behind the same session and CSRF checks as `/api/*`, and the
  Anthropic key as a Worker secret (`ANTHROPIC_API_KEY`, set with `wrangler secret put`, never
  in `wrangler.toml`).
- **Model:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) by default; Haiku 5.5
  (`claude-haiku-5-5`) for the morning brief and for titling conversations. The model ID lives
  in one constant so it can change without touching anything else.
- **Fred acts as the person, never above them.** Every tool runs through the same functions
  the pages use, with the person's session. A guest gets read tools only; propose tools are
  not offered to the model at all for a role that could not run them, and the confirm
  endpoint re-checks `can()` regardless.
- **Writes are two-step.** A propose tool validates the change (the same checks the Settings
  page runs, so a set the buoy would refuse never becomes a card), stores a pending action
  for 10 minutes, and returns a summary. The UI shows it as a card; Confirm calls
  `/api/assistant/confirm`, which runs the real handler. The audit log records it with
  "via Fred", so it is clear who asked and how.
- **Streaming:** the Worker streams the model's reply to the browser as server-sent events,
  with a line per tool call ("Looked at Fleet", "Read buoy 1's readings").

## What Fred knows

The repo's Markdown is about 2 MB, roughly half a million tokens, too much to send with every
question. Knowledge comes in three layers:

| Layer | Contents | How it reaches the model |
|---|---|---|
| **Always in the prompt** (~15k tokens) | What the console is, its pages and roles, the Help content, the remote-settings registry (`buoy-config.json`), the canonical values in [`facts.md`](../hub/facts.md), the rules Fred follows | System prompt, prompt-cached so repeat questions are cheap |
| **Searchable** | Every `docs/**.md`, the console README, ADRs, the decision log | A `search_docs` tool over a chunk index built at deploy time (keyword ranking in the Worker; no vector database to start). Returns passages with their file path so Fred can cite them |
| **Live** | Fleet, readings, settings, stations, reports, dashboards, audit log, storage | Read tools (below) |

A script, `console/scripts/build_assistant_knowledge.py`, builds the knowledge pack and the
chunk index from the repo during the deploy workflow, so Fred is always as current as `main`.
Notion is not a source: it is frozen since 2026-10-23.

## Tools

**Read** (every role):

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
- Conversations are listed in the panel and kept 30 days, then deleted by the daily cron.
- Settings → Account gets a line explaining what Fred sends to Anthropic.

## Data and privacy

- **Sent to Anthropic:** the question, the page context, tool results (buoy data, readings,
  station names, report names) and doc passages. **Not sent:** passwords, token values or
  hashes, invite and reset links, other people's emails (the team tool returns names and
  roles only).
- **Stored in D1** (migration `0011-assistant.sql`): `assistant_conversations`,
  `assistant_messages` (text and tool calls, 30-day retention), `assistant_actions` (pending
  proposals) and `assistant_usage` (tokens per user per day).
- **Prompt injection:** buoy labels, station names and report text are typed by people and
  could carry instructions. Tool results are passed as data, the system prompt says so, and
  the confirm step means injected text can at most produce a card the person declines.

## Cost and limits

- A daily token cap per person and a monthly cap for the whole console, both Worker vars.
  Over the cap, Fred says so and the panel stays readable.
- Rate limit: 20 questions per person per hour, guests 5.
- Prompt caching on the system prompt and knowledge pack; readings downsampled before they
  reach the model.
- Usage shows on Developer → Storage beside D1 and R2.
- Real numbers come from Phase 1: log tokens per question for a week before fixing the caps.

## Testing

- **Worker tests** (node:test, the D1 shim) with the Anthropic client stubbed: each tool
  returns the right data; a guest is never offered a propose tool; confirm re-checks the role,
  refuses an expired or someone else's action, and writes the audit row; caps and rate limits
  refuse cleanly.
- **Web tests** (vitest): the panel streams, renders a confirm card, and handles a refusal.
- **Eval set:** about 40 questions with the expected tool calls and facts
  (`console/test/assistant-evals.json`), run by hand against the real model before each
  prompt or model change, scored and recorded. It includes injection attempts in buoy labels
  and requests Fred must refuse.

## Phases

| Phase | Delivers | Exit |
|---|---|---|
| **0 — Decide** | The decisions below; ADR-0013; the API key as a secret | ADR accepted |
| **1 — Ask** | Panel, streaming, knowledge pack, `search_docs`, every read tool, usage logging | Fred answers the eval set's read questions correctly; guests and members use it for a week |
| **2 — Act** | Propose tools, confirm cards, "via Fred" audit entries | Every propose tool tested end to end; no write without Confirm |
| **3 — Brief** | Morning brief on the daily cron, shown on the Dashboard | Runs for a week with no false alarms |

Phase 1 is a few days of work, Phase 2 about as much again; neither touches the firmware or
the shore station.

## Decisions needed before building

1. **Who holds the Anthropic API key and pays for it?** A team key on a university or personal
   account, and the monthly cap that goes with it.
2. **Can guests use Fred?** The plan says yes, read-only, with a lower limit; the alternative is
   members only.
3. **Keep conversations 30 days, or not at all?** Keeping them gives history and helps debug
   wrong answers; not keeping them sends less to D1.
4. **Is "Fred" the name?** The placeholder uses it.
5. **Which writes are in Phase 2?** The table above is the proposal; admin actions could wait.

## Risks

- **Wrong answers stated confidently.** Mitigated by citing files and tool results, and by the
  eval set. Fred should say when it does not know.
- **Cost running away.** Caps and rate limits refuse before the bill grows.
- **A change nobody meant.** Every write needs a click on a card that states the effect.
- **Stale knowledge.** The pack is rebuilt on every deploy from `main`; live data always comes
  from tools, never from the pack.
