# ADR-0009 — Tideline Design System for the Public Site and Dashboard

- **Status:** 🟡 Open — proposed 2026-10-19; direction chosen by David, migration not yet approved
- **Date raised:** 2026-10-19
- **Owners:** CS lead (David Chousal Cantu)
- **Blocks:** the eight migration PRs in
  [Design System Migration](../engineering/design-system-migration.md)

---

## Context

The public site and telemetry dashboard (`analytics/telemetry/site/`, `web.py`, `fleet_web.py`)
grew one feature at a time under a "warm zen · beachy · oceanic minimalism" direction. An audit
on 2026-10-19 found it calm and safe in its motion model, but:

- **Accessibility failures, computed:** the `--faint` text colour used for labels, axes and
  footer headings is 2.74:1 on the canvas; two alert badges are 2.27:1 and 2.93:1; secondary
  button edges are 1.36:1; the header over the hero drops to 3.38:1 on bright water; carousel
  dots are 8 px targets.
- **Tabular figures never worked:** DM Sans has no `tnum` feature, so the five
  `tabular-nums` declarations do nothing.
- **No data honesty rules:** charts interpolate across missing packets, there are no
  freshness states, and the matplotlib exports use a separate palette.
- **Weight:** ~680 KB of Lottie animation, more than fonts, CSS and hero image combined.
- **Identity:** the engineering is described in copy but invisible in the visual language.

A system was needed that keeps the existing constraints — no runtime external requests,
light-only sand canvas, transform/opacity motion behind `html.js-reveal` with a 4 s watchdog and
full reduced-motion support, script-free cross-document View Transitions, CSS emitted from
Python — and fixes the above.

## Options

### Option A — Tideline: warm zen, evolved (chosen)

The sand canvas and reef photography stay (the *shore* layer, DM Sans); a precise *instrument*
layer is added for everything the buoy measured (JetBrains Mono, hairline plates, slot counters).
Lagoon teal is the only accent.

**Pros**
- Keeps every hard-won piece of the current site: the measured hero scrim, the motion safety
  model, light-only canvas.
- Teal is the one hue no data scale uses, so the accent never reads as an alert.
- Cheapest in bytes: 59.7 KB of fonts per page (measured after step 3), less than the 61–92 KB
  shipped before.

**Cons**
- The least visually surprising of the three; its distinctiveness rests on the instrument layer
  and the slot-rule motif being executed well.

### Option B — Signal: the hardware instrument

Bone white, black, international orange, visible grid, square corners, mono everywhere.

**Pros**
- Instantly reads as engineering.

**Cons**
- Orange is the colour of the NOAA heat-stress scale; every call to action would read as an
  alert in a coral-bleaching product.
- Abandons the calm the reef story needs.

### Option C — Chart Datum: nautical cartography

Buff and shoal-blue chart tints, contour lines, navy serif, magenta features.

**Pros**
- Strong sense of place; scholarly.

**Cons**
- Its signature (contour lines) needs bathymetry for a deployment site that is not chosen
  ([SCO-164](https://linear.app/scout1/issue/SCO-164)); decorative contours would be invented
  data.
- Three font families (~90 KB).

## Decision

Adopt **Tideline** as specified in [Design System](../engineering/design-system.md),
[Components](../engineering/design-system-components.md) and
[Data Visualization](../engineering/design-system-data-viz.md):

- Three token tiers (primitive → semantic → component) in DTCG 2025.10 shape, emitted by
  `theme.py`; OKLCH with hex fallbacks.
- Every text pairing ≥ 4.5:1, enforced by a CI check rather than by eye.
- Measured values in JetBrains Mono, prose in DM Sans with optical sizing.
- Charts break at missing packets, mark QC flags, and state freshness against the three-slot
  schedule; cmocean scales for fields; the NOAA alert scale through Level 5.
- Lottie retired; responsive AVIF images.

The direction was chosen by David on 2026-10-19. **The migration itself stays open** until the
plan is approved; the ADR moves to Accepted when PR 1 merges.

## Consequences

- Eight PRs, in the order the migration plan gives, starting with a byte-identical refactor of
  `theme.py` into a package (it is 944 lines against a 400-line limit).
- `--muted` is split by role, which is the one rename needing per-selector judgement.
- The pipeline still stops at NOAA Alert Level 2; adopting Levels 3–5 in `bleaching.py` is a
  separate decision this ADR does not make. *(Update 2026-10-23: adopted, [SCO-212](https://linear.app/scout1/issue/SCO-212).)*
- The hero keeps a stock reef photograph until a real photograph or labelled render of the buoy
  exists; that is the largest remaining gap in the system's own self-critique.

## References

- [Design System](../engineering/design-system.md) — foundations, tokens, research and critique
- [Interactive spec](https://claude.ai/artifact/Tkzy6KmBdBMZ7JnvP5r41C) — private until shared
- [Design System Migration](../engineering/design-system-migration.md)
