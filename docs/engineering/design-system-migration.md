# Design System Migration

> **Summary** — How the public site and dashboard move from today's "warm zen" CSS to
> [Tideline](design-system.md): the exact token renames, what changes in `theme.py`,
> `components.py` and the dashboard builders, and the order of the pull requests. **A proposal
> awaiting approval — no site code has been changed.**
>
> **Status** — Proposed 2026-10-19.

---

## Principles for the migration

1. **Small steps, each shippable, in one PR.** Every step leaves the site working and
   deployable. Since 2026-10-20 all steps land as commits on **one** pull request,
   [#191](https://github.com/David-Chousal/S.C.O.U.T./pull/191), so the whole migration can be
   audited locally before it merges; work stops for review after each step.
2. **Refactor before redesign.** The first code PR changes no pixels and proves it with a
   byte-identical CSS test, so every later diff is a design change and nothing else.
3. **Old names alias new ones until the last caller moves.** No big-bang rename.
4. **Tests first.** Every PR that changes behaviour adds or extends a test in
   `analytics/telemetry/tests/` before the change (contrast thresholds, gap rendering, freshness
   rules, the no-cross-origin contract that `test_web.py` already enforces).
5. **Measure before and after.** LCP, CLS, total bytes per page and the contrast table are
   recorded before PR 1 and re-measured on every PR that could move them.

## Where the code is today

| File | Lines | Holds |
|---|---|---|
| `site/theme.py` | 944 | Every token and all CSS as one string (`_CSS`), favicon, series names |
| `site/components.py` | 192 | String builders: section, head block, CTA, cards, carousel, stat card, steps, spec, member, table, data path |
| `site/layout.py` | 308 | Document shell, header, footer, head scripts (reveal flag, watchdog, `at-top` seed) |
| `site/assets.py`, `imagery.py`, `drawings.py` | 345 / 210 / 82 | Glyphs, brand SVGs, photo catalogue, CAD gallery |
| `site/pages/*.py` | 7–319 | Home, Technology, Science, About |
| `web.py`, `fleet_web.py` | — | Analytics and Fleet pages, SVG charts |
| `dashboard.py` | — | matplotlib exports (separate Flat UI palette) |

`theme.py` is more than twice the project's 400-line limit, and ~57 inline `style=""` attributes
in page builders bypass it.

---

## Token rename map

From step 2, an old name aliases its new token (`--bg: var(--color-canvas)`) **only where the
value moves by ≤ 3/255 per channel**; every other old name keeps its literal until the step that
changes that role on purpose (accent and `--faint` in step 4, chart and alert colours in step 6).
All old names are deleted in step 5.

### Colour

| Old | Uses | New | Note |
|---|---|---|---|
| `--sand` | 0 | — | Delete (unused alias of `--bg`) |
| `--bg` | 19 | `--color-canvas` | `#f8f4f1` → `#f8f3ef` (≤ 2/255 per channel) |
| `--bg-2` | 0 | — | Delete (unused) |
| `--surface` | 16 | `--color-surface` | `#fcfaf8` → `#fdf9f7` |
| `--surface-2` | 10 | `--color-canvas-sunken` | `#f4f1eb` → `#ede7e1` (slightly deeper, by design) |
| `--ink` | 32 | `--color-text` | |
| `--text` | 1 | `--color-text` | Duplicate of `--ink`; merge |
| `--muted` | 39 | **split:** prose → `--color-text-muted`, labels → `--color-text-subtle` | The one rename that needs a per-use decision; listed per selector in PR 4 |
| `--faint` | 16 | `--color-text-subtle` | 2.74:1 → 5.04:1. Every use is text, so every use moves |
| `--line` | 11 | `--color-line` | |
| `--line-2` | 11 | `--color-line-strong` where it edges a control; `--color-line` otherwise | Button and input edges must reach 3:1 |
| `--accent` | 43 | `--color-accent` | `#1f6f6a` → `#1f6763` |
| `--accent-soft` | 1 | `--color-accent-tint` | |
| `--on-accent` | 4 | `--color-on-accent` | |
| `--coral` | 3 | `--status-warning` (banner emphasis) / `--alert-alert1-fill` (event markers) | Coral no longer exists as a free colour |
| `--ring` | 1 | `--border-hairline` | |
| `--c-temp` | 4 | `--data-temp` | `#c26647` → `#b15f82` (out of the alert hues) |
| `--c-dhw` | 6 | `--color-text` (line) | DHW is drawn in ink over alert bands |
| `--c-turb` | 3 | `--data-turb` | `#2b7d84` → `#8a5e3a` (was the accent hue) |
| `--c-batt` | 2 | `--data-instrument` | Dashed |
| `--a-nostress` … `--a-alert2` | 17 | `--alert-{nostress,watch,warning,alert1…alert5}-fill` and `-on` | Eight levels; badge text from `-on` |

### Type, space, shape, motion

| Old | Uses | New |
|---|---|---|
| `--font` | 5 | `--font-sans` |
| `--font-mono` | 3 | `--font-mono` (now JetBrains Mono first) |
| `--text-hero` … `--text-micro` | 34 | Unchanged names; `--text-body`, `--text-lead` values per the [scale](design-system.md#scale) |
| `--measure` | 1 | Unchanged |
| `--gutter` | 3 | `--space-gutter` |
| `--section` | 2 | `--space-section` |
| `--radius` (16 px) | 4 | `--radius-pill` on controls; `--radius-none` elsewhere |
| `--radius-lg` (0) | 6 | `--radius-none` |
| `--radius-pill` | 4 | Unchanged |
| `--nav-h` | 2 (+3 hard-coded `68px`) | Unchanged name; the three literals use it |
| `--track` | 10 | `--track-micro` (0.18em → 0.14em) |
| `--ease` | 50 | `--ease-settle` |
| `--dur` (600 ms) | 33 | `--dur-quick` for colour/border; `--dur-settle` for transform |
| `--shadow-1`, `--shadow-2` | 16 | Unchanged |
| — | — | New: `--space-1…10`, `--space-stack`, `--z-*`, `--status-*`, `--data-*`, `--cat-1…5`, `--dur-instant`, `--dur-base`, `--ease-standard`, `--ease-exit` |

### Classes

Most class names are kept; only these change.

| Old | New | Why |
|---|---|---|
| `.card-ink` | `<section data-ground="night">` + `.card` | Inversion goes through tokens, like the hero |
| `.big`, `.big-unit` (`stat_card`) | `.stat .val`, `.stat .unit` | One stat-tile component, dashboard and pages |
| `.chip.ok`, `.chip.info` | `.status[data-status]` | Status badge with glyph |
| `.alert-badge` | `.alert[data-level]` | Alert badge with computed on-colour |
| `.card-figure`, `.feature-deep`, `.ribbon`, `.sway`, `.drift` | Defined or removed | Used in markup but never styled today |
| `.footer-critters`, `.footer-seaweed`, `.side-critter` | Removed | Lottie retired |

---

## Steps, in order

Each step below was first planned as its own PR; they now land as commits on
[#191](https://github.com/David-Chousal/S.C.O.U.T./pull/191) (step 0 excepted, which is copy
only). Each step still carries Hub updates, `check_conventions.py`, and an end-to-end site
build, and #191's description logs every step.

### PR 0 — `fix(analytics): say three transmit slots a day, not one`

Copy only, independent of the design system, can ship today. `components.py` `data_path()`,
`technology.py` (lines 11, 68, 181, 189), `about.py` line 70: "once a day" → "three fixed slots a
day (00:10, 08:10, 16:10 UTC)". Also fixes `data-schema.md`'s "one summary reading per day".

### PR 1 — `refactor(analytics): split theme.py into a package without changing its output`

- `site/theme/` package: `base`, `navigation`, `hero`, `content`, `footer`, `dashboard`,
  `motion`, `chat`; `styles()` joins them in today's order. **Done** (commit `d8a6769`).
- **Test first:** snapshot today's `styles()` output and assert the new package returns the
  identical string.
- No visual change, no token change.

### PR 2 — `feat(analytics): add the Tideline token tiers alongside the old names`

- `site/theme/tokens.py`: OKLCH primitives with derived hex, semantic roles, the
  `[data-ground="night"]` block, status, eight alert levels, data and categorical colours,
  space, z-index and motion; hex ships by default and OKLCH layers on under
  `@supports (color: oklch(0 0 0))`. `site/theme/colour.py` holds the maths. **Done** (commit
  `ccdd192`).
- Old names alias new ones only within 3/255 (see the rename map above); visually identical.
- The contrast and CVD validator is **`telemetry/tests/test_tokens.py`**, run by the existing
  CI unit-test job, rather than a separate `scripts/check_tokens.py`.
- Deferred: a DTCG `tokens.json` export. Nothing consumes it yet; add it when a design tool
  does.

### PR 3 — `feat(analytics): self-host DM Sans with optical sizing and add JetBrains Mono`

- Re-subset DM Sans (`opsz` 9–40, `wght` 300–700, keep `ss01` and `case`): core 46.6 KB plus
  a 17.7 KB Latin Extended-A file fetched on demand; add JetBrains Mono (`wght` 400–600)
  13.1 KB; ship its OFL licence next to DM Sans'. **Done** (step 3).
- Metric-matched Arial fallbacks were tried and dropped (they caused the layout shift they
  were meant to prevent); Home alone preloads the core subset. Both decisions are measured in
  the typography section.
- `font-optical-sizing: auto` on `body`.
- A small build script under `scripts/` does the subsetting (fontTools + brotli, dev-only — the
  site still has no runtime dependency).

### PR 4 — `fix(analytics): bring every label, edge and target to WCAG 2.2 AA`

- `--faint` uses → `--color-text-subtle`; `--muted` split per selector (prose vs labels).
- Secondary button and input edges → `--color-line-strong` (3:1).
- Prose links underlined.
- 12 px floor: nav links (0.64 rem), brand subline (0.52 rem), photo credits and team tags
  (0.6 rem). Chart axis text (9 SVG units) moves to step 6: it scales with the chart's
  viewBox, so CSS cannot floor it.
- Header over hero: scrim top stop 0.56 → 0.62, nav text 82% → 92% (measured worst pixel
  3.38:1 → 4.63:1).
- Carousel dots → 24 × 24 buttons with "Slide n of N" labels; drop `role="tablist"`.
- Doc nav: `aria-current="location"`; burger checkbox gets `aria-controls` and a name.
- Alert levels set as text (dashboard stats, drift verdict, Fleet badges) use new
  `--alert-<level>-text` tokens: each NOAA hue darkened until it reads at ≥ 4.6:1, including on
  its own badge tint. Banner emphasis moves from coral to `--status-warning`.
- **Done** (step 4). `telemetry/tests/test_accessibility.py` resolves every `color:` in the
  light-ground CSS through its custom-property chain and fails below 4.5:1, and checks the
  12 px floor, control edges, link underlines, the hero scrim, the carousel and the ARIA.

### PR 5 — `refactor(analytics): adopt Tideline shape, space and motion tokens`

- "Surfaces square, controls round": buttons `--radius-pill`; cards, plates and figures
  `--radius-none`; drawings lose their 16 px corners.
- Spacing scale and `.stack-*` utilities replace the ~57 inline `style=""` attributes.
- `--dur` split into `--dur-quick` (colour) and `--dur-settle` (transform); inner-page header
  arrival 900 ms → 420 ms.
- z-index tokens; nine breakpoints → four (`sm` 560, `md` 720, `lg` 1000, `xl` 1440).
- Instrument plates (`.stat`, `.panel`, `.buoy-tile`, tables) switch from shadow to hairline;
  container queries on them.
- Old token aliases deleted.
- **Done** (step 5), with these measured or deliberate differences from the plan:
  - Every old name is gone except the chart and alert colours (`--c-*`, `--a-*`, `--coral`),
    which step 6 replaces. A test now also fails if a page builder writes a `var(--…)` the
    stylesheet does not declare (step 4's `--faint` removal had left two such inline styles).
  - Spacing rounds to the scale: e.g. 1.2 rem → 16 px, 2.4 rem → 32 px, 2.6–2.8 rem → 48 px;
    reference lists 1.8 → 1.6 line height; the Science split gap uses `--space-section`.
  - Micro-label tracking 0.18 → 0.14 em; heading weights 520/560 → 500 (the wordmark keeps 700).
  - `.buoy-tile` keeps its card styling; it is rebuilt with the slot rule in step 6.
  - Inline CSS grew to 63.7 KB (longer token names, utilities, comments). Minifying at build
    time measures 46 KB raw / ~10 KB gzip; that moves to step 7.
  - Technology on mobile measures CLS 0.061 (budget 0.05): the pre-existing font swap, no longer
    hidden by the 900 ms header fade. Re-measure after step 7 removes Lottie.

### PR 6 — `feat(analytics): draw telemetry honestly — gaps, QC marks, freshness, slot rule`

Split into 6a and 6b if the diff is large.

- **6a, charts:** variable identity colours; lines broken at missing slots with a hatched "no
  packet" band; a point on every packet; hollow suspect and ▲ fail markers (fail excluded from
  the line and daily means); ±0.5 °C band at ≤ 7-day ranges; 12 px mono axes; slot gridlines;
  `<desc>` written from the data; "View data" table under every chart.
- **6b, freshness:** live/stale/offline/fault computed at publish against the 00:10 / 08:10 /
  16:10 UTC schedule; status badges with glyphs; "Published … UTC" on every dashboard page; the
  slot rule under each chart and in each Fleet tile.
- Eight-level alert badge colours (pipeline levels themselves unchanged — see
  [Open decisions](#open-decisions-this-plan-does-not-make)).
- `dashboard.py` adopts the same palette; Flat UI colours removed.
- **Test first:** gaps produce separate path segments; a failed reading never joins a line;
  freshness thresholds at their boundaries; duplicates collapse by `(buoy_id, record_seq)`.

**Done** (step 6, 2026-10-20) as one step, not 6a/6b. Built: `telemetry/charts.py`,
`telemetry/freshness.py`, the estimate rule (see Data Visualization), solid NOAA badge fills on
Fleet tiles, mono figures on dashboard plates, the PNG export on the same palette and calendar,
and all legacy chart colours retired. Not built: per-packet QC markers (the dashboard has daily
values only) and the ±0.5 °C band (meant for ≤ 7-day views, which do not exist yet).

### PR 7 — `perf(analytics): retire Lottie and serve responsive AVIF images`

- Remove `lottie.min.js`, the six JSON files, `init.js`, the critter and seaweed markup and CSS
  (~680 KB).
- `<picture>` AVIF → WebP → JPEG with `srcset` (640/960/1440/1920 up to source resolution) and
  `sizes`; hero AVIF ≤ 120 KB.
- **Needs a higher-resolution hero original** (today's is 1440 × 720).
- Re-measure LCP and page weight against the [budget](design-system.md#performance-budget).

**Done** (step 7, 2026-10-20). Lottie retired (runtime, seven animations, footer seaweed and
critters, side turtles); CSS minified at build and split per page type (`theme.styles(bundle=…)`:
Analytics and Fleet skip the hero and content rules, the authored pages skip the chart rules);
seven never-called builders (`render_slot`, `stat_card`, `buoy_render_svg`, `datapath_svg`,
`hero_waves`, `logo_mark`, `any_photos`) and their CSS removed; the OKLCH layer dropped (every
primitive is in sRGB, so it rendered identically); AVIF for every photograph, hero 117 KB. Width
variants were not built — see the performance budget's image rules. Measured: Home LCP 3.49 →
1.57 s, Home 1033 → 258 KB, Analytics 794 → 137 KB, Technology CLS 0.061 → 0.

### PR 8 — `feat(analytics): add the instrument layer to the public pages`

- Hero instrument strip stating the true phase ("PHASE 1 · SUBSYSTEM BRING-UP · BENCH
  PROTOTYPE"), switching to live status only when real packets exist.
- Slot rule as the section divider on Home and Technology.
- Technology opens with a spec block drawn only from `facts.md`.
- Measured values on all pages set in mono; editorial targets stay in sans.

## Open decisions this plan does not make

| Decision | Owner | Blocks |
|---|---|---|
| Adopt NOAA Alert Levels 3–5 in `bleaching.py` and `facts.md` | David (CSEN) | Nothing in this plan; the colours are reserved either way |
| Commission a real photograph or labelled render of the buoy for the hero | Team | The juror's main objection; PR 8's hero subject |
| Supply a ≥ 2400 px hero original | Team | PR 7 |
| Clarify the degree-sign rule in CONVENTIONS | David | Nothing; PR 0 can include it |

## Verification per PR

```bash
cd analytics && python -m unittest discover -s telemetry/tests -t . -v
```

```bash
python3 .github/scripts/check_conventions.py --base origin/main
```

Then build the site, open Home, Technology, Analytics and Fleet, and compare against the
[interactive spec](https://claude.ai/artifact/Tkzy6KmBdBMZ7JnvP5r41C) at 375 px and 1440 px,
with reduced motion on and off.
