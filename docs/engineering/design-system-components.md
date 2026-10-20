# Design System — Components

> **Summary** — Every Tideline component: anatomy, variants, all states, and an accessibility
> note. Tokens are defined in [Design System](design-system.md); chart rules in
> [Design System — Data Visualization](design-system-data-viz.md).
>
> **Status** — Proposed 2026-10-19. Class names below are the target names; the migration plan
> maps each one to today's class in `analytics/telemetry/site/`.

---

## Conventions for every component

- **States.** Every interactive component defines rest, hover, focus-visible, active and
  disabled. Data-bearing components also define empty, error and stale. "n/a" means the state
  cannot occur on a static, server-rendered page — it is not an omission.
- **Focus.** `outline: 2px solid var(--color-focus); outline-offset: 3px`. Never removed, never
  replaced by a colour change alone. On night ground the ring is `lagoon-200`.
- **Targets.** Every pointer target is at least 24 × 24 CSS px (WCAG 2.2 SC 2.5.8); primary
  controls are 44 px tall.
- **Press.** `:active` is `transform: scale(0.98)` over `--dur-instant`.
- **Disabled.** Avoided. A disabled control explains nothing; the static site hides an action
  that is unavailable and says why in text. Where unavoidable: `aria-disabled="true"`,
  `--color-text-subtle`, no hover change, still focusable.

---

## Header and navigation

**Anatomy:** brand (mark + wordmark) · primary nav (Home, Technology, Science, Analytics, About) ·
utility row (GitHub, team, Ask). Grid `1fr auto 1fr`; 68 px tall (`--nav-h`), 56 px below `md`.

**Variants:**

| Variant | Ground | Behaviour |
|---|---|---|
| Default | `canvas` at 67% + 16 px backdrop blur | Sticky |
| Over hero (Home) | Transparent; nav text foam at 92% over a 0.62 scrim top stop (worst measured pixel 4.63:1) | `html.at-top` seeded before first paint, kept by an IntersectionObserver sentinel; fades to default once the header leaves the photograph |
| Mobile | Burger toggles a full-width panel | Script-free checkbox; panel fades and drops 8 px |

| State | Treatment |
|---|---|
| Rest | Links `--text-micro` (12 px, was ~10 px), `--color-text-subtle` |
| Hover | `--color-text`, `--dur-quick` |
| Current page | `--color-text` + 1.5 px `--color-accent` underline mark; the mark is a real element so it can carry `view-transition-name` and slide between pages |
| Focus-visible | Focus ring |

**Accessibility.** `<nav aria-label="Primary">`; `aria-current="page"`; the burger `<label>` needs
an accessible name *and* the checkbox needs `aria-controls` plus a visually-hidden label
("Menu"). Focus Not Obscured (SC 2.4.11): every in-page target gets
`scroll-margin-top: calc(var(--nav-h) + var(--space-4))`. The over-hero header's white text is
only legible because the scrim exists; if the scrim changes, re-measure.

## Hero

**Anatomy:** night ground · photograph (cover, static 1.06 framing) · measured scrim · eyebrow ·
title (`--text-hero`) · expansion line ("Santa Clara Oceanic Utilities Transmitter") · button row ·
**instrument strip** (new) · image credit.

**The instrument strip** is Tideline's hero signature: one line of mono under the buttons that
states the instrument's true status — never a fake live feed — underlined by the
[slot rule](design-system.md#the-signature-the-slot-rule).

| Project state | Strip reads |
|---|---|
| No deployed buoy (today) | `PHASE 1 · SUBSYSTEM BRING-UP · BENCH PROTOTYPE` |
| Deployed, data flowing | `SCOUT-01 · ● LIVE · 26.4 °C · RECEIVED 16:10 UTC` |
| Deployed, stale | `SCOUT-01 · ◐ STALE · LAST PACKET 08:10 UTC` |

**Variants:** Home (full viewport, photographic). Inner pages use the page header below, not a
hero.

| State | Treatment |
|---|---|
| Load | Children rise 14 px over `--dur-settle`, 70 ms stagger, gated on `js-reveal` |
| Scroll (supported browsers) | Photograph parallaxes 12% and the body dissolves; static elsewhere |
| Reduced motion | Static composition |

**Accessibility.** The photograph is decorative (`alt=""`) unless it carries information; the
credit is real text, not part of the image. Title is the page's only `h1`. Scrim stops are
re-measured whenever the photograph changes (documented in `theme.py`).

**Future:** when a photograph or render of the actual buoy exists, it replaces the reef as the
hero subject, with the reef behind it — the deep-tech pattern where the real hardware leads and
a spec block follows immediately (see the research brief in the decision log).

## Page header (inner pages)

**Anatomy:** eyebrow · `h1` (`--text-display`, max 16ch) · lead (max 56ch) · optional dashboard
meta row · closing hairline.

States: arrival rise over `--dur-settle` (shortened from 900 ms), otherwise static.

## Buttons and links

| Variant | Rest | Hover | Use |
|---|---|---|---|
| `btn-primary` | `--color-text` fill, `--color-canvas` label | Accent fill, `on-accent` label | One per view |
| `btn-secondary` | Transparent, `--border-control` | Border `--color-text`, lift 2 px | Everything else |
| `btn-ghost` (night) | Transparent, `line-strong` (night) | Foam fill, abyss label | On the hero |
| `textlink` | `--color-text` + arrow | Accent, arrow moves 3 px | "Read more" style |
| Prose link | Accent + 1 px underline | Underline thickens to 2 px | Inline in text |

**Anatomy:** label (sentence case, verb first) · optional trailing icon (1.05em). Height 44 px,
padding `0 var(--space-5)`, `--radius-pill`.

**Labels never wrap** (`white-space: nowrap; max-width: 100%`). A two-line pill reads as broken.
Keep labels to one to three words; where the container is narrower than the label, the button
goes full width (`width: 100%`) instead of breaking the line.

| State | Treatment |
|---|---|
| Focus-visible | Focus ring |
| Active | `scale(0.98)` |
| Disabled | Avoided — see conventions |
| Loading | n/a (no client-side submits except chat; see Chat) |

**Accessibility.** External links state it in text or with a visually-hidden "(opens GitHub)";
icon-only buttons need `aria-label`. Link text names the destination — no "click here".

## Card (shore) and plate (instrument)

Two siblings with one difference: the card floats, the plate sits.

| | Card | Plate |
|---|---|---|
| Ground | `--color-surface` | `--color-surface` |
| Edge | none | `--border-hairline` |
| Shadow | `--shadow-1`, `--shadow-2` on hover | `--shadow-0` |
| Corners | `--radius-none` | `--radius-none` |
| Typography | DM Sans | Kicker and values in JetBrains Mono |
| Hover | Lift 4 px (when the whole card is a link) | none |
| Used for | Feature, team, CTA, figure | Stat tile, panel, chart frame, buoy tile, table |

**Card variants:** `card-feature` (glyph + kicker + title + body), `card-cta` (accent tint ground,
one bold moment per page), `card-ink` (`--color-text` ground — retired; replaced by a
`data-ground="night"` section so the inversion goes through tokens).

**Accessibility.** If the whole card is a link, the `<a>` wraps it and contains no other
interactive element (today's team card already does this). Card headings keep the document
outline (`h3` under a section `h2`).

## Stat tile and KPI

**Anatomy:** label (mono micro) · value (`--mono-readout-xl`) + unit (mono small, subtle) ·
sub-line (context: "daily mean · 2026-10-18") · status glyph when it is a live reading.

| State | Treatment |
|---|---|
| Normal | As above |
| Stale | Value at `--color-text-muted`; sub-line becomes "Last packet 08:10 UTC" with ◐ |
| Empty (no data yet) | Value is an em dash `—`, sub-line "No packets received yet" |
| Error (QC fail) | Value kept, struck through is **not** used; ▲ glyph + "Failed range check" |
| Sample data | Plate shows the sample-data banner above the tile group |

Editorial figures ("< $5,000", "1+ year") use the same layout in DM Sans — the typeface tells
the reader it is a target, not a measurement.

**Accessibility.** Value and unit read as one phrase: `<span aria-label="26.4 degrees Celsius">`
is unnecessary if the unit text is present — keep real text, never an image of a number.

## Sensor readout

The compact, inline form of a reading — in tables, the hero strip, buoy tiles.

**Anatomy:** `[glyph] VARIABLE  value unit  ±uncertainty  · time UTC`.
Example: `● TEMP  26.4 °C ±0.5  · 16:10 UTC`.

Rules: precision never exceeds the sensor (DS18B20 ±0.5 °C → one decimal at most); turbidity is
shown as raw ADC counts with the direction stated (`TURB  612 counts (higher = clearer)`) until an
NTU calibration exists ([SCO-12](https://linear.app/scout1/issue/SCO-12)); battery in V with two
decimals.

## Status badge (instrument) and alert badge (reef)

Two badges that must never be confused.

| | Status badge | Alert badge |
|---|---|---|
| Describes | The instrument's data freshness | The reef's thermal stress (NOAA CRW) |
| Look | Quiet: glyph in the status colour, label in `--color-text-muted`, no fill | Loud: solid fill, label in the computed on-colour |
| Shape | Glyph ● ◐ ○ ▲ | Pill |
| Text | `LIVE`, `STALE`, `OFFLINE`, `FAULT` | `NO STRESS` … `ALERT LEVEL 5` |
| Contrast | ≥ 4.87:1 on every ground | ≥ 4.78:1 label on fill (all eight levels) |

**Accessibility.** Never colour alone — text is always present; glyphs are `aria-hidden` because
the text says the same thing.

## Time-series chart frame

A plate containing: header (title, unit, freshness line) · plot (SVG) · legend (only when two or
more series) · note (QC verdict, caveats) · "View data" disclosure with the underlying table.
Full rules in [Data Visualization](design-system-data-viz.md).

| State | Treatment |
|---|---|
| Normal | Lines broken at gaps, points on real readings |
| Gaps | Hatched band labelled "no packet" |
| Empty | Plot area replaced by a message: "No packets yet. The first will arrive at the next slot (00:10, 08:10 or 16:10 UTC)." |
| Stale | Freshness line in `--status-stale`, ◐ glyph; plot unchanged |
| Error (build-time data failure) | Plate shows "This chart could not be built from the last publish. Showing nothing rather than old data." |

**Accessibility.** `<svg role="img" aria-labelledby="t d">` with a `<title>` and a `<desc>` that
states the trend in words ("Daily mean rose from 26.1 °C to 27.0 °C over 14 days; no gaps").
The data table is the accessible equivalent, not an afterthought.

## Data table

**Anatomy:** caption (what, units, period) · `thead` (mono micro, subtle) · rows · optional
footnote.

Rules: numeric columns are mono, right-aligned, and carry the unit in the header, not in each
cell; text columns left-aligned; row hover tint `--color-canvas` only when rows are links; wide
tables scroll inside a focusable `role="region"` wrapper with an `aria-label`.

| State | Treatment |
|---|---|
| Empty | One full-width row: "No readings in this period" |
| Missing value | En dash `–` with a visually-hidden "no reading" |
| QC flag | Suspect: ◐ after the value; fail: ▲ and the value in `--status-warning` |

## Carousel

Native scroll-snap track; arrows and dots added by `carousel.js`. Works as a swipeable strip
without JavaScript.

| State | Treatment |
|---|---|
| Arrow at start/end | Hidden (`opacity: 0; pointer-events: none`) |
| Dot current | Accent, scale 1.3 |
| Reduced motion | `scroll-behavior: auto` |

**Accessibility fixes required:** dots are 8 px on a 16 px pitch, failing SC 2.5.8 — each dot
becomes a 24 × 24 button with the 8 px dot drawn inside. The `role="tablist"` pattern is wrong
for a carousel without tab panels; dots become plain buttons labelled "Slide 3 of 9".

## Callout

Left rule 2 px accent (`--radius-none` — single-sided borders are never rounded), muted text.

| Variant | Rule colour | Use |
|---|---|---|
| Note | Accent | Context |
| Caveat | `--status-stale` | "Sample data", "estimate, unverified" |
| Contradiction | `--status-warning` | A known disagreement between documents, linked to its record |

## Banner (sample data / site notice)

Plate with mono kicker `SAMPLE DATA` and one sentence. Shown above every dashboard section that
renders synthetic data. Never dismissible — honesty is not a preference.

## Figure — image with caption and credit

**Anatomy:** image (`<picture>`, AVIF → WebP → JPEG) · caption (what and where) · credit
(photographer, licence, link).

Rules: credit is always real text; on photographs it sits at top-right in 12 px with a text
shadow (never smaller); renders are labelled "Render" and photos are photos — never mixed
silently; CAD drawings sit on `--color-surface-raised` with a hairline, as paper.

## Doc navigation (sidebar)

Sticky at `lg+`; a dotted rail with the active section's dot filled in accent. Mono micro labels.
Active state comes from `doc-nav.js`; without JS the links still work.

**Accessibility.** `<nav aria-label="On this page">`; the active link gets
`aria-current="location"` (today only a class).

## Footer

Brand + one-sentence description · two link columns · base row (copyright, program).
Column headings move from `--faint` (2.74:1, fails) to `--color-text-subtle`. The Lottie critters
and seaweed are removed (see the performance budget).

## Chat ("Ask Fred")

Kept as built: centred frosted panel on the night palette, detached input pill. Tideline changes
only tokens: the glass uses `abyss-800` at 74%, chips use `--radius-pill`, the input edge uses
`--border-control`.

| State | Treatment |
|---|---|
| Loading (awaiting reply) | Three-dot typing indicator, `aria-live="polite"` announces "Fred is typing" once |
| Error | "Fred couldn't answer right now. Try again in a minute." — no raw error text |
| Rate-limited | "Fred is answering a lot of questions. Try again in a minute." |

---

## Patterns

### Page templates

| Page | Opens with | Body rhythm | Instrument layer |
|---|---|---|---|
| Home | Photographic hero + instrument strip | Signals (sticky split) → data path → reef carousel → hardware drawings → CTA | Strip, data-path step numbers |
| Technology | Page header | Spec block first (dimensions, mass, power, radio, packet) → subsystems (sticky split) → drawings | Spec block in mono |
| Science | Page header | Methodology → alert scale explainer (all eight NOAA levels) → bioacoustics | Alert table |
| About | Page header | Team → advisors → program | none |
| Analytics (dashboard) | Page header + freshness row | Sample banner → KPI tiles → chart plates → QC notes → data links | Everything |
| Fleet | Page header + network freshness | One buoy tile per `buoy_id`, never blended | Everything |

**Technology's spec block** follows the Vast / Seasats pattern: canonical values from
[`facts.md`](../hub/facts.md) only, same field order every time, each with its source.

### Imagery

1. Reef photographs carry the shore layer; every one has a credit and licence.
2. Hardware is shown as it is — bench photos, CAD drawings, renders labelled as renders. No
   AI-generated imagery, ever.
3. One hero image per page at most. Inner pages use type, not photographs, to open.

### Iconography

Inline SVG only. 24 px grid, 2 px live-area padding, **1.5 px stroke** (today icons mix 1.8 and
2), round caps and joins, `currentColor`, `aria-hidden="true"`. Sizes 16, 20, 24. Icons label
nothing on their own — a text label or `aria-label` is always present.

### Illustration and Lottie

Lottie is retired. Illustration is limited to technical line drawings in the instrument style
(1.5 px stroke, stone ink, one accent highlight) — the data-path diagram, the buoy cross-section.
Decoration that does not explain something is cut.
