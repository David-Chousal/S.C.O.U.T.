# Console Report Builder Plan

> **Summary** — Research and a proposed design for rebuilding the console's Reports page into
> a report builder: a live, paginated preview that updates as you change anything, a short
> list of report-wide variables (buoys, dates, time zone), prebuilt templates and blocks, and
> direct editing and rearranging on the page itself, before anyone presses **Download PDF**.
> Nothing here is built yet; the open questions at the end need a decision first.
>
> Source: the Reports page on `main` (2026-11-18) ·
> [`console/README.md`](../../console/README.md) ·
> [design system](design-system.md) · [live dashboard](live-dashboard.md)

---

## Where the page is today

The Reports page is one form: tick buoys, pick a UTC date range, tick variables, then either
**Download CSV** (stored in R2 for 2 days) or **Printable report**, which opens a separate
page in a new tab. That page shows, for each buoy, a min/mean/max table and then every reading,
and asks the browser to print it.

What that leaves out:

- **No preview.** You only see the report after you open it in another tab, and changing
  anything means going back and opening it again.
- **One fixed layout.** No charts, no heat-stress or battery sections, no title or notes, no
  way to drop the full readings table that makes a 7-day report run to dozens of pages.
- **No reuse.** The same weekly report has to be set up by hand every time.
- **Variables are mixed in with content.** Buoys and dates sit next to the variable boxes, so
  it is unclear what applies to the whole report and what applies to one section.

## What good report builders do

These patterns recur across the tools reviewed (sources at the end). Each line names
what we take from it.

| Pattern | Seen in | What we take |
|---|---|---|
| Report-wide controls, with a per-section override | Looker Studio, Grafana, Metabase | Buoys, dates and time zone set once at the top; any block may override them |
| Live preview that redraws after every change | Agilent report designer (auto-update), Canva, Typst web app | No "Generate" step; the paper preview is the editor |
| Blocks inserted from a library, rearranged by dragging | Notion, Puck, craft.js, Retool | A left-hand **Insert** panel and drag handles on the page |
| Edit text where it sits | Notion, Google Docs, Canva | Click a heading or note on the page and type |
| Selection drives one inspector panel | Figma, Retool, Looker Studio | One right-hand panel that shows only the selected block's options |
| Several templates for different readers, one default | FastField, Knogin | A template picker on a new report; teams can save their own |
| Merge fields inside text | Mail merge, FastField, Knogin | `{buoy}`, `{from}`, `{to}` and similar inside any text block |
| Real data in the preview, not placeholders | FastField, Knogin | Preview runs against the chosen buoys and dates from the start |
| Outline view for long documents | Google Docs, Word navigation pane | An **Outline** tab that lists blocks and also reorders them |

What the review warned against: an open canvas with absolute positioning (hard to keep
aligned, breaks across pages, no keyboard path), and dozens of formatting knobs per block.
A report is a column of sections that flows onto pages; the builder should keep it that way.

## Proposed layout

Three panes under one toolbar, the same frame as the dashboard's layout editor.

| Area | Holds |
|---|---|
| **Toolbar** | Report title (editable) · the **report variables**: buoys, date range (with 24 h, 7 d, 30 d, custom), time zone (UTC or local) · page size (Letter or A4) and orientation · undo and redo · save state · **CSV** · **Download PDF** (primary) |
| **Left panel**, three tabs | **Templates** (start from one, or replace the current layout after a confirm) · **Blocks** (the library, drag or click to insert) · **Outline** (every block in order, drag to reorder, click to jump) |
| **Centre** | The paper preview: real page frames at the chosen size, page numbers, zoom (fit width, 100 %), updated as you edit |
| **Right panel** | The selected block's options, grouped as **Data** (variables, buoys, range override) and **Display** (title, chart type, columns, show or hide parts). Empty state explains how to select a block |

On a phone the side panels become sheets opened from the toolbar, and the preview fits the
width. Editing on a phone is allowed but not the goal; reviewing and downloading is.

### Variables: report-wide first, override per block

The toolbar variables apply to every block. A block's **Data** section shows them as
inherited (greyed, with "From report") and offers **Override** to set its own buoys or range.
That keeps the common case to one place and still allows a section such as "last 24 hours
at Reef north" inside a weekly fleet report. Overridden blocks carry a small tag on the page in
edit mode so nobody is surprised by them.

## Block library

Every block draws from data the console already has. The first set:

| Block | Shows | Main options |
|---|---|---|
| **Title** | Report name, buoys, period, made-at time, logo | Subtitle text |
| **Text** | Free text with merge fields | Heading level, callout style |
| **Key figures** | A row of stat tiles (latest, min, max, mean) | Variables, which statistic |
| **Time series chart** | One or more variables over the range, per buoy | Variables, one chart or one per buoy, show thresholds |
| **Summary table** | The current min / mean / max table | Variables, statistics |
| **Readings table** | Every reading, the current second table | Variables, sampling (all, hourly, daily), row cap |
| **Heat stress** | MMM, hot spot and degree heating weeks for each buoy | Buoys |
| **Buoy health** | Battery, housing humidity, last heard, settings state | Buoys |
| **Alerts in range** | Alerts that fired in the period | Buoys, severity |
| **Page break** and **Divider** | Layout only | None |

Blocks can be duplicated, hidden from the PDF (kept in the layout but not printed), and
deleted with undo. Charts reuse the dashboard's `plot` and `day-chart` components so the
report and the dashboard always draw a variable the same way.

## Templates

| Template | For | Blocks |
|---|---|---|
| **Weekly field summary** | Team meetings | Title · Key figures · Time series (temperature, turbidity) · Buoy health · Notes |
| **Reef heat stress brief** | Advisors, outreach | Title · Text · Heat stress · Time series (temperature with MMM line) |
| **Data appendix** | Thesis and EDD appendices | Title · Summary table · Readings table (all rows) |
| **One-page status** | Quick share | Title · Key figures · Buoy health, fitted to one page |
| **Blank** | Anything else | Title |

Members can save the current layout as a template for themselves or for the team; admins
can mark a team template as the default. Templates hold layout and options only, never the
data, so they stay small and always show current readings.

## Editing on the page

- **Select** by clicking a block. A thin outline, a drag handle on the left and a small
  toolbar (move up, move down, duplicate, hide in PDF, delete) appear.
- **Rearrange** by dragging the handle or a row in the Outline. Reuse
  [`use-board-drag`](../../console/web/src/components/dashboard/) from the dashboard so the
  drag looks and behaves the same. **Alt + ↑ / ↓** moves the selected block for keyboard users.
- **Insert** by dragging from the Blocks tab to a gap, or by clicking, which adds below the
  selected block. A **+** between blocks on hover opens the same library.
- **Edit text** directly: titles, headings and Text blocks are editable in place; merge
  fields show as chips.
- **Undo and redo** cover every change, with ⌘Z and ⇧⌘Z.
- Edit outlines and handles never appear in the PDF.

## How the preview stays live

- **One report document** in React state: `{ version, title, page, variables, blocks[] }`.
  The preview is a pure function of that document plus fetched data, so any change redraws.
- **Data is fetched per (buoy, range)** and cached, so moving or restyling a block never
  refetches, and changing the range refetches once for all blocks. Fetches are debounced by
  about 300 ms while someone drags the date range.
- **Each block loads on its own**, with a skeleton, so one slow buoy does not hold the page.
- **Pagination** happens in the browser: blocks render in a hidden measuring column, then
  flow onto page frames; a block taller than the space left moves to the next page, and the
  readings table splits by rows with its header repeated. The same CSS (`@page`,
  `break-inside: avoid`) drives the printed PDF, so what you see is what prints.
- **Large ranges** stay usable: the readings table caps at a row count in the preview and
  says how many more rows the PDF and the CSV hold.

## Download PDF

Keep PDF generation in the browser through print, as the current page does. It gives vector
text you can search and copy, needs no new dependency, and costs nothing, which matters
since the console stays on Cloudflare's free plan
([decision 2026-11-16](console-multi-station-and-storage-review.md)).

The catch is that **Download PDF** opens the print dialog with "Save as PDF" rather than
saving a file in one click. Two alternatives were weighed:

| Option | For | Against |
|---|---|---|
| **Browser print** (proposed) | No dependency, vector output, same CSS as the preview | One extra click in the print dialog; output varies a little by browser |
| Client-side PDF library (pdf-lib, react-pdf) | True one-click file | Every block drawn twice (screen and PDF), adds hundreds of KB, charts must be redrawn for it |
| Server PDF (Cloudflare Browser Rendering) | One-click, identical output | Needs the paid Workers plan; against the free-plan decision |

## Saving and sharing

- Reports and templates saved as JSON in D1, next to the dashboard's saved views, with a
  `version` field so old layouts keep opening after blocks change.
- The URL carries the report id and the variables, so a link opens the same report for the
  same period. Guests can open, preview and download; members and admins edit and save.
- Autosave a draft in this browser while editing; saving to the console is explicit.

## Build order

Each step ships on its own PR and leaves the page working.

1. **Split the page** into toolbar, preview and panels; move today's form into the toolbar
   and today's print output into the live preview, as two fixed blocks. No new features.
2. **Report document and block model**, with the Summary table and Readings table as the
   first two blocks; undo and redo.
3. **Inspector and per-block overrides.**
4. **Pagination and page frames**, Letter and A4, PDF through print.
5. **Block library**: Title, Text with merge fields, Key figures, Time series, Heat stress,
   Buoy health, Alerts, Page break.
6. **Drag, Outline and keyboard reordering**, reusing the dashboard drag.
7. **Templates**: the five built-ins, then saving your own and team templates (D1 migration).

## Open questions

- Is the print dialog acceptable for **Download PDF**, or is a one-click file worth a
  client-side PDF library?
- Should saved reports be shared with the whole team by default, or private until shared?
- Do guests (advisors) need to change the variables, or only open reports someone else set up?
- Is a logo or photo block wanted in the first version? It would need image upload to R2.

## Sources

- FastField, *PDF Report Builder* —
  <https://mergemobile.zendesk.com/hc/en-us/articles/360060693811-FastField-PDF-Report-Builder>
- Knogin, *Reporting template builder* —
  <https://knogin.com/en/developers/reporting-template-builder>
- Agilent, *Report Designer: Live Preview* —
  <https://icp-ms.help.agilent.com/en/HowTo/Help/ReportDesigner/Software/report_preview.htm>
- Mewayz, *How to build a custom report builder your team will actually use* —
  <https://mewayz.com/hu/blog/how-to-build-a-custom-report-builder-your-team-will-actually-use>
- The Digital Project Manager, *Best drag and drop report builders* —
  <https://thedigitalprojectmanager.com/tools/best-drag-and-drop-report-builders/>
- Puck, open-source visual editor for React — <https://peerlist.io/puckeditor/project/puck>
- craft.js, page editor framework for React — <https://craft.js.org/examples/landing>
- `@veztraa/report-designer` (React PDF report designer, v0.3, MIT) —
  <https://www.pkgstats.com/pkg:@veztraa/report-designer>
- `react-reportbro-designer` (AGPL-3.0) — <https://npmjs.com/package/react-reportbro-designer>

Libraries were reviewed and not adopted: the young ones have little use behind them,
ReportBro's AGPL licence and server-side Python renderer do not fit, and the console's front
end has no runtime dependencies beyond Next.js and React. The dashboard already has the drag,
bay library and saved views this builder needs.
