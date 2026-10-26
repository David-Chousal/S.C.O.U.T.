# S.C.O.U.T. Console

The team's signed-in back end: a [Cloudflare Worker](https://developers.cloudflare.com/workers/)
with a [D1](https://developers.cloudflare.com/d1/) database. Decided in
[ADR-0012](../docs/decisions/0012-authenticated-console.md); this is **Phase A**, built with
[SCO-198](https://linear.app/scout1/issue/SCO-198).

The public dashboard stays a static GitHub Pages site. It never calls this Worker and holds no
secret.

```
browser (team) ──sign in──►  this Worker  ◄──device token──  shore station (sync_console.py)
                                 │                                │
                                 D1: users, sessions, invites,    └─ signs SET_TX_COUNT with the
                                 buoys, devices, readings, audit     buoy's key and sends it by LoRa
```

## What Phase A does

| Page | Who can change it | What it is |
|---|---|---|
| Fleet settings | member, admin | The daily transmit count per buoy (1–3), the count the buoy last reported, and **pending** until they match. Battery-life estimate for each option |
| Team | admin | Invites (single-use link, 7 days), roles, password-reset links |
| Shore stations | admin | Device tokens the shore station uses for the API (shown once, stored hashed) |
| Audit log | (read only) | Every change: who, what, before → after |
| Account | yourself | How you sign in; sign out everywhere |

**Roles.** *Guest* sees every page and every setting, admin pages included, with the controls
disabled and a "view only" note. *Member* also changes buoy settings. *Admin* also manages people
and devices. The server checks the role on every write ([`worker/roles.js`](worker/roles.js)); the
disabled controls are only a courtesy.

**Sign-in.** GitHub, Google, or email and password. Accounts are **invite-only**. The one
exception is the first admin, named by `BOOTSTRAP_ADMIN_EMAIL`, which works only while the
database has no users. OAuth trusts only a verified email, and an invite accepted through GitHub
or Google must match the invited email.

**Device API** (bearer token from the Shore stations page):

| Call | Body / reply |
|---|---|
| `POST /api/device/readings` | `{"rows": [schema row, …]}`, ≤ 200 rows, ≤ 256 KB. Repeats of a `(buoy_id, record_seq)` are ignored |
| `GET /api/device/settings` | `{"ok": true, "buoys": [{"buoy_id": 1, "tx_count_requested": 2}]}` |

The console never holds a buoy's command key, so it cannot forge a radio command. At worst it can
request a count in 1–3, which the buoy also range-checks.

## Security notes

- Session cookie `__Host-scout_session`: 256 random bits, `Secure; HttpOnly; SameSite=Lax`. Only
  its SHA-256 is stored. Seven-day expiry.
- Every form carries a per-session CSRF token, and POSTs must come from `APP_URL`'s origin.
- Passwords: PBKDF2-HMAC-SHA256 with **100,000** iterations, 12–256 characters. Sign-in is limited
  to 5 failures per email and 20 per IP in 15 minutes. **Accepted risk (ADR-0012):** this is below
  OWASP's 600,000, chosen for the Workers Free plan's 10 ms CPU limit. In local workerd 100,000
  iterations took about 10–11 ms, so measure sign-in CPU on the deployed Worker. Workers Paid +
  argon2id is the upgrade.
- CSP `default-src 'none'`, with no scripts at all. Every interpolated value is HTML-escaped.

## Deploy (one-time, needs the account owner)

Claude cannot do these steps. They need your Cloudflare and OAuth accounts.

```bash
cd console
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
4. Sign in as the bootstrap admin and invite the team.
5. Create a shore-station token, and on the shore run:
   `SCOUT_CONSOLE_URL=<APP_URL> SCOUT_CONSOLE_TOKEN=scd_… python shore/scripts/sync_console.py`.

Providers without a client ID and secret are simply hidden from the sign-in page.

## Develop and test

```bash
cd console
npm test                                      # node --test, no npm install needed (Node ≥ 22.13)
npx wrangler d1 migrations apply scout-console --local
npx wrangler dev --var APP_URL:http://localhost:8787
```

The tests run the real migration and Worker against Node's built-in SQLite
([`test/d1-shim.js`](test/d1-shim.js)). The battery-life figures come from
[`worker/battery-life.json`](worker/battery-life.json), which
`python3 scripts/export_battery_life.py` regenerates from the analytics model. A test fails if
the JSON drifts from the model.

## Later phases (not built)

B: API tokens + REST API + OpenAPI · C: customizable dashboards · D: downloadable reports (R2)
· E: nightly backups, custom domain. Each phase is its own PR and Linear issue.
