# Live Dashboard (GitHub Pages)

> **Summary** — How SCOUT's telemetry becomes a public, always-current web dashboard with **no
> server**: the shore Raspberry Pi regenerates a self-contained static page on a schedule and
> pushes it; GitHub Pages serves it. Implementation:
> [`analytics/telemetry/web.py`](../../analytics/telemetry/web.py).

---

## Why static, not a live server

The buoy transmits **one summarized packet per day** ([EDD §10](engineering-design-document.md)).
"Live" therefore means *republished when new data lands* — hourly is already far finer than the
data changes. That makes a **static site** the right tool:

- **No server, no infra, free, public.** GitHub Pages just serves files. Nothing to keep
  running, nothing to secure, and the link is shareable with NOAA/stakeholders.
- **The page is fully self-contained** — inline CSS and inline SVG charts, no external scripts,
  fonts, or network requests. It renders offline and passes any content-security policy.

A live backend (Flask/FastAPI on the Pi, or a cloud host) would only be worth it for
sub-daily, interactive, or multi-user-write use cases — out of scope for a daily packet.

## The publish loop

```
buoy ──LoRa──► shore Pi
                 │  1. shore receiver writes daily CSVs   (shore/, data-schema.md)
                 │  2. telemetry pipeline regenerates the static site
                 │       python analytics/run_telemetry.py \
                 │           --source <shore-csv-dir> --mmm <site MMM> --web site/
                 │  3. git add site/ && git commit && git push
                 ▼
        GitHub Pages serves site/  ──►  https://david-chousal.github.io/S.C.O.U.T./
```

The receiver ([`shore/`](../../shore)) and the telemetry pipeline
([`analytics/telemetry/`](../../analytics/telemetry)) connect through the shared
[CSV schema](data-schema.md) — the shore station writes it, the pipeline reads it. `write_site`
emits `index.html` plus the raw `telemetry_daily.csv` and `telemetry_summary.json` (linked from
the page for download).

### Scheduling on the Pi

A cron entry regenerates and publishes on whatever cadence you want (hourly shown):

```cron
0 * * * *  cd /home/pi/scout && python analytics/run_telemetry.py \
             --source shore/data --mmm 27.6 --web site && \
             git -C site add -A && git -C site commit -m "data: refresh dashboard" && \
             git -C site push
```

(Point `--mmm` at the site's NOAA CRW Maximum Monthly Mean — see
[telemetry methodology](../analysis/telemetry-methodology.md).)

## Enabling GitHub Pages (one-time, repo admin)

Pages is an **admin-only** repo setting. The owner enables it once:

- **Settings → Pages → Build and deployment.** Either:
  - **Deploy from a branch** — publish a `gh-pages` branch (or `/docs`) and push the generated
    site there; or
  - **GitHub Actions** — a workflow that runs the pipeline and deploys the artifact.
- Publishing the generated site to its **own branch/repo** (rather than committing `site/` onto
  `main`) keeps regenerated HTML out of the source history.

Until Pages is enabled, the exact same `index.html` opens directly in any browser — the site
does not depend on being hosted.

## Notes

- **Never commit the raw audio or large data** into the published site (see
  [CONVENTIONS.md](../CONVENTIONS.md)); the dashboard carries only summarized telemetry.
- The page is **theme-aware** (light/dark) and responsive.
- Data provenance and the science behind every panel:
  [Environmental Telemetry Methodology](../analysis/telemetry-methodology.md).
