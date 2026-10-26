# S.C.O.U.T. Console

The team's signed-in console: a [Cloudflare Worker](https://developers.cloudflare.com/workers/)
with a [D1](https://developers.cloudflare.com/d1/) database, and a front end built on the **COR
design system in Tideline colour**. Decided in
[ADR-0012](../docs/decisions/0012-authenticated-console.md). Phase A came with
[SCO-198](https://linear.app/scout1/issue/SCO-198), the COR front end with
[SCO-238](https://linear.app/scout1/issue/SCO-238).

**Live at <https://scout-console.scout1.workers.dev>** since 2026-10-26 (deployed from the SCO-238 branch, before review).
The public dashboard stays a static GitHub Pages site. It never calls this Worker and holds no
secret.

```
browser (team) ──sign in──►  Worker ─┬─ /api/*         JSON API          (worker/api.js)
                                     ├─ /auth/*        GitHub, Google    (worker/oauth.js)
                                     ├─ /api/device/*  shore station     (worker/device.js) ◄── sync_console.py
                                     └─ everything else: web/out, the static front end,
                                        each page given a fresh script nonce + CSP (worker/assets.js)
                                     D1: users, sessions, invites, buoys, devices, readings, audit
```

## Layout

| Folder | What |
|---|---|
| `worker/` | The Worker: JSON API, OAuth, device API, static assets. Plain ES modules, no build |
| `migrations/` | D1 schema |
| `test/` | Worker tests on Node's built-in SQLite (`npm test`) |
| `web/` | The front end: Next.js 16 / React 19, **static export** to `web/out`, served by the Worker |
| `web/design/tokens.json` | COR's token structure valued from Tideline, written by `scripts/export_console_tokens.py` |

## Pages

| Page | Who can change it | What it is |
|---|---|---|
| Fleet | member, admin | Each buoy's daily transmit count (1–3): requested vs reported as a signal meter, **pending** until they match, and each option's battery life (two D cells, estimate) |
| Stations | admin | When each buoy and shore station was last heard from; the shore stations' device tokens (shown once, stored hashed) |
| Team | admin | People, roles, reset links, hold-to-disable, invites (single-use link, 7 days) |
| Audit log | (read only) | Every change: who, what, before → after |
| Account | yourself | How you sign in; hold to sign out everywhere |
| Sign in, invite, reset | — | GitHub, Google or password; the invite and reset token is read from `?token=` |

**Roles.** *Guest* sees every page and every setting, admin pages included, with the controls
disabled and a "view only" banner. *Member* also changes buoy settings. *Admin* also manages
people and devices. The Worker checks the role on every write ([`worker/roles.js`](worker/roles.js));
the front end's `can()` ([`web/src/lib/session.tsx`](web/src/lib/session.tsx)) only mirrors it,
and a test fails if the two disagree.

**Sign-in.** Accounts are **invite-only**. The one exception is the first admin, named by
`BOOTSTRAP_ADMIN_EMAIL`, which works only while the database has no users. OAuth trusts only a
verified email, and an invite accepted through GitHub or Google must match the invited email.

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
| `/api/invites/:token`, `/api/resets/:token` | `/api/invites/:token/accept`, `/api/resets/:token` |

**Device API** (bearer token from the Stations page): `POST /api/device/readings`
(`{"rows": [schema row, …]}`, ≤ 200 rows, ≤ 256 KB, repeats ignored) and `GET /api/device/settings`.
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
  10 ms CPU limit. 100,000 took about 10–11 ms in local workerd, so measure sign-in CPU on the
  deployed Worker ([SCO-239](https://linear.app/scout1/issue/SCO-239)).
- Request bodies are refused before they are read when over the limit or sent without a length.

## Deploy (one-time, needs the account owner)

Claude cannot do these steps. They need your Cloudflare and OAuth accounts.

```bash
cd console/web && npm ci && npm run build && cd ..   # the front end the Worker serves
npx wrangler login
npx wrangler d1 create scout-console          # paste the database_id into wrangler.toml
npx wrangler d1 migrations apply scout-console --remote
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
npx wrangler dev --var APP_URL:http://localhost:8787   # serves web/out through the Worker
```

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
the starting points for C and D.
