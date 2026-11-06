# ADR-0014 — Console Invite and Reset Emails Through Cloudflare Email Sending

- **Status:** 🟡 Open — the code is built (branch `console/invite-email`, not deployed); turning
  it on needs a decision only the account owner can make: move the Cloudflare account to
  Workers Paid ($5 a month), or leave email off.
- **Date raised:** 2026-11-06 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-300](https://linear.app/scout1/issue/SCO-300)
- **Builds on:** [ADR-0012](0012-authenticated-console.md) (the console, invites, reset links, audit log)

> **Summary** — The console emails invite and password-reset links from
> **`console@scoutscu.com`** through **Cloudflare Email Sending's Workers binding**. Email only
> adds to the existing flow: the admin still gets the link, and if email is off, refused, or over
> its daily cap, the Team page says so and the admin sends the link by hand. Sending to anyone
> outside the account's verified addresses needs the **Workers Paid plan** (Email Sending is not
> available on Workers Free), so the binding ships switched off.

---

## Context

An admin invites a person on the Team page and copies a one-time link into a chat or an email
by hand; reset links work the same way. That is slow, and a link pasted into a group chat is
easy to forward. The console already runs on Cloudflare, and `scoutscu.com` is a zone in the
same account.

## Options

| Option | For | Against |
|---|---|---|
| **A. Cloudflare Email Sending, Workers binding** (chosen) | Same account and zone; no API key (the binding is the credential, limited to one sender address); Cloudflare adds SPF, DKIM, DMARC and bounce records itself on onboarding | **Not available on Workers Free.** Workers Paid is $5 a month per account, and includes 3,000 emails a month, then $0.35 per 1,000 |
| B. Resend, free plan | Free: 3,000 emails a month, 100 a day, 3 domains | A second vendor and an API key to keep as a secret; DNS records added by hand; next plan $20 a month |
| C. Keep copying links by hand | Free; nothing to set up | The status quo this change is meant to fix |

The console sends a handful of emails a month, so either A or B costs the project nothing in
volume. A keeps everything on one account with no secret; B keeps the account on the free plan.
**A was chosen**, with the link-copy flow kept as the fallback, so the code is useful the day the
plan changes and harmless before it.

## Decision

1. **Provider:** Cloudflare Email Sending through the `send_email` Workers binding (`EMAIL`),
   restricted with `allowed_sender_addresses` to one sender.
2. **Sending address:** `console@scoutscu.com`, display name "S.C.O.U.T. Console". No mailbox is
   needed to send; replies go nowhere unless Email Routing later forwards that address.
3. **Never blocks:** the invite or reset link is created and returned first. The reply's
   `delivery` is `sent`, `failed`, `not_configured` or `rate_limited`, and the Team page shows
   "Email sent to …" or "Couldn't email …; copy the link instead".
4. **Caps:** 20 emails a day (UTC) per admin and 50 a day across the console, as Worker vars
   (`EMAIL_DAILY_CAP_ADMIN`, `EMAIL_DAILY_CAP_TOTAL`), counted from the audit log. Far under the
   plan's 3,000 a month; they stop a runaway script or a stolen admin session from burning the
   sender's reputation.
5. **Secrets and logs:** the link (it carries the token) goes only into the message. A failure
   logs the binding's error code only, never its message, the address or the link. Each attempt
   is audited as `invite.email` or `reset.email` with the address masked (`n***@example.com`).
   There is no API key, so nothing new goes in `wrangler.toml` or in secrets.
6. **Content:** plain text plus a simple HTML part with inline styles only: no images, remote
   fonts, stylesheets or tracking pixels.
7. **Binding off until set up.** On 2026-11-06 Cloudflare's API refused a Worker carrying the
   `send_email` binding (`wrangler dev`'s remote preview, error 10013, reproduced twice; the same
   config without it started). A deploy would likely fail the same way, so the binding is
   committed commented out, and the [console README's email runbook](../../console/README.md#email-invites-and-reset-links-one-time-needs-the-account-owner)
   says when to turn it on.

## Consequences

- Until the account owner upgrades and onboards the domain, nothing changes for admins except a
  note on the Team page saying email isn't set up.
- Upgrading to Workers Paid also lifts the 10 ms CPU limit that ADR-0012 accepted as a risk for
  password hashing, so the plan question is shared with [SCO-239](https://linear.app/scout1/issue/SCO-239).
- Onboarding adds records under `cf-bounce.scoutscu.com` and a DMARC record at
  `_dmarc.scoutscu.com`. GitHub Pages serves `scoutscu.com` from the same zone; these records do
  not touch its `A`/`CNAME` records.

## Open

- **Workers Paid or not** (account owner). If not, option B is the fallback plan: a Resend API
  key as a Worker secret behind the same `sendLinkEmail` function.
- **Not verified:** a real send. `wrangler dev` simulates the binding locally (the message is
  written to `.wrangler/tmp/email/`); no email has left Cloudflare, and the edge has not yet
  accepted the binding.

## Sources

`cloudflare-email-pricing`, `cloudflare-email-limits`, `cloudflare-email-get-started`,
`cloudflare-workers-pricing`, `resend-pricing` in
[`sources.md`](../hub/research/sources.md).
