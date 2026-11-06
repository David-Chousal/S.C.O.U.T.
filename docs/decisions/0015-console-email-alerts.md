# ADR-0015 — Opt-In Email Alerts on the Console

- **Status:** ✅ Accepted 2026-11-06 (David specified the design). Built on branch
  `console/email-alerts`; not deployed; D1 migration `0014-email-alerts.sql` not applied remotely.
- **Date raised:** 2026-11-06 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-301](https://linear.app/scout1/issue/SCO-301)
- **Builds on:** [ADR-0014](0014-console-email-delivery.md) (Resend transport, caps, masked audit),
  [ADR-0012](0012-authenticated-console.md) (roles, audit log)

> **Summary** — Each member or admin can turn on email alerts on **Settings → Notifications** and
> build their own rules: a reading crossing a threshold, a firmware flag appearing, or a buoy
> going quiet for N hours, on one buoy or any. Threshold and flag rules are checked when readings
> arrive, after they are stored; silence rules are checked by a new **hourly cron** that does
> nothing else. A rule emails once when it enters breach and re-arms when it clears past a small
> margin, with an optional reminder. Each person gets at most one email per push or cron run,
> only to their own account address, under a per-person cap of 10 a day and a console-wide cap of
> 30, which leaves room for invites inside Resend's 100 a day.

---

## Context

The team wants to hear when a buoy needs attention without watching the console. Email already
works (ADR-0014): Resend's free plan, 100 emails a day for the whole account, shared with
invites and resets (capped at 50 a day). Readings arrive through the device API
(`worker/device.js`); the only cron ran daily at 10:30 UTC (backup and Fred's brief).

## Decision

1. **Rules are personal and opt-in.** No email is sent until a person turns on the master
   switch. A rule has a buoy (one, or any), a kind (`threshold`, `flag`, `silence`), its metric
   or flag, the condition and value in the metric's unit, an optional reminder interval, and an
   on/off switch. Up to 20 rules a person. Everything a person builds they can edit and delete;
   nobody sees or changes anyone else's rules.
2. **Presets take numbers from the repo only.** *Battery low* is the firmware's default conserve
   threshold (3.2 V, `conserve_mv` in `firmware/lib/scout_settings`, via `buoy-config.json`).
   *Housing humidity high* is the firmware's default humidity alert (70 %RH, still a placeholder
   until [SCO-204](https://linear.app/scout1/issue/SCO-204)). *Water temperature above* and *Buoy
   silent* have no canonical number, so their value is left empty and the tab says so.
3. **Only to the account email.** The address is never typed or stored with a rule, so the
   console cannot be used to email strangers. Members and admins can have rules; guests cannot
   (their email is unverified): the server refuses `alerts.write` for guests, and a rule whose
   owner is later made a guest or disabled stops alerting.
4. **Evaluation.**
   - On ingest: against each buoy's newest trusted row in the push. When every row lost its clock
     (`RTC_LOST`), the last one in push order is used, judged by arrival time, as
     `updateReported` does. A late push of rows older than the buoy's newest packet never alerts.
     Missing or non-numeric values are skipped. Disconnected buoys are skipped (their rows are not
     even stored).
   - Hourly: silence rules, against each connected buoy's last packet. Buoys never heard are
     skipped.
   - A rule fires on the **transition into breach**, stays firing until the value clears the line
     by the metric's **margin** (0.05 V for battery, the firmware's own 50 mV gap between power
     tiers; 0.2 °C water, 2 %RH humidity, and similar), and, with a reminder interval, emails
     again while it stays in breach. Editing a rule clears its state. A buoy's state is kept per
     rule (`alert_state`), so an "any buoy" rule tracks each buoy apart.
5. **Never in the shore push's way.** Alerts run after the readings are stored, inside
   `ctx.waitUntil`, and catch everything: an email failure or a failing alert check never changes
   the push reply. Failures log a short code only.
6. **Cron.** `wrangler.toml` now has two triggers: `30 10 * * *` (backup and brief, unchanged) and
   `0 * * * *` (alert checks and nothing else); `scheduled` branches on `event.cron`. The free
   plan allows 5 cron triggers per account; this Worker uses 2.
7. **Batching and caps.** One email per person per push or cron run, listing every alert that
   fired. Caps are 10 alert emails a day per person and 30 console-wide (Worker vars
   `ALERT_DAILY_CAP_PERSON`, `ALERT_DAILY_CAP_TOTAL`), counted from the audit log like ADR-0014's.
   With invites' 50 that is 80 of Resend's 100 a day. A send over a cap is not made; it is
   recorded in the alert history and the audit log, and the Notifications tab shows the count
   and the reason. The test email counts against the same caps.
8. **History.** `alert_history` keeps every alert that fired (sent, failed, capped, or email
   not set up, and why) for 90 days; the tab shows the last 25.
9. **Turning an alert off from the email.** Each alert in an email has its own link, a random
   256-bit token stored only as its SHA-256 hash (like invite and reset links), single-purpose
   (that one rule), single-use, expiring after 30 days. Every email also carries
   `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058) so a mail
   client's own button turns it off with one POST.
   **Change from the brief, with the reason:** the link in the email body opens a page that names
   the alert and turns it off with one key press, instead of turning it off on the GET itself.
   Mail security scanners open links in emails; a GET that changed state would let a scanner
   switch people's alerts off unseen. The one-click path is the RFC 8058 POST, which scanners do
   not send. An email that batches several rules has a `List-Unsubscribe` link that turns that
   person's master switch off (a header carries one link, and must not silently pick one rule).
   "Signed" is met by the hashed random token: it needs no new secret and cannot be forged.
10. **Audit.** Rule create, edit, delete and off-by-link, and the master switch, are audited.
   Each send is audited as `alert.email` with the address masked. Tokens, links, the API key and
   addresses are never logged or audited.
11. **Email design.** Built with `emailHtml` in `worker/mail-layout.js`, the same console-dialog
   card as the invite and reset emails, extended with titled fact groups (one per alert: buoy,
   reading, value with unit, threshold, when in UTC, and its off link). One primary key ("Open
   the buoy", or "Open Fleet" when several buoys), the link repeated in the dashed box, and a
   note on why the email came, with the tab's address. A plain-text part with the same content;
   every value escaped; no images, remote fonts, stylesheets or tracking pixels.

## Consequences

- D1 migration `0014-email-alerts.sql` adds `alert_prefs`, `alert_rules`, `alert_state`,
  `alert_history` and `alert_off_links`. It must be applied before deploy.
- The hourly cron is 24 extra Worker invocations a day, each a few D1 queries; far inside the
  free plan's limits.
- A buoy in breach on every push sends nothing more until it clears, unless its owner asked for
  reminders, so a stuck sensor cannot drain the email budget.
- When an alert is capped it is not retried; the history shows it, and a rule with a reminder
  tries again at the next interval.

## Open

- **Not verified:** a real inbox receiving an alert, and how Gmail and Apple Mail show the
  one-click unsubscribe. Local `wrangler dev` sends to Resend's `delivered@resend.dev` test inbox
  were accepted on 2026-11-06 (a batched email, a single one, a silence alert from the hourly
  cron, and a test email).
- **Not deployed:** migration 0014 and the second cron trigger reach production only with the
  next deploy.
- The hysteresis margins (other than battery) are engineering judgment, not calibrated numbers;
  revisit once real readings show how much each sensor wanders.

## Sources

`resend-send-email-headers`, `cloudflare-multiple-cron-triggers`,
`cloudflare-workers-limits-cron`, `rfc-8058-one-click-unsubscribe` in
[`sources.md`](../hub/research/sources.md).
