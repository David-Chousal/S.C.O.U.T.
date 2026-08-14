# S.C.O.U.T. Knowledge Hub

> **Summary** — The one always-current, always-cited surface for **what S.C.O.U.T. has decided, what
> it has learned, and where it stands today.** If you have five minutes and one question about
> the project, start here.

The rest of `docs/` holds the deep documents (the EDD, the methodology, the ADRs). The Hub is
the thin layer on top that ties them together and stays current — so the project never drifts
back into the contradictions the August 2026 audit found.

---

## The five surfaces

| Surface | Answers | Open |
|---|---|---|
| ⭐ **Canonical Facts** | What values are true right now? (depth, cost, platform, packet size…) | [`facts.md`](facts.md) |
| **Decision Log** | What have we decided, when, and where is it recorded? | [`decision-log.md`](decision-log.md) |
| **Status** | Where does each subsystem stand today? What's blocking? | [`status.md`](status.md) |
| **State Journal** | Dated history of where the project stood over time | [`journal/`](journal/) |
| **Research Library** | What have we learned from outside, and what backs each claim? | [`research/`](research/sources.md) |

### How they fit with what already exists

The Hub **indexes**, it does not replace:

- [ADRs](../decisions/README.md) remain the deep "why" for significant decisions; the Decision
  Log links to them.
- The [Systems Decision Matrix](../research/systems-decision-matrix.md) remains the forward
  worklist of decisions still to make; the Decision Log is the backward ledger of ones made.
- The deep docs (EDD, methodology, interviews) remain authoritative on their topics; `facts.md`
  just holds the handful of cross-cutting values they must all agree on.

---

## The rule: the Hub updates on every PR

**Every pull request updates the Hub wherever it is relevant — no exception.** This is written
into [CLAUDE.md → Standing rules](../../CLAUDE.md#standing-rules) and enforced as part of the
[PR conventions](../CONVENTIONS.md#pull-requests). Concretely, before a PR is opened, ask:

- Did this PR **decide** anything? → add a row to [`decision-log.md`](decision-log.md) (and an
  ADR if it's significant).
- Did it **change a canonical value**? → update [`facts.md`](facts.md) first, then the docs.
- Did it **move a subsystem's state**? → update [`status.md`](status.md) and append a
  [`journal/`](journal/) snapshot.
- Did it **use or find an external source**? → add it to [`research/sources.md`](research/sources.md)
  (and drop the PDF in the right library).
- Did it **answer or raise a research question**? → update
  [`research/open-questions.md`](research/open-questions.md).

If none apply, the PR says so in its **Open tasks** section ("Hub: no relevant surface"). The
default is that at least one applies.

---

## Roadmap

- **Phase 1 (done):** the five surfaces exist and are seeded from the current docs.
- **Phase 2:** the PR rule is wired into `CLAUDE.md` and `CONVENTIONS.md` (this PR).
- **Phase 3:** [`status.md`](status.md) and the weekly [`journal/`](journal/) snapshot become
  **generated** from `git log` + Linear + the ADR index (a script + a scheduled routine), so
  the state surfaces can't rot.

---

## Notion

Every Hub page mirrors to a Notion **Hub** section like the rest of `docs/`
([CLAUDE.md → Notion conventions](../../CLAUDE.md#notion-conventions)). `facts.md`,
`decision-log.md`, and `research/sources.md` convert cleanly into Notion databases.
