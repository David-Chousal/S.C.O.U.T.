# Design System

> **Summary** — **Tideline**, the S.C.O.U.T. digital design system: brand foundations, voice,
> and every token (colour, type, space, radii, elevation, motion, layout) with computed
> contrast. Components live in [Design System — Components](design-system-components.md);
> chart rules in [Design System — Data Visualization](design-system-data-viz.md).
>
> **Status** — Proposed 2026-10-19. Not yet implemented: `analytics/telemetry/site/theme.py`
> still emits the previous "warm zen" tokens. See the [migration plan](design-system-migration.md),
> [ADR-0009](../decisions/0009-tideline-design-system.md) and the [interactive spec](https://claude.ai/artifact/Tkzy6KmBdBMZ7JnvP5r41C) (private until shared).

---

## Positioning

> **S.C.O.U.T. is a low-cost, open nearshore buoy that gives reef scientists a year of honest
> data — measured carefully, sent sparingly, and published with its gaps showing.**

The sentence deliberately avoids "solar" and "real-time". Neither is true: the power source is
two primary lithium D cells ([ADR-0007](../decisions/0007-primary-cell-power-source.md)), and
the buoy transmits in three fixed slots a day ([`facts.md`](../hub/facts.md)).

## Brand attributes

| Attribute | Is | Is not |
|---|---|---|
| **Precise** | Units on every number, stated uncertainty (±0.5 °C), ISO dates | Clinical, dense, jargon-first |
| **Honest** | Shows gaps, staleness, sample-data banners, what is *not* measured | Apologetic. Limits are stated with confidence |
| **Calm** | Whitespace, one accent, motion that settles instead of performs | Sleepy. Every calm screen still answers "what is the reef doing?" |
| **Engineered** | Real hardware, drawings, part numbers, the data path made visible | Industrial, militaristic, "deep-tech black" |
| **Of the reef** | Science-first: the reef is the subject, the buoy the instrument | Doom imagery, saviour framing, activist tone |

## The concept: Tideline

A tideline is the mark the sea leaves on the sand — a precise record of where the water was. The
system has two layers:

- **The shore** — the sand canvas, reef photography, generous whitespace, DM Sans. Calm.
  Carries the story on Home, Science and About.
- **The instrument** — monospaced readouts, hairline rules, slot counters, coordinates, square
  data plates. Precise. Carries every measured value, everywhere.

**The rule that holds the two together: anything the buoy measured is set in the instrument
layer; anything a person wrote is set in the shore layer.** A reader can tell at a glance which
numbers came off the sensor (`26.4 °C`) and which are design targets ("under $5,000").

### The signature: the slot rule

One graphic device is ownable because it is literally the product: a hairline with **three ticks
per day** at 00:10, 08:10 and 16:10 UTC — the buoy's transmit schedule.

- **On the dashboard** it is data: a tick is filled when that slot's packet arrived and hollow
  when it did not. It runs under every chart and in each Fleet tile, so packet health is
  readable at a glance.
- **On marketing pages** it is the schedule only (all ticks hollow, labelled
  `00:10 · 08:10 · 16:10 UTC`): section dividers, the hero instrument strip's underline. It never
  shows filled ticks without real packets behind them.

Directions considered and rejected (see the [decision log](../hub/decision-log.md)):
**Signal** (hardware-instrument, international orange, all-mono) — its orange accent collides
with the NOAA heat-stress scale, so every button would read as an alert. **Chart Datum**
(nautical cartography, contour lines, serif) — it needs bathymetry for a deployment site that is
not yet chosen; drawing decorative contours would be fabricated data.

## Voice and tone

One voice, four tones.

| Context | Tone | Example |
|---|---|---|
| Hero | Confident, spare. Numbers over adjectives | "A year at sea, three reports a day." |
| Data panel | Exact, terse. Units per [CONVENTIONS](../CONVENTIONS.md#engineering-data) | "Water temperature · 26.4 °C · received 16:10 UTC (slot 3 of 3)" |
| Stale / error | Plain, specific, no blame, no "Oops!" | "No packet since 08:10 UTC — one slot missed. The buoy keeps logging on board; this gap fills when the record is retrieved." |
| Citation | Conventional, complete | The [CONVENTIONS citation block](../CONVENTIONS.md#citing-sources), with a DOI |

Mechanics: sentence case for headings and buttons; micro-labels are the only uppercase text;
no exclamation marks; no "simply", "seamless", "cutting-edge", "revolutionary"; never "real-time".

---

## Token architecture

Three tiers, after Material 3 (`ref → sys → comp`) and GitHub Primer's naming grammar.

| Tier | Prefix | Holds | Example | Who may use it |
|---|---|---|---|---|
| Primitive | `--p-` | Raw values, no meaning | `--p-stone-900`, `--p-lagoon-600` | Only the semantic tier |
| Semantic | `--` | Roles | `--color-text`, `--space-4`, `--dur-settle` | All CSS |
| Component | `--<component>-` | One component's decisions | `--btn-bg-hover`, `--chart-axis` | That component only |

**Name grammar:** `--[component-]<category>-<role>[-<variant>][-<state>]` — e.g.
`--color-text-muted`, `--btn-primary-bg-hover`, `--status-stale-text`.

**Grounds re-point the semantic tier, never the primitives.** The hero (and any future dark
panel) sets `data-ground="night"`, which redefines `--color-*` so every child inverts through the
cascade. This formalises what `.hero` already does today.

**Source of truth:** `analytics/telemetry/site/theme/tokens.py` — plain Python dicts holding
the same tiers (primitives in OKLCH, roles as references to them), from which the theme emits CSS
custom properties. Standard library only. A
[DTCG 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
`tokens.json` export is deferred until a design tool needs it.

---

## Colour

Authored in OKLCH; hex values are the computed sRGB fallback and are what ships in the
`@supports not (color: oklch(0 0 0))` path. Every contrast figure below was computed (WCAG 2
relative luminance; APCA Lc as a secondary check), not estimated. The generator and validator
are committed in PR 2 of the [migration plan](design-system-migration.md) and run in CI.

### Primitives

**Stone** — the warm neutral (hue 65, wet sand).

| Token | OKLCH | Hex |
|---|---|---|
| `--p-stone-0` | `oklch(99.3% 0.004 65)` | `#fffcfa` |
| `--p-stone-50` | `oklch(98.5% 0.005 65)` | `#fdf9f7` |
| `--p-stone-100` | `oklch(96.8% 0.008 65)` | `#f8f3ef` |
| `--p-stone-150` | `oklch(95.2% 0.009 65)` | `#f4eee9` |
| `--p-stone-200` | `oklch(93.0% 0.010 65)` | `#ede7e1` |
| `--p-stone-300` | `oklch(88.0% 0.011 65)` | `#ddd6d0` |
| `--p-stone-400` | `oklch(76.0% 0.012 65)` | `#b7b0a9` |
| `--p-stone-500` | `oklch(60.0% 0.013 65)` | `#867f78` |
| `--p-stone-600` | `oklch(52.0% 0.015 65)` | `#6f6760` |
| `--p-stone-700` | `oklch(42.0% 0.014 65)` | `#534c45` |
| `--p-stone-800` | `oklch(34.0% 0.013 65)` | `#3d3731` |
| `--p-stone-900` | `oklch(27.0% 0.012 65)` | `#2b2520` |

**Lagoon** — the one accent (hue 190, deep-water teal). No data scale uses this hue.

| Token | OKLCH | Hex |
|---|---|---|
| `--p-lagoon-50` | `oklch(96.5% 0.018 190)` | `#e7f8f6` |
| `--p-lagoon-100` | `oklch(93.0% 0.025 190)` | `#d6eeeb` |
| `--p-lagoon-200` | `oklch(86.0% 0.045 190)` | `#b0dbd7` |
| `--p-lagoon-400` | `oklch(64.0% 0.080 190)` | `#4a9c97` |
| `--p-lagoon-500` | `oklch(55.0% 0.080 190)` | `#2c807c` |
| `--p-lagoon-600` | `oklch(47.0% 0.070 190)` | `#1f6763` |
| `--p-lagoon-700` | `oklch(40.0% 0.060 190)` | `#16524f` |
| `--p-lagoon-800` | `oklch(33.0% 0.050 190)` | `#0d3d3b` |

**Abyss and foam** — the night ground under the hero photograph, and text on it.

| Token | OKLCH | Hex |
|---|---|---|
| `--p-abyss-700` | `oklch(33.0% 0.030 230)` | `#253842` |
| `--p-abyss-800` | `oklch(26.0% 0.028 230)` | `#15272f` |
| `--p-abyss-900` | `oklch(20.0% 0.025 230)` | `#09181f` |
| `--p-abyss-950` | `oklch(16.0% 0.020 230)` | `#050f14` |
| `--p-foam-0` | `oklch(98.2% 0.006 75)` | `#fcf9f5` |

### Semantic colour — day ground (default)

| Token | → Primitive | Use |
|---|---|---|
| `--color-canvas` | `stone-100` | Page background |
| `--color-canvas-sunken` | `stone-200` | Code, empty sparkline wells, active mobile-nav row |
| `--color-surface` | `stone-50` | Cards, plates, tables |
| `--color-surface-raised` | `stone-0` | Drawings (white paper), chart plot area |
| `--color-text` | `stone-900` | Headings, body emphasis |
| `--color-text-muted` | `stone-700` | Body prose, leads |
| `--color-text-subtle` | `stone-600` | Labels, captions, axis text, metadata (replaces `--faint`) |
| `--color-line` | `stone-900` at 10% | Decorative dividers only |
| `--color-line-strong` | `stone-500` | Edges of controls (inputs, secondary buttons) — 3:1 |
| `--color-accent` | `lagoon-600` | Links, focus, primary action hover, active nav mark |
| `--color-accent-hover` | `lagoon-700` | Hover on accent fills |
| `--color-accent-tint` | `lagoon-100` | CTA band ground |
| `--color-on-accent` | `stone-0` | Text on accent fills |
| `--color-focus` | `lagoon-600` | 2px focus ring, 3px offset |

### Semantic colour — night ground (`data-ground="night"`)

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `abyss-900` | Hero ground behind the photograph |
| `--color-text` | `foam-0` | Hero title, button labels |
| `--color-text-muted` | `foam-0` at 80% (`#cbccca` on abyss-900) | Eyebrow, expansion line |
| `--color-text-subtle` | `foam-0` at 74% | Secondary hero signals |
| `--color-line-strong` | `foam-0` at 42% | Secondary button edge on the photograph |
| `--color-focus` | `lagoon-200` | Focus ring on night |

On the photograph itself, contrast is carried by the measured scrim in `theme.py`; those stops
are not tokens and must be re-measured if the hero photograph changes.

**Header over the hero — measured, and fixed.** The scrim was tuned for the title, not the
header band. Sampling the top 12% of `hero.jpg` (bright cyan water), today's nav links (foam at
82% over a 0.56 scrim stop) measure **4.48:1 at the 95th-percentile pixel and 3.38:1 at the
brightest** — below AA for 12 px text. Tideline raises the scrim's top stop to 0.62 and the
over-hero nav text to foam at 92%: **6.13 / 5.24 / 4.63** at the 95th, 99th percentile and
brightest pixel.

### Contrast, computed

| Pair | WCAG | APCA Lc | Need | Result |
|---|---|---|---|---|
| text / canvas | 13.73 | 95.3 | 4.5 | Pass (AAA) |
| text-muted / canvas | 7.66 | 82.4 | 4.5 | Pass (AAA) |
| text-subtle / canvas | 5.04 | 71.1 | 4.5 | Pass |
| text-subtle / canvas-sunken | 4.52 | 64.1 | 4.5 | Pass, barely — **not allowed**; use text-muted (6.88) on sunken |
| accent / canvas | 6.00 | 75.7 | 4.5 | Pass |
| accent / accent-tint | 5.44 | 69.4 | 4.5 | Pass |
| on-accent / accent | 6.47 | −85.8 | 4.5 | Pass |
| on-accent / accent-hover | 8.73 | −93.0 | 4.5 | Pass |
| line-strong / canvas (control edge) | 3.58 | 60.2 | 3.0 | Pass |
| line-strong / canvas-sunken | 3.22 | 53.2 | 3.0 | Pass |
| night text / night canvas | 17.22 | −103.2 | 4.5 | Pass (AAA) |
| night text-subtle (74%) / night canvas | 9.69 | −66.3 | 4.5 | Pass |
| focus ring / canvas · / night | 6.00 · 12.01 | — | 3.0 | Pass |

What this fixes from today: `--faint #9c948a` (2.74:1) is retired — every label, axis, caption
and footer heading moves to `text-subtle` (5.04:1). The secondary-button border moves from
`--line-2` (1.36:1, fails WCAG 1.4.11) to `line-strong` (3.58:1).

**Links in prose are underlined** (`text-decoration-thickness: 1px; text-underline-offset:
0.2em`). Accent against body text is only 2.29:1, so colour alone fails WCAG 1.4.1. Nav, buttons
and text-links-with-arrow are recognisable by position and form and stay un-underlined.

### Instrument status

Status describes the *instrument* (is the data fresh?), never the reef. It is deliberately
**quiet** — low chroma — because the reef alert scale is the loud colour on any page. Status is
never colour alone: each state has its own glyph.

| Token | Hex | Glyph | Meaning | Min. contrast (any ground) |
|---|---|---|---|---|
| `--status-live` | `#1b714c` | ● filled dot | Last expected packet arrived | 4.87 |
| `--status-stale` | `#815b1f` | ◐ half dot | 1–2 expected slots missed | 4.96 |
| `--status-offline` | `#655f59` | ○ ring | 3+ slots missed (a full day) | 5.13 |
| `--status-warning` | `#a33e25` | ▲ triangle | Packet arrived with a fault (SoH bit, QC fail, low battery) | 5.23 |

The thresholds are defined in [Data Visualization → Freshness](design-system-data-viz.md#freshness).

**The colour goes on the glyph; the label stays in `--color-text-muted`** (7.66:1, APCA Lc 82).
Status labels are 12 px, where APCA asks for more than WCAG's 4.5:1 — colouring only the glyph
keeps the label comfortably readable while the glyph (≥ 4.87:1) still clears the 3:1 graphic
minimum.

### Data colour

Summarised here; rules, usage and CVD results live in the
[Data Visualization](design-system-data-viz.md) document.

| Family | Source | Tokens |
|---|---|---|
| Variable identity | cmocean, one stop per variable | `--data-temp #b15f82` (3.95:1), `--data-turb #8a5e3a` (5.09:1), `--data-instrument` = `stone-700` |
| Sequential: temperature | cmocean `thermal`, 0.00–0.88 | 7 stops, `#042333` → `#f9c842` |
| Sequential: turbidity | cmocean `turbid`, 0.22–1.00 | 7 stops, `#cdb660` → `#221f1b` |
| Diverging: anomaly | cmocean `balance` | 7 stops, `#181c43` → `#f1eceb` → `#3c0912` |
| Categorical (≤ 5) | Okabe–Ito, re-lit to ≥ 3:1 on canvas | `#0068a7` `#c54a05` `#158561` `#9e497d` `#3292b3` |
| Reef alert (NOAA CRW, 8 levels) | NOAA semantics, monotone lightness | No Stress → Alert Level 5 |

---

## Typography

### Families

| Role | Family | Axes kept | Subset | Size (woff2) |
|---|---|---|---|---|
| Shore — everything a person wrote | **DM Sans** (kept) | `opsz` 9–40, `wght` 300–700 | Latin + punctuation, `°` `±` `µ` `−` `≤` `≥` | 44.5 KB |
| Instrument — everything the buoy measured | **JetBrains Mono** (new) | `wght` 400–600 | Same | 12.9 KB |
| **Total** | | | | **57.4 KB** (today: 62.5 KB for DM Sans Latin alone) |

**Why keep DM Sans.** It is already self-hosted and recognised, and its unused optical-size axis
gives tighter, crisper display type and more open micro-labels for free
(`font-optical-sizing: auto`, widely available since 2020).

**Why add a mono.** Measured on the shipped file and on upstream: DM Sans has **no `tnum`
feature** and proportional digits (`1` is 342 units, `0` is 656), so the five
`font-variant-numeric: tabular-nums` declarations in `theme.py` do nothing and columns of
readings do not align. A monospace guarantees alignment and gives measured values a distinct
voice. JetBrains Mono (SIL OFL) was chosen over Geist Mono (19.2 KB in the same subset, no
italic) and IBM Plex Mono (static weights only) for its size and its unambiguous `0`/`O`,
`1`/`l`.

The current subset also stripped DM Sans' `ss01`, which `body` requests — so that declaration
does nothing today either. The new subset keeps `ss01` and `case`.

Both files use `font-display: swap` plus a metric-matched fallback `@font-face`
(`size-adjust`, `ascent-override`, `descent-override`, computed from the font files) so the swap
causes no layout shift. Only DM Sans Latin is preloaded.

### Scale

Fluid between 360 px and 1440 px viewports. Rem-based, so it respects the reader's font size.

| Token | Value | ≈ px at 360 → 1440 | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| `--text-hero` | `clamp(3rem, 1.6rem + 6vw, 6.4rem)` | 48 → 102 | 500 | 1.0 | 0.06em (wide, set in caps-like display) |
| `--text-display` | `clamp(2.4rem, 1.4rem + 4.2vw, 4.6rem)` | 38 → 74 | 500 | 1.02 | −0.035em |
| `--text-h2` | `clamp(1.6rem, 1.2rem + 1.5vw, 2.3rem)` | 26 → 37 | 500 | 1.1 | −0.02em |
| `--text-h3` | `clamp(1.15rem, 1rem + 0.6vw, 1.4rem)` | 18 → 22 | 500 | 1.25 | −0.01em |
| `--text-lead` | `clamp(1.125rem, 1.02rem + 0.5vw, 1.375rem)` | 18 → 22 | 400 | 1.55 | 0 |
| `--text-body` | `clamp(1rem, 0.97rem + 0.16vw, 1.0625rem)` | 16 → 17 | 400 | 1.65 | 0 |
| `--text-small` | `0.875rem` | 14 | 400 | 1.5 | 0 |
| `--text-micro` | `0.75rem` | 12 | 500 | 1.3 | 0.14em, uppercase |
| `--mono-readout-xl` | `clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)` | 28 → 40 | 500 | 1.05 | −0.02em |
| `--mono-readout` | `0.9375rem` | 15 | 400 | 1.4 | 0 |
| `--mono-axis` | `0.75rem` | 12 | 400 | 1.2 | 0 |

**Weights are three:** 400 (body), 500 (headings, labels, buttons), 600 (`<strong>` only). The
in-between 520 and 560 are retired.

**The 12 px floor.** No text below `--text-micro`. This raises the header nav links (today
0.64 rem ≈ 10 px), the brand subline (0.52 rem ≈ 8 px), and chart axis labels (9 px).

**Wrapping.** `text-wrap: balance` on `h1–h3` and `.lead` (newly available 2024);
`text-wrap: pretty` on prose paragraphs (Chromium and Safari; ignored elsewhere, harmlessly).

### The micro-label

The signature eyebrow: `--text-micro`, weight 500, uppercase, 0.14em tracking,
`--color-text-subtle`, 1.4 rem below. In the instrument layer the same label is set in
JetBrains Mono with 0.08em tracking and may carry a bracketed index: `[02] DATA PATH`.

---

## Space

A 4 px base, ten steps, plus four fluid layout tokens.

| Token | Value | Token | Value |
|---|---|---|---|
| `--space-1` | 4 px | `--space-6` | 32 px |
| `--space-2` | 8 px | `--space-7` | 48 px |
| `--space-3` | 12 px | `--space-8` | 64 px |
| `--space-4` | 16 px | `--space-9` | 96 px |
| `--space-5` | 24 px | `--space-10` | 128 px |

| Fluid token | Value | Use |
|---|---|---|
| `--space-gutter` | `clamp(1.4rem, 0.8rem + 3vw, 4rem)` | Page side padding |
| `--space-stack` | `clamp(2.2rem, 1.5rem + 2.2vw, 3.8rem)` | Between sibling blocks |
| `--space-section-sm` | `clamp(3.4rem, 2.4rem + 4vw, 6rem)` | Compact section padding |
| `--space-section` | `clamp(5rem, 3.4rem + 8vw, 11rem)` | Section padding |

Rule: inline `style="margin-top:…"` in page builders is replaced by a stack utility
(`.stack-3`, `.stack-5`, `.stack-section`) — there are ~53 inline styles today.

## Radii

**Surfaces are square; controls are round.** One rule replaces today's `--radius` (16 px) vs
`--radius-lg` (0) naming confusion.

| Token | Value | Applies to |
|---|---|---|
| `--radius-none` | 0 | Cards, plates, panels, tables, photographs, drawings, chart frames |
| `--radius-xs` | 4 px | Inline code, focus-ring corners, keyboard keys |
| `--radius-pill` | 999 px | Buttons, chips, badges, inputs, carousel arrows, chat |

## Elevation and borders

**Shore surfaces float; instrument surfaces sit flat.** A marketing card lifts on a soft shadow;
a data plate carries a hairline and no shadow, like an instrument face.

| Token | Value | Use |
|---|---|---|
| `--shadow-0` | `none` | Instrument plates |
| `--shadow-1` | `0 12px 32px -22px rgb(43 37 32 / 0.18)` | Cards at rest |
| `--shadow-2` | `0 22px 52px -30px rgb(43 37 32 / 0.26)` | Cards on hover, floating controls |
| `--border-hairline` | `1px solid var(--color-line)` | Dividers, plate edges (decorative) |
| `--border-control` | `1px solid var(--color-line-strong)` | Inputs, secondary buttons (3:1) |

## Layering (z-index)

| Token | Value | Element |
|---|---|---|
| `--z-base` | 0 | Page content |
| `--z-raised` | 1 | Scrims, captions over images |
| `--z-sticky` | 10 | Doc sidebar, sticky split headings |
| `--z-header` | 50 | Site header |
| `--z-overlay` | 60 | Chat panel, mobile chat button |
| `--z-skip` | 100 | Skip link |

## Breakpoints and containers

Five breakpoints replace today's nine (560/600/640/720/760/880/1000/1024/1439).

| Token | Min width | What changes |
|---|---|---|
| `sm` | 560 px | Spec rows go two-column |
| `md` | 720 px | Desktop nav; bento columns; carousel two-up |
| `lg` | 1000 px | Doc sidebar; sticky split; carousel three-up |
| `xl` | 1440 px | Side critter margin (if kept); wide plates |

Media queries cannot read custom properties, so breakpoints are Python constants in `theme.py`,
interpolated into the CSS string. **Components** (stat tile, panel, buoy tile, plate) respond to
their **container** (`container-type: inline-size`) rather than the viewport.

| Container | Max width |
|---|---|
| `--measure` | 64ch (prose) |
| `--container-narrow` | 940 px |
| `--container` | 1140 px |
| `--container-doc` | 1340 px |
| `--container-wide` | 1460 px |

---

## Motion

Motion is **settling, not performing**: things arrive and come to rest. The existing safety
model is unchanged and is part of the system, not an implementation detail.

### Safety model (non-negotiable)

1. Hiding CSS is gated on `html.js-reveal`, set only by the inline head script. No JS → nothing
   hidden.
2. A 4 s watchdog clears `js-reveal` if `reveal.js` never runs.
3. `prefers-reduced-motion: reduce` keeps `.reveal` visible and disables every transition and
   animation listed below except colour changes.
4. Only `transform` and `opacity` animate.
5. Scroll-driven effects sit behind `@supports (animation-timeline: scroll())`, and every `from`
   state is a valid resting state.
6. Cross-document View Transitions need no JavaScript fallback.

### Durations and easing

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 100 ms | Press feedback (`:active` scale) |
| `--dur-quick` | 180 ms | Colour and border on hover/focus |
| `--dur-base` | 280 ms | Menus opening, page-out, chat panel |
| `--dur-settle` | 420 ms | Reveals, page-in, hero and page-head arrival, card lift |
| `--ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | Everything that arrives |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things that leave |
| `linear` | — | Scroll-driven timelines only |

Today one `--dur: 600ms` drives every hover, which makes hovers feel sluggish; colour changes
move to `--dur-quick`.

### Choreography rules

1. **One moving thing per viewport.** No simultaneous reveals of independent elements.
2. **Travel ≤ 14 px, stagger ≤ 70 ms × 3.** Reveals below the fold are fade-only (current
   behaviour, kept).
3. **Arrival finishes inside the page transition.** Any load-time animation must end by
   ~650 ms. The inner-page header rise (today 900 ms + up to 400 ms delay) violates this — it is
   the same defect `theme.py` already documents and fixed for the hero — and moves to
   `--dur-settle`.
4. **Data never animates.** Values do not count up, lines do not draw on, bars do not grow. A
   reading is a reading; animating it implies change that did not happen.
5. **Hover lifts ≤ 4 px.** Image zoom on hover ≤ 1.06.
6. **Nothing loops.** Ambient loops are retired with the Lottie critters (see the
   [performance budget](#performance-budget)).

---

## Performance budget

Targets are stricter than the Core Web Vitals "good" thresholds (LCP ≤ 2.5 s, INP ≤ 200 ms,
CLS ≤ 0.1 at the 75th percentile — [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds))
because the site is static and small enough to beat them comfortably.

**Baseline measured 2026-10-20** on `main` (dc664e9): headless Chrome over CDP, cache disabled,
median of 3 runs, Lighthouse's default mobile throttling (150 ms RTT, 1.6 Mbps down, 4× CPU,
375 × 812 at 2×), served locally without compression — lab numbers, not field data. Full table
in [#191](https://github.com/David-Chousal/S.C.O.U.T./pull/191).

| Metric | Budget | Today (measured or estimated) |
|---|---|---|
| LCP (mobile, 4G) | ≤ 2.0 s | **Home 3.49 s** (fails); inner pages 1.29–1.46 s |
| INP | ≤ 100 ms | Near-zero JS; expected to pass |
| CLS | ≤ 0.05 | 0 on every page except Science (0.012) |
| Fonts | ≤ 60 KB, 2 files, 1 preload | 61 KB per page (DM Sans Latin); 92 KB where Latin Extended also loads |
| CSS (inline, per page) | ≤ 36 KB raw / ≤ 9 KB brotli | 54.5 KB raw |
| JS (first party) | ≤ 15 KB | ~12 KB + **~650 KB Lottie on every page** (168 KB player + 479–527 KB JSON) |
| Hero image | ≤ 120 KB at 1600 w AVIF | 234 KB WebP at 1440 w (upscaled on wide screens) |
| Home page total | ≤ 450 KB | 1033 KB |
| Analytics / Fleet page | ≤ 150 KB, zero images | 794 / 787 KB — over, almost all of it Lottie |

**Image rules.** `<picture>` with AVIF → WebP → JPEG; `srcset` at 640, 960, 1440 and 1920 px
(only up to the source resolution — the hero source is 1440 × 720 and needs a higher-resolution
original); `sizes` on every responsive image; `fetchpriority="high"` and no `loading="lazy"` on
the one LCP image; `width`/`height` always. Measured: the hero at 1440 w is 170 KB AVIF vs
239 KB WebP.

**Lottie is retired.** The footer and side critters cost ~680 KB (a 168 KB player plus 516 KB of
JSON on disk) — more than fonts, CSS and hero combined — load on **every** page including
Analytics and Fleet (measured 2026-10-20), and loop forever. If the team wants one ambient
element, it is redrawn as a single inline SVG with a CSS `transform` animation, under 4 KB,
disabled under reduced motion.

---

## Self-critique and revisions

The system was reviewed twice before proposal — once as a skeptical awards juror, once as an
accessibility auditor. What changed as a result:

| Reviewer | Objection | Revision |
|---|---|---|
| Juror | "Mono eyebrows on sand is every science site in 2026. Where is the moment only S.C.O.U.T. could own?" | Added [the slot rule](#the-signature-the-slot-rule): a motif that *is* the transmit schedule and, on the dashboard, real packet history |
| Juror | "The hero is a stock reef photograph. The product never appears." | Accepted as the largest remaining gap. The hero spec reserves the subject for a real buoy photograph or labelled render; commissioning one is a follow-up, not a CSS change |
| Juror | "DM Sans is a default Google font." | Kept, deliberately: recognisable, already self-hosted, and its unused optical-size axis plus the mono pairing carry the character. A new display face would cost a third font file for little gain |
| Juror | "Restraint is good, but nothing moves." | Kept. Motion that performs would contradict "calm" and "data never animates"; the parallax hero and page transitions remain the only theatre |
| Auditor | Over-hero nav text measured 3.38–4.48:1 on bright water | Scrim top stop 0.56 → 0.62, nav text foam 82% → 92%; worst pixel now 4.63:1 |
| Auditor | 12 px status labels pass WCAG at 4.87:1 but sit at APCA Lc ~66 | Colour moved to the glyph; label text in `text-muted` (Lc 82) |
| Auditor | `text-subtle` on `canvas-sunken` is 4.52:1 — one rounding step from failing | Forbidden pairing; `text-muted` there instead |
| Auditor | Carousel dots are 8 px targets on a 16 px pitch (SC 2.5.8) and misuse `role="tablist"` | 24 × 24 buttons, plain `aria-label="Slide 3 of 9"` |
| Auditor | Categorical deuteranopia separation is ΔE 4.8 | Three or more series must add direct labels and dash patterns |
| Auditor | Prose links distinguished by colour alone (2.29:1 against body) | Prose links underlined |
| Auditor | "HST" appears unexplained in tooltips | First use per page is `<abbr title="Hawaii–Aleutian Standard Time">HST</abbr>` |

## Contradictions surfaced while building this

Recorded, not silently resolved:

1. **NOAA alert scale.** NOAA Coral Reef Watch added Bleaching Alert Levels 3–5 on 2023-12-15
   (Level 2 is now 8 ≤ DHW < 12; Level 3 12–16; Level 4 16–20; Level 5 ≥ 20 —
   [CRW](https://coralreefwatch.noaa.gov/product/5km/index_5km_baa-max-365d.php)).
   `analytics/telemetry/bleaching.py` and `facts.md` stop at Alert Level 2 (DHW ≥ 8). The design
   system reserves colours for all eight levels; whether the pipeline adopts them is a separate
   decision.
2. **Packet cadence in `data-schema.md`.** It still describes "one summary reading per day";
   firmware and `facts.md` say three fixed slots (00:10, 08:10, 16:10 UTC). The site's data-path
   copy ("Once a day…") also predates the change.
3. **Degree sign in CONVENTIONS.** The units table writes `26.4 °C` (space), while the rule
   below says `°` attaches directly. This system uses `26.4 °C` for temperature and attaches `°`
   only to angles; CONVENTIONS should say so explicitly.

## Sources

> Thyng, K. M., Greene, C. A., Hetland, R. D., Zimmerle, H. M., & DiMarco, S. F. (2016). "True
> colors of oceanography: Guidelines for effective and accurate colormap selection."
> *Oceanography*, 29(3):9–13. [https://matplotlib.org/cmocean/](https://matplotlib.org/cmocean/)

> Crameri, F., Shephard, G. E., & Heron, P. J. (2020). "The misuse of colour in science
> communication." *Nature Communications*, 11:5444.
> [https://doi.org/10.1038/s41467-020-19160-7](https://doi.org/10.1038/s41467-020-19160-7)

> Machado, G. M., Oliveira, M. M., & Fernandes, L. A. F. (2009). "A physiologically-based model
> for simulation of color vision deficiency." *IEEE TVCG*, 15(6):1291–1298.
> [https://doi.org/10.1109/TVCG.2009.113](https://doi.org/10.1109/TVCG.2009.113)

- Design Tokens Community Group, *Design Tokens Format* 2025.10 —
  [w3.org/community/design-tokens](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- GitHub Primer, token naming — [primer.style](https://primer.style/foundations/primitives/token-names)
- W3C, WCAG 2.2 — [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/)
- APCA — [git.apcacontrast.com](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- Browser support — [webstatus.dev](https://webstatus.dev/)
