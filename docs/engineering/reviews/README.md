# Design Panel Reviews

> **Summary** — Raw design-review PDFs (panel reviews, simulated or human, of a subsystem's
> architecture) paired with a Markdown write-up of the same content. This folder didn't exist
> before 2026-08-21; CONVENTIONS.md's "Documents → Markdown" rule doesn't have a slot for a
> received PDF review artifact, so this is a new, small convention rather than an established
> one — flagged here in case the team wants a different home for it.
>
> Part of [`docs/engineering/`](../). See [CONVENTIONS.md](../../CONVENTIONS.md) for the
> project's general file-placement rules.

---

## Why both a PDF and a Markdown file

The **PDF** is the artifact as delivered — unedited, so its exact wording and formatting is
preserved.

The **Markdown file** is the same content transcribed into the repo's normal document
structure (one H1, GFM tables, Notion-mirrorable) so it's diffable, searchable, and linkable
from the [Knowledge Hub](../../hub/README.md) the way every other doc is. It's an independent
copy, not a summary — nothing in the PDF is left out.

## Naming

`kebab-case-YYYY-MM.pdf` / `.md`, sharing a stem, per CONVENTIONS.md's dated-document pattern.
