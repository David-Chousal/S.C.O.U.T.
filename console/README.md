# S.C.O.U.T. Console

The team's signed-in console: a [Cloudflare Worker](https://developers.cloudflare.com/workers/)
with a [D1](https://developers.cloudflare.com/d1/) database, and a front end built on the **COR
design system in Tideline colour**. Decided in
[ADR-0012](../docs/decisions/0012-authenticated-console.md). Phase A came with
[SCO-198](https://linear.app/scout1/issue/SCO-198), the COR front end with
[SCO-238](https://linear.app/scout1/issue/SCO-238).

**Live at <https://console.scoutscu.com>** (custom domain since 2026-10-30; the old <https://scout-console.scout1.workers.dev> address sends browsers there and still takes shore-station pushes) since 2026-10-26; last deployed on 2026-11-04 from branch `console/account-help-devtabs` (PR #286, before merge; Worker version 2dc12949), with D1 migration 0009 applied (database exported first); every earlier migration was already applied. From 2026-11-04, a merge to `main` that touches `console/` deploys it automatically after a reviewer approves ([Automatic deploy](#automatic-deploy-on-merge-to-main)); this takes effect once the one-time setup there is done.
The public dashboard stays a static GitHub Pages site. It never calls this Worker and holds no
secret.

```
browser (team) ──sign in──►  Worker ─┬─ /api/*         JSON API          (worker/api.js)
                                     ├─ /auth/*        GitHub, Google    (worker/oauth.js)
                                     ├─ /api/device/*  shore station     (worker/device.js) ◄── sync_console.py
                                     └─ everything else: web/out, the static front end,
                                        each page given a fresh script nonce + CSP (worker/assets.js)
                                     D1: users, sessions, invites, buoys, buoy_settings, devices, readings, audit
```

## Layout

| Folder | What |
|---|---|
| `worker/` | The Worker: JSON API, OAuth, device API, static assets. Plain ES modules, no build |
| `worker/assistant/` | Fred, the assistant ([ADR-0013](../docs/decisions/0013-console-assistant-fred.md)): model interface, tools, confirm, brief |
| `migrations/` | D1 schema |
| `test/` | Worker tests on Node's built-in SQLite (`npm test`) |
| `web/` | The front end: Next.js 16 / React 19, **static export** to `web/out`, served by the Worker |
| `web/design/tokens.json` | COR's token structure valued from Tideline, written by `scripts/export_console_tokens.py` |

## Pages

| Page | Who can change it | What it is |
|---|---|---|
| Dashboard | members and admins arrange; guests view | The built-in **Overview** (the first buoy's water temperature, turbidity and battery; a 7-day water-temperature trend for every buoy; fleet freshness; the latest readings), plus the team's **shared views** and **your own**. **Customize** (key E) is COR's layout editor: drag or use the keyboard to move bays, resize them on the 12-column grid, add readouts, trends, fleet or latest-readings bays, remove them, save (⌘S). Saving the Overview makes your own copy. Trend lines use one colour per buoy in a fixed order checked with the dataviz validator for colour-blind separation, with a legend, end labels, a hover crosshair and a table view; silence over 26 hours shows as a gap. Migration `0008-dashboards.sql` |
| Reports | members make CSVs; everyone prints | Pick buoys, whole UTC days and variables. **Download CSV** stores the file in R2 (`reports/`, deleted after 2 days) and hands back a link that works for an hour, no session needed; 20 a day per person, at most 50,000 readings each; cells that a spreadsheet would run as formulas are neutralised. **Printable report** renders a per-buoy summary (count, min, mean, max) and every reading in the browser, to print or save as PDF; nothing is stored. Recent reports can get a fresh link while their file is kept |
| Readings | (read only) | Each buoy's newest values (water temperature, turbidity, battery, housing humidity) and its last 50 readings, newest first, as the shore stations pushed them |
| Fleet | admin (add); everyone (read) | One table, a row per buoy, refreshed every 30 s: how often it sends (and what was asked when that differs), when it was last heard, its **next transmission** (countdown and UTC slot, from its count and slot phase), its **status** (Live, Late, Silent or Not heard, judged against the longest gap between its own slots plus an hour), and a **Settings** link. **Add buoy** (admins) opens a dialog that ends in a success or error card. Readings belong on Dashboard and Reports |
| Stations | admin | One table of shore stations, refreshed every 30 s: name, **the buoys it sends commands to** (as chips), last seen, and status; hold to revoke an active token, a trash key deletes a revoked one for good (audited). With two or more active stations, **Assign** opens a checklist of buoys for that station, and a warning names any buoy no station commands. **New token** opens a dialog that shows the token once, then watches for the first check-in. Buoys' own state is on Fleet |
| Team | admin | People with a real account (not self-signed-up guests), roles, reset links, hold-to-disable, invites (single-use link, 7 days). **Invite and reset links are emailed** from `console@scoutscu.com` when email is set up ([below](#email-invites-and-reset-links-one-time-needs-the-account-owner), ADR-0014); the card says "Email sent to …" or "Couldn't email …; copy the link instead", and the link is always shown once to copy |
| Developer | member, admin (guests view) | Two tabs. **API tokens:** personal tokens (scopes `read:telemetry`, `write:settings`; 7, 30, 90 or 365 days, or never (migration `0009-tokens-never-expire.sql`); shown once, stored hashed, revocable) and how to call `/api/v1`. **Audit log** (read only, `?tab=audit`): every change, who, what, before → after. The old `/audit/` address forwards here |
| Settings | member (buoys); yourself (page) | **Buoys:** an overview table of every buoy (settings state, what differs from the defaults, last heard); picking one (kept as `?buoy=N`) opens its editor: its name and its **eight remote settings**; changing the transmit count first asks for confirmation, showing battery life before and after (estimate) (transmit count, slot phase, reading interval, hydrophone clip, power thresholds, conserve spacing, humidity alert; registry in `firmware/lib/scout_settings`, D1 migration `0010-remote-settings.sql`) with Pending/Confirmed from the digest in v5 packets and hold-to-restore-defaults, and every firmware setting read from `config.h` (`scripts/export_buoy_config.py` → `worker/buoy-config.json`, drift-tested). **Account:** how you sign in; sign out of this browser; hold to sign out everywhere (`?tab=account`). **This browser:** theme (light by default), UTC or local times, keyboard shortcuts, kept in this browser's storage |
| Account menu | yourself | The account in the top bar opens a menu: your name, email and role, **Appearance** (light, dark, match system) and **Times** (UTC or your time zone), the same two settings as Settings → This browser, a link to Settings → Account, and **Sign out**. The old `/account/` address forwards to Settings → Account |
| Ask Fred (top bar, every page) | members and admins confirm changes; guests ask only | The assistant ([below](#fred-the-assistant)): a panel docked on the right that squeezes the page as it opens (it floats over the page under 1024 px and is a full-screen sheet that fills a phone's screen), opened with **A** when shortcuts are on. Drag its left edge, or focus the edge and use the arrow keys, to resize it (320–720 px, never leaving the page under 420 px) |
| Menu (left, every page) | yourself | Drag its right edge to narrow it, down to an icon rail; the panel icon at its foot collapses and expands it in one click. Both widths are remembered in this browser. Page layouts follow the room the page actually has (CSS container queries), not the window width |
| Help | (read only) | Task-first guide: a picker of four tasks, then how data gets from the buoy to the console (diagram), connecting a shore station (S3 over WiFi, or the USB computer fallback), adding a buoy, changing its settings, troubleshooting by symptom, roles, keyboard shortcuts, and the API |
| Sign in, invite, reset | — | GitHub, Google or password, or **Sign in as guest** (name and email, view only); the invite and reset token is read from `?token=` |

**Roles.** *Guest* sees every page and every setting, admin pages included, with the controls
disabled and a "view only" banner. *Member* also changes buoy settings. *Admin* also manages
people and devices. The Worker checks the role on every write ([`worker/roles.js`](worker/roles.js));
the front end's `can()` ([`web/src/lib/session.tsx`](web/src/lib/session.tsx)) only mirrors it,
and a test fails if the two disagree.

**Sign-in.** Accounts are **invite-only**. The one exception is the first admin, named by
`BOOTSTRAP_ADMIN_EMAIL`, which works only while the database has no users. OAuth trusts only a
verified email, and an invite accepted through GitHub or Google must match the invited email.

**Sign in as guest** (since 2026-10-30, [`worker/guests.js`](worker/guests.js)). Anyone can open a
view-only guest account with a name and an email. Nothing proves the email, so anyone who types it
gets the same account, and that drives the rules: an email that already belongs to a real account
is refused; one address can start five guest sessions per 15 minutes; **other people's emails are
masked** for these guests (`i•••@scout.test`, applied to every API reply); the account **can never
be promoted** or given a reset link; and an invite or a verified GitHub/Google sign-in for the same
email takes it over and ends every session opened as a guest. They are visitors, not team
members, so the Team page does not list them (since 2026-11-04; invited guests are listed). D1 migration `0003-guest-sign-in.sql` adds the `self_signup` column.

## The design: COR, adapted

The front end adopts COR's design system (rails and bays instead of cards, keys you press,
signal meters for freshness, hold-to-confirm for destructive actions, a 12-column grid, a bottom
bar on phones) and adapts it:

- **Colour is Tideline's.** `scripts/export_console_tokens.py` computes every colour from the
  site's tokens (`analytics/telemetry/site/theme/tokens.py`): stone ground and lagoon accent by
  day, abyss and foam by night, Tideline's status hues and Okabe–Ito series.
  `analytics/telemetry/tests/test_console_tokens.py` fails on drift or on any text pair under
  WCAG AA in either theme. Then `cd web && npm run tokens` writes `src/styles/tokens.css`.
- **Type is Tideline's:** DM Sans and JetBrains Mono, self-hosted (OFL licences beside the files).
- **Names follow CONVENTIONS.md:** kebab-case files (`buoy-bay.tsx`, tests `*-test.tsx`), class
  prefix `sc-`, plain route folders (no `(group)` folders).
- Marketing-specific parts of COR (channels, CRM, attribution) are not carried over.

## API

The front end calls only [`web/src/lib/api/client.ts`](web/src/lib/api/client.ts). Writes are JSON,
same-origin, and carry the session's CSRF token in `X-CSRF-Token`; a cross-site HTML form can do
none of that.

| Read (GET) | Write (POST) |
|---|---|
| `/api/session`, `/api/providers`, `/api/flash` | `/api/login`, `/api/logout`, `/api/account/sign-out-everywhere` |
| `/api/fleet` (buoys + battery estimates + slot labels) | `/api/fleet/buoys`, `/api/fleet/buoys/:id/tx-count` |
| `/api/team` | `/api/team/invites`, `…/invites/:id/revoke`, `…/users/:id/role`, `…/users/:id/reset`, `…/users/:id/disable` and `/enable` |
| `/api/devices`, `/api/audit` | `/api/devices`, `/api/devices/:id/revoke` |
| `/api/readings?buoy=&from=&to=&limit=`, `/api/tokens` | `/api/tokens`, `/api/tokens/:id/revoke` |
| `/api/invites/:token`, `/api/resets/:token` | `/api/invites/:token/accept`, `/api/resets/:token` |

**REST API** (Phase B, [SCO-240](https://linear.app/scout1/issue/SCO-240)): `/api/v1/buoys`, `/api/v1/buoys/:id/readings`,
`/api/v1/settings` (scope `read:telemetry`) and `POST /api/v1/buoys/:id/tx-count` (scope `write:settings`, owner
must be a member or admin), with a personal token from the Developer page as `Authorization: Bearer sct_…`.
A token acts with its owner's role at the time of use, so disabling or demoting someone limits
their tokens at once. Described in [`worker/openapi.json`](worker/openapi.json), served publicly at
`/api/v1/openapi.json`. Migration `0005-api-tokens.sql`.

**Device API** (bearer token from the Stations page): `POST /api/device/readings`
(`{"rows": [schema row, …]}`, ≤ 200 rows, ≤ 256 KB, repeats ignored) and `GET /api/device/settings`.
A station is told a buoy's requested count only if it is that buoy's **command station** (picked by an
admin on the Stations page), or if it is the only active station and none is picked; with two
stations and none picked, nobody sends it. Two stations sending the same command in the buoy's 1 s
listen window would collide, or one would be refused as a repeat and show as `CMD_REJECTED`.
Revoking a station clears it as a command station. Migration `0004-command-station.sql`.
The console never holds a buoy's command key, so it cannot forge a radio command; at worst it can
request a count in 1–3, which the buoy also range-checks.

## Security notes

- Session cookie `__Host-scout_session`: 256 random bits, `Secure; HttpOnly; SameSite=Lax`, seven
  days. Only its SHA-256 is stored.
- **Pages get a per-request nonce.** The Worker adds it to every `<script>` and script preload of
  the static export and sends `script-src 'nonce-…' 'strict-dynamic'`, so an injected script does
  not run. `style-src` allows `'unsafe-inline'`, because React style props render as attributes,
  which a nonce cannot cover.
- An OAuth error reaches the sign-in page through a one-time HttpOnly cookie read by `/api/flash`,
  never the URL, since it can name an email address.
- Passwords: PBKDF2-HMAC-SHA256 with **100,000** iterations, 12–256 characters. Sign-in is limited
  to 5 failures per email and address, 20 per address and 50 per email in 15 minutes.
  **Accepted risk (ADR-0012):** this is below OWASP's 600,000, chosen for the Workers Free plan's
  10 ms CPU limit. **Measured live on 2026-10-26: a sign-in uses 22–96 ms of CPU (median 45 ms),**
  2–10× that limit; Cloudflare let every one finish, but that is not guaranteed. Every other
  request uses 0–2 ms. **Decided (David, 2026-10-26): keep it and watch.** A sign-in that fails
  with Cloudflare error 1102, or `outcome: exceededCpu` in `npx wrangler tail scout-console`,
  means the limit is now enforced; then move to Workers Paid with argon2id
  ([SCO-239](https://linear.app/scout1/issue/SCO-239)).
- Request bodies are refused before they are read when over the limit or sent without a length.

## Fred, the assistant

Fred ([ADR-0013](../docs/decisions/0013-console-assistant-fred.md), [SCO-299](https://linear.app/scout1/issue/SCO-299))
answers questions about the console, the project and the live fleet, and drafts changes that run
only when the person clicks **Confirm**. It runs in this Worker (`worker/assistant/`) on the free
tier of Google's Gemini API.

- **What it can read:** buoys (health, next transmit, settings state), one buoy in full, readings
  (at most 200 points with min/max/mean), shore stations and routes, your reports and dashboards,
  the audit log (names, never emails), file storage (admins), the repo docs (`search_docs`), and
  console links.
- **What it can draft** (a card with the effect, valid for 10 minutes): buoy settings, restore
  defaults, rename, a CSV report (members and admins); a buoy's command station and revoking a
  station token (admins). Confirm re-checks your role and runs the same handler the page would;
  the audit log shows `<email> via Fred`. Guests are never offered these.
- **What it never does:** reveal or create secrets, change roles, disable accounts, delete
  anything, or change anything without your click.
- **Nothing you type is stored.** The conversation lives in the open panel and goes when the tab
  closes. D1 keeps only pending cards (`assistant_actions`) and daily counts
  (`assistant_usage`), migration `0011-assistant.sql`. **Report this answer** copies one exchange
  for a Linear issue. Google may review what you type on the free tier; the Help page says so (the panel no longer
  carries a notice, removed 2026-11-06 at David's request).
- **Limits:** `ASSISTANT_DAILY_CAP` (40) and `ASSISTANT_DAILY_CAP_GUEST` (10) questions a day per
  person, from `wrangler.toml`. When Gemini is rate-limited it retries once, then a smaller
  Workers AI model answers with no drafting (the `[ai]` binding). Admins see today's use under
  Settings → Buoys → File storage; check it before a demo.
- **Morning brief:** the daily cron (with the backup) writes a note to the top of the Dashboard
  from facts worked out in code (silent or late buoys, rejected or stuck settings, quiet
  stations, storage near budget); Gemini Flash-Lite phrases them, or the facts show as they are.
  Migration `0012-assistant-brief.sql`.
- **Knowledge:** `scripts/build_assistant_knowledge.py` builds `worker/assistant/knowledge.json`
  (generated, not committed) from the Help page, the settings registry, `docs/hub/facts.md` and
  every tracked doc. `npm test`, `npm run dev` and the deploy workflow run it first.
- **Model:** `gemini-3.5-flash-lite` for everything. On the free tier the stronger
  `gemini-3.8-flash` allows only 20 requests a day per project, and one question takes 2–9 model
  calls. Model IDs live in one constant in `worker/assistant/model.js`; Google retires them often.
  Eval score 2026-11-05: 41/41.

**Set up the key** (David's Google account, ADR-0013 decision 3). In Google AI Studio, create the
key in a project **with no billing enabled**, or Google refuses every model instead of serving the
free tier. Then, from `console/`:

```bash
npx wrangler secret put GEMINI_API_KEY
```

For local development put `GEMINI_API_KEY=…` in `console/.dev.vars` (gitignored). Never put it in
`wrangler.toml`, a commit or a chat.

**Before a prompt or model change**, run the eval set against the real model and record the score
in the PR:

```bash
cd console && node scripts/run-assistant-evals.mjs --out /tmp/fred-evals.json
```

## Deploy (one-time, needs the account owner)

Claude cannot do these steps. They need your Cloudflare and OAuth accounts.

```bash
cd console/web && npm ci && npm run build && cd ..   # the front end the Worker serves
npx wrangler login
npx wrangler d1 create scout-console          # paste the database_id into wrangler.toml
npx wrangler d1 migrations apply scout-console --remote
npx wrangler secret put GEMINI_API_KEY        # Fred (see "Fred, the assistant"); optional
npx wrangler deploy                           # prints the workers.dev URL → APP_URL in wrangler.toml
```

Then:

1. Set `APP_URL` and `BOOTSTRAP_ADMIN_EMAIL` in `wrangler.toml` and deploy again.
2. **GitHub:** Settings → Developer settings → OAuth Apps → New. Callback
   `<APP_URL>/auth/github/callback`. Put the client ID in `GITHUB_CLIENT_ID`, then run
   `npx wrangler secret put GITHUB_CLIENT_SECRET`.
3. **Google:** Cloud Console → Credentials → OAuth client (Web). Redirect URI
   `<APP_URL>/auth/google/callback`. Set `GOOGLE_CLIENT_ID`, then run
   `npx wrangler secret put GOOGLE_CLIENT_SECRET`.
4. Create the first admin. With a password: `node scripts/create-admin.mjs` asks for your email,
   name and password (typed hidden), hashes the password on your machine with the console's own
   PBKDF2 and sends only the hash to D1; it refuses once an admin exists. Or with GitHub/Google:
   set `BOOTSTRAP_ADMIN_EMAIL` and sign in with that verified email. Then invite the team from
   the Team page.
5. Create a shore-station token on Stations, and on the shore run:
   `SCOUT_CONSOLE_URL=<APP_URL> SCOUT_CONSOLE_TOKEN=scd_… python shore/scripts/sync_console.py`.

Providers without a client ID and secret are simply hidden from the sign-in page.

## Email: invites and reset links (one-time, needs the account owner)

The console emails invite and password-reset links through Cloudflare Email Sending
([ADR-0014](../docs/decisions/0014-console-email-delivery.md), `worker/mail.js`). The code is in
place; **the binding is commented out in `wrangler.toml`** because the account is not set up for
it yet, so today every invite says "email isn't set up" and the admin copies the link.

What it costs and what it needs (Cloudflare docs, read 2026-11-06):

- **Workers Paid is required.** Email Sending is not available on Workers Free (which can only
  send to the account's verified addresses). Workers Paid is **$5 a month** and includes
  **3,000 emails a month**, then $0.35 per 1,000. No daily number is published: new accounts
  start on "a conservative daily quota" that grows with good sending.
- **The domain must use Cloudflare DNS** (`scoutscu.com` does). Onboarding adds MX, SPF (TXT)
  and DKIM (TXT) records under `cf-bounce.scoutscu.com` and a DMARC TXT at `_dmarc.scoutscu.com`;
  it does not touch the GitHub Pages records.
- **Limits:** 50 recipients per message, 25 MiB per message. The console's own caps are 20 emails
  a day per admin and 50 a day overall (`EMAIL_DAILY_CAP_ADMIN`, `EMAIL_DAILY_CAP_TOTAL`).

Claude cannot do steps 1–3; they need the account owner signed in to the Cloudflare dashboard.

1. **Upgrade the account** to Workers Paid in the dashboard (**Workers & Pages**, then the plan's upgrade option).
2. **Onboard the domain:** **Compute** → **Email Service** → **Email Sending** → **Onboard
   Domain** → `scoutscu.com` → review the records → **Done**. Wait for the records to verify
   (usually 5–15 minutes). `npx wrangler email sending dns get scoutscu.com` shows them, with a
   token that has Email Sending permission (the default `wrangler login` token does not).
3. **Check DMARC:** if `scoutscu.com` already had a `_dmarc` record, keep one, not two.
4. **Turn the binding on:** uncomment the `[[send_email]]` block in `wrangler.toml`, merge, and
   deploy. Never add `remote = true`: it would send real email from `wrangler dev`.
5. **Test:** invite an address you control from Team. The card should say "Email sent to …",
   the message should arrive from `console@scoutscu.com` and pass SPF/DKIM (Gmail: **Show
   original**), and Developer → Audit log should show `invite.email` with the address masked.
   If it says "Couldn't email", `npx wrangler tail` shows the error code (for example
   `E_SENDER_NOT_VERIFIED`).

To turn email off again, comment the block out and deploy; invites fall back to copying links.

**Local development:** `wrangler dev` simulates the binding and sends nothing: each message is
written to `console/.wrangler/tmp/email/` (git-ignored) and the log prints where. While the
binding is commented out, test with a scratch copy of `wrangler.toml` that has it uncommented
and the `[ai]` block removed (the AI binding starts a remote preview session, which Cloudflare
refuses while the account has no Email Sending).

## Automatic deploy (on merge to main)

[`console-deploy.yml`](../.github/workflows/console-deploy.yml) deploys the console whenever a
merge to `main` touches `console/`, or when run by hand (**Actions → Console deploy → Run
workflow**). It waits for a reviewer to approve it, then runs the tests and builds the front end.
Next it exports the live D1 database to R2 (`backups/pre-deploy-<time>-<commit>.sql.gz`, deleted
after 35 days), applies pending migrations, deploys the Worker and checks `/healthz`. The export
goes to R2, never to a GitHub artifact, because the repo is public.

**One-time setup, before the workflow first reaches `main`.** Claude cannot do it: it needs the
Cloudflare account and repo admin (`David-Chousal`).

1. **Cloudflare API token.** Dashboard → **My Profile → API Tokens → Create Token** → the
   **Edit Cloudflare Workers** template, then **add** *Account · D1 · Edit*. Limit *Account
   Resources* to the S.C.O.U.T. account and *Zone Resources* to `scoutscu.com`. The template's
   *Workers Routes* and *Account Settings: Read* are needed too, because `wrangler deploy` checks
   the `console.scoutscu.com` custom domain and the account. The account ID is in the dashboard
   URL (`dash.cloudflare.com/<account id>/…`) and on the Workers overview page.
2. **GitHub environment.** Repo **Settings → Environments → New environment** → `production`.
   Tick **Required reviewers** and add at least one teammate. Under **Deployment branches**, pick
   *Selected branches* → `main`. Add the secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` here, as environment secrets, not repo secrets.

Do step 2 first: GitHub creates a missing environment with no reviewer, so the first merge
would deploy without approval. Without the secrets the job stops at its first check and deploys
nothing.

A manual `npx wrangler deploy` still works for a deploy from a branch. Export the database first,
as the workflow does.

## Storage guardrails (R2) and backups

Backups and reports live in the R2 bucket **`scout-console-files`** (binding `FILES`, created
2026-10-30, location hint WNAM). R2 has a free tier (10 GB stored, 1 million writes and 10 million
reads a month, free egress and deletes) but **Cloudflare offers no hard spending cap**, so the
console caps itself. Layer by layer:

| Guardrail | Where | What it stops |
|---|---|---|
| Storage class **Standard**, never Infrequent Access | bucket default | IA has no free tier, retrieval fees and a 30-day minimum charge |
| Lifecycle rules: `backups/` deleted after 35 days, `reports/` after 2, anything else after 60, unfinished uploads after 1 | bucket (`wrangler r2 bucket lifecycle list scout-console-files`) | Files piling up, even if the Worker stops running |
| Every R2 call goes through `worker/storage.js` and is counted in D1 first | Worker | A bug or a loop calling R2 without limit |
| Monthly ceilings: **100,000 writes** (10% of free), **1,000,000 reads** (10%) | `BUDGET` in `worker/storage.js` | Operation charges; past the ceiling the call is refused and R2 is never reached |
| **2 GB stored** (20% of free), summed from the console's own ledger, not a billable list call | same | Storage charges |
| **25 MB** per object; writes only under `backups/` or `reports/` | same | One huge file; files no lifecycle rule would delete |
| Admin-only **File storage** panel (Settings → Buoys) | front end | Use you can't see |

At one backup a night the console uses about 30 writes a month. One thing only a person can add:
a Cloudflare **billing notification** (dashboard → Notifications → Add → *Usage Based Billing*),
which emails you if any usage is ever billed.

**Nightly backup** (Phase E, [SCO-241](https://linear.app/scout1/issue/SCO-241)): a cron trigger at 10:30 UTC (`wrangler.toml`)
writes `backups/YYYY-MM-DD.sql.gz`, a gzipped dump of every table as SQL `INSERT`s (sessions,
failed sign-ins and the storage ledger left out). To restore into an empty database:

```bash
npx wrangler r2 object get scout-console-files/backups/2026-10-31.sql.gz --remote --file backup.sql.gz
gunzip backup.sql.gz
npx wrangler d1 migrations apply scout-console --remote     # the schema first
npx wrangler d1 execute scout-console --remote --file backup.sql
```

Everyone has to sign in again afterwards. Migration `0006-storage-budget.sql` adds the ledger.
The custom domain (the rest of Phase E) is `console.scoutscu.com`; see below.

## Custom domain: scoutscu.com (one-time, needs the account owners)

The public site lives at `scoutscu.com` (still built and hosted by GitHub Pages) and the console at
`console.scoutscu.com` (this Worker). The site's navbar links to the console. The code side is
done (`wrangler.toml` route and `APP_URL`, the site's **Console** link, the chat Worker's origin).
Claude cannot do the steps below: they need the Cloudflare account, the GitHub repo admin, and a
purchase. Do them in this order, because the site links to the console as soon as it is
deployed.

1. **Buy the domain.** Cloudflare dashboard → **Domain Registration → Register Domains** →
   `scoutscu.com`, in the same account that runs the console. Cloudflare then hosts its DNS.
2. **Move the console.** From `console/`, on `main`: `npx wrangler deploy`. The `routes` entry
   creates the `console.scoutscu.com` DNS record and certificate (a few minutes). Check
   <https://console.scoutscu.com/healthz> says `ok`, then that
   <https://scout-console.scout1.workers.dev/fleet/> forwards to it.
3. **Point the site at GitHub Pages.** In Cloudflare DNS for `scoutscu.com`, add four `A`
   records for `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a
   `CNAME` for `www` to `david-chousal.github.io`, all **DNS only** (grey cloud), so GitHub can
   issue its own certificate.
4. **Tell GitHub.** Signed in as `David-Chousal` (repo admin): repo **Settings → Pages → Custom
   domain** → `scoutscu.com` → Save; once the check passes, tick **Enforce HTTPS**. The old
   `david-chousal.github.io/S.C.O.U.T./` address then forwards to the new domain.
5. **Redeploy the chat Worker** so it accepts the new site origin: from `chatbot/`,
   `npx wrangler deploy`.
6. **Re-point what holds the old console URL:** each shore station's `shore_secrets.h`
   (`SHORE_CONSOLE_URL`, then re-flash) and any `SCOUT_CONSOLE_URL` used with `sync_console.py`.
   Until then they keep working: the old address still takes device pushes.
7. **When OAuth apps are set up**, use `https://console.scoutscu.com/auth/<github|google>/callback`.

Sign-in sessions are per address, so everyone signs in once more on the new domain.

## Develop and test

Local data is keyed by `database_id`, so `wrangler dev` uses its own local D1, separate from the
live one. Apply the schema to it once (`npx wrangler d1 migrations apply scout-console --local`)
and create a local admin with `node scripts/create-admin.mjs --local`.

```bash
cd console
npm test                                      # the Worker: node --test, no install (Node ≥ 22.13)
cd web && npm ci
npm run lint && npm test && npm run build     # the front end: ESLint, Vitest, static export
cd .. && npx wrangler d1 migrations apply scout-console --local
npx wrangler dev --local-upstream localhost:8787 --var APP_URL:http://localhost:8787   # serves web/out through the Worker
```

`--local-upstream` matters since the custom domain: without it `wrangler dev` hands the Worker
the route's host (`console.scoutscu.com`), which differs from `APP_URL`, so every page redirects
to localhost and back. A browser caches that 301, so after hitting it use a different port.

The Worker tests run the real migration against Node's built-in SQLite
([`test/d1-shim.js`](test/d1-shim.js)). The battery-life figures come from
[`worker/battery-life.json`](worker/battery-life.json), which
`python3 scripts/export_battery_life.py` regenerates from the analytics model; a test fails if the
JSON drifts. After changing a Tideline colour, run `python3 scripts/export_console_tokens.py`, then
`cd web && npm run tokens`.

## Later phases (not built)

B: API tokens + REST API + OpenAPI ([SCO-240](https://linear.app/scout1/issue/SCO-240)) · C:
customizable dashboards · D: downloadable reports (R2) · E: nightly backups, custom domain
([SCO-241](https://linear.app/scout1/issue/SCO-241)). COR's layout editor and report composer are
the starting points for C and D. Fred, the assistant, was built 2026-11-05 (ADR-0013).
