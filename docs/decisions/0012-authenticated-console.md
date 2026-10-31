# ADR-0012 — Authenticated Console (Team Back End)

- **Status:** 🟢 Accepted — 2026-10-25 (Phase A built; not deployed)
- **Date raised:** 2026-10-25 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** Phase A in [SCO-198](https://linear.app/scout1/issue/SCO-198) (the daily
  transmit count is its first setting)
- **Answers:** "Which dashboard back end does the shore station push to?"
  ([open questions](../hub/research/open-questions.md)) and SCO-120's "does any part of the
  dashboard move off static?"

---

## Context

SCO-198 needs a person to change the buoy's daily transmit count "from the dashboard". The
dashboard is a static GitHub Pages site with no back end, chosen deliberately: no server to run
or secure, and a public link to hand to NOAA ([live dashboard](../engineering/live-dashboard.md)).
A static page cannot accept a setting without either shipping a secret or routing the change
through someone with repo access.

David also wants a signed-in console for the team: developer settings, API access, settings,
customizable dashboards, downloadable reports, invites, and admin, member and guest roles. A guest
should be able to audit every page and every setting but change nothing.

The repo already runs one Cloudflare Worker ([`chatbot/`](../../chatbot/README.md)) for the same
reason: to keep a secret off the static site.

## Options

| Option | For | Against |
|---|---|---|
| **A. Cloudflare Workers + D1** (chosen) | Same toolchain as `chatbot/`. Free tier. The database never pauses when idle. No server to patch | Free plan: 10 ms of CPU per request, which constrains password hashing (below). SQLite only |
| B. Supabase + static front end | Postgres, built-in auth and row-level security | Free projects pause after a week idle, which would stall the shore's command polling |
| C. Container host (Fly/Render) | Any framework, e.g. a React + SQL app like Catherine's | A server to keep patched and paid for |
| D. Settings file in the repo, changed by PR | Least code. GitHub does the authentication | No in-page control and no roles; needs a GitHub account per user |

## Decision

Decided by David, 2026-10-25:

1. **A separate console on Cloudflare Workers + D1** (`console/`), at its own origin. **The public
   site stays static and unchanged.** It never calls the console and holds no secret. The shore
   station pushes to the console with a per-device token. That answers the open back-end
   question.
2. **Sign-in: GitHub OAuth, Google OAuth, and stored passwords.** Accounts are invite-only. The
   first admin is named by `BOOTSTRAP_ADMIN_EMAIL` and honoured only while there are no users.
   OAuth trusts only verified emails, and an invite accepted through OAuth must match the invited
   email.
   **Amended 2026-10-30 (David): "Sign in as guest".** Anyone can open a view-only guest account
   with just a name and an email, with no invite. Since nothing proves the email, such an account
   never gets a role above guest, sees other people's emails masked (David chose this over the
   invited guest's full view, after being told the full view would show the team's emails to
   anyone), is rate-limited per address, cannot take an email a real account holds, and is taken
   over by an invite or a verified OAuth sign-in for its email ([`console/worker/guests.js`](../../console/worker/guests.js)).
3. **Passwords: PBKDF2-HMAC-SHA256, 100,000 iterations, on the Workers Free plan.** David chose
   this over Workers Paid with argon2id and over passkeys. **Accepted risk:** the count is below
   OWASP's 600,000 for this hash, and the global rule asks for bcrypt or argon2. Correction made
   while building: the option was offered as "the Workers maximum", but local workerd ran 600,000
   and 1,000,000 iterations without error. The 100,000 figure stands as the free-plan CPU choice,
   not as a runtime limit. 100,000 took about 10–11 ms locally, right at the 10 ms free-plan CPU
   limit, so sign-in CPU must be measured on the deployed Worker. The stored hash names its own
   cost, so moving to argon2id or more iterations needs no migration.
4. **Three roles.** Guest sees everything, admin pages included, with the controls disabled.
   Member also changes buoy settings. Admin also manages people and shore-station tokens. The
   server enforces the role on every write.
5. **The console never holds a buoy's command key.** It stores the requested count. The shore
   station signs the radio command with the per-buoy HMAC key (OTA design §5). Taking over the
   console can at worst request a count of 1–3.
6. **Phased.** Phase A ships with SCO-198: login, roles, invites, password resets, audit log,
   fleet settings (the transmit count), shore-station tokens and the device API. Later phases each
   get their own PR: **B** API tokens + REST API + OpenAPI, **C** customizable dashboards, **D**
   downloadable reports (R2), **E** nightly backups and a custom domain.
   **Phase B built 2026-10-30** ([SCO-240](https://linear.app/scout1/issue/SCO-240)): personal API tokens (scoped, always
   expiring, acting with the owner's current role), `/api/v1` with a public OpenAPI file, a
   Readings page and a Developer page.
   **Phase E (backups) built 2026-10-30:** nightly D1 dump to R2 behind self-imposed ceilings well
   under the free tier, since R2 has no hard spending cap (David asked for guardrails against any
   charge). The custom domain waits for a domain.
   **Phase D built 2026-10-30:** CSV reports in R2 behind one-hour links, through the same
   guardrails, and a printable report rendered in the browser (no storage).

7. **Front end: adopt and adapt the COR design system and web app** (David, 2026-10-25, decided
   after Phase A was built). COR is David's csen174 Next.js 16 / React 19 operator console. Its
   rails-and-bays layout, signal meters, layout editor, report composer and team screens map onto
   the console's pages and later phases. It is **recoloured to Tideline** (lagoon teal as the one
   interactive accent, warm stone ground, Tideline's data scales instead of COR's channel colours)
   and **set in the Tideline fonts**. Marketing-specific parts (CRM, attribution, ROAS) are
   dropped, and S.C.O.U.T.'s needs are added: fleet transmit count, guest view-only, shore
   stations, audit log. **Runtime: a static export served by the console Worker**, calling the
   console's JSON API with the session cookie. That keeps the Free plan's 3 MB Worker limit out
   of play, at the cost of turning COR's server actions into client fetches. **Order:** Phase A
   ships first with the server-rendered pages in this PR; the COR front end replaces them in the
   next PR and reuses the back end (auth, D1 schema, roles, device API) unchanged. **Built
   2026-10-26** ([SCO-238](https://linear.app/scout1/issue/SCO-238)): the Worker now serves a JSON API and the export, each page with a
   per-request script nonce (`script-src 'nonce-…' 'strict-dynamic'`); styles allow
   `'unsafe-inline'` because React style props render as attributes. Colour tokens are generated
   from Tideline's (`scripts/export_console_tokens.py`), with WCAG AA checked in both themes.

## Consequences

- One more service to deploy and keep alive. Deploying it needs the account owner: the
  Cloudflare login, D1 creation, the GitHub and Google OAuth apps and the secrets
  ([console README](../../console/README.md#deploy-one-time-needs-the-account-owner)). Claude
  cannot do those steps.
- The static site's "no server" property still holds for the public. Only the team depends on
  the Worker.
- **Open: sign-in CPU on the free plan.** **Measured 2026-10-26 on the live Worker** (`wrangler tail`, 9 sign-ins): **22–96 ms CPU, median 45 ms**, 2–10× the free plan's 10 ms; every one finished (`outcome ok`). Every other request used 0–2 ms. Cloudflare tolerated it, but nothing guarantees
  that; under strict enforcement sign-in would fail while the rest of the console kept working.
  **Decided 2026-10-26 (David): stay on the free plan with PBKDF2 for now and watch it.** The
  sign that it has stopped being tolerated is a sign-in failing with Cloudflare's CPU-limit error
  (1102, `outcome: exceededCpu` in `wrangler tail`). Then the fallback is Workers Paid with
  argon2id ([SCO-239](https://linear.app/scout1/issue/SCO-239)). Email-based password reset needs a sending
  domain, so resets are admin-issued links for now.
- SCO-120 (review Catherine's dashboard) is partly answered: the team console moves off static,
  the public dashboard does not.

## References

- Cloudflare Workers limits (Free 10 ms CPU per request) —
  <https://developers.cloudflare.com/workers/platform/limits/> (read 2026-10-25)
- OWASP Password Storage Cheat Sheet (PBKDF2-HMAC-SHA256 ≥ 600,000) —
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- NIST SP 800-63B §5.1.1 (length over composition rules) — <https://pages.nist.gov/800-63-3/sp800-63b.html>
- [OTA firmware update design](../engineering/ota-firmware-update-design.md) §3 and §5 (command
  frame, HMAC keys)
- [`console/README.md`](../../console/README.md)
