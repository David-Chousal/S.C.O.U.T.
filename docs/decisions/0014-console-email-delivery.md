# ADR-0014 — Console Invite and Reset Emails Through Resend's Free Plan

- **Status:** ✅ Accepted 2026-11-06 (David chose Resend so the account stays on Workers Free).
  Built on branch `console/invite-email`; not deployed. `scoutscu.com` verified in Resend and
  a local send accepted on 2026-11-06.
- **Date raised:** 2026-11-06 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-300](https://linear.app/scout1/issue/SCO-300)
- **Builds on:** [ADR-0012](0012-authenticated-console.md) (the console, invites, reset links, audit log)

> **Summary** — The console emails invite and password-reset links from
> **`console@scoutscu.com`** through **Resend's free plan** (3,000 emails a month, 100 a day),
> called from the Worker with a send-only API key kept as a Worker secret. Email only adds to the
> existing flow: the admin still gets the link, and if email is off, refused, or over its daily
> cap, the Team page says so and the admin sends the link by hand. Cloudflare's own Email Sending
> was the first choice but needs Workers Paid; its binding stays in the code, switched off.

---

## Context

An admin invites a person on the Team page and copies a one-time link into a chat or an email
by hand; reset links work the same way. That is slow, and a link pasted into a group chat is
easy to forward. The console already runs on Cloudflare's free plan, and `scoutscu.com` is a
zone in the same account.

## Options

| Option | For | Against |
|---|---|---|
| A. Cloudflare Email Sending, Workers binding | Same account and zone; no API key (the binding is the credential); Cloudflare adds SPF, DKIM, DMARC and bounce records itself | **Not available on Workers Free.** Workers Paid is $5 a month per account (3,000 emails included, then $0.35 per 1,000). On 2026-11-06 Cloudflare also refused a Worker carrying the binding on this account |
| **B. Resend, free plan** (chosen) | Free: 3,000 emails a month, 100 a day, 3 domains. A plain HTTPS API, so it works from the Worker on the free plan | A second vendor and an API key to keep as a secret; DNS records added by hand; next plan $20 a month |
| C. Keep copying links by hand | Free; nothing to set up | The status quo this change is meant to fix |

The console sends a handful of emails a month, so the free limits never bind. A was built first;
when it turned out to need Workers Paid, David asked for a free route and set up Resend.

## Decision

1. **Provider:** Resend's `POST /emails` API, with `RESEND_API_KEY` as a Worker secret (locally
   in the git-ignored `.dev.vars`). The key is **send-only**, so a leak cannot read or change
   the Resend account. The Cloudflare binding (`EMAIL`) remains as a second transport and is
   used only when no Resend key is set; it is commented out in `wrangler.toml`.
2. **Sending address:** `console@scoutscu.com`, display name "S.C.O.U.T. Console". No mailbox is
   needed to send; replies go nowhere unless that address is later forwarded.
3. **Never blocks:** the invite or reset link is created and returned first. The reply's
   `delivery` is `sent`, `failed`, `not_configured` or `rate_limited`, and the Team page shows
   "Email sent to …" or "Couldn't email …; copy the link instead".
4. **Caps:** 20 emails a day (UTC) per admin and 50 a day across the console, as Worker vars
   (`EMAIL_DAILY_CAP_ADMIN`, `EMAIL_DAILY_CAP_TOTAL`), counted from the audit log. Under Resend's
   100 a day; they stop a runaway script or a stolen admin session from burning the sender's
   reputation.
5. **Secrets and logs:** the link (it carries the token) goes only into the message. A failure
   logs a short code only (`resend_<status>_<name>`, or the binding's `E_*` code), never the
   provider's message, the address, the link or the key. Each attempt is audited as
   `invite.email` or `reset.email` with the address masked (`n***@example.com`).
6. **Content:** plain text plus a simple HTML part with inline styles only: no images, remote
   fonts, stylesheets or tracking pixels.

## Consequences

- With no key set, nothing changes for admins except a note on the Team page saying email isn't
  set up.
- `wrangler dev` with the key in `.dev.vars` sends real email; local tests use Resend's
  `delivered@resend.dev` test inbox.
- The DNS records Resend needs sit under `resend._domainkey` and `send` (its bounce subdomain),
  so the apex's records and GitHub Pages are untouched.
- The key was first shared in a Claude session's chat on 2026-11-06; rotating it once email works
  keeps it out of any transcript.

## Open

- **Not verified:** a real inbox receiving the email and its SPF and DKIM results. On 2026-11-06
  a send from local `wrangler dev` to Resend's `delivered@resend.dev` test inbox was accepted.
- **DMARC is strict:** `scoutscu.com` already publishes `p=reject` with strict alignment
  (`adkim=s; aspf=s`). Resend's DKIM signs as `scoutscu.com`, so DMARC should pass on DKIM alone
  (SPF aligns only with the `send` subdomain); check this with the first real email.

## Sources

`resend-pricing`, `resend-send-email`, `cloudflare-email-pricing`, `cloudflare-email-limits`,
`cloudflare-email-get-started`, `cloudflare-workers-pricing` in
[`sources.md`](../hub/research/sources.md).
