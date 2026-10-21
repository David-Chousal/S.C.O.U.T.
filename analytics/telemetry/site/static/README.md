# Site static assets

Everything here is copied verbatim into `<site>/assets/` at build time by
`telemetry/site/build.py`. All same-origin — the published pages never request an external host.

```
static/
├── fonts/        Self-hosted WOFF2 (optional): DM Sans (prose) and JetBrains Mono (measured
│                 values), built by scripts/subset_site_fonts.py. If dmsans-latin.woff2 is
│                 absent the pages fall back to the system sans and mono stacks.
└── img/          Curated reef photographs (optional). A photo appears on a pill card only
                  when the file is here AND its exact credit is recorded in imagery.py
                  (Ocean Image Bank licence: every photographer must be credited).
```

Nothing here is required — the site ships complete with authored inline-SVG atmospheres and
system-font fallbacks. These directories only *upgrade* the result when populated.
