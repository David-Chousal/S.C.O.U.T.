# Site static assets

Everything here is copied verbatim into `<site>/assets/` at build time by
`telemetry/site/build.py`. All same-origin — the published pages never request an external host.

```
static/
├── fonts/        Self-hosted WOFF2 (optional). If fraunces.woff2 is present the display
│                 serif is used; otherwise the pages fall back to a system serif stack.
└── img/          Curated reef photographs (optional). A photo appears on a pill card only
                  when the file is here AND its exact credit is recorded in imagery.py
                  (Ocean Image Bank licence: every photographer must be credited).
```

Nothing here is required — the site ships complete with authored inline-SVG atmospheres and a
system-serif fallback. These directories only *upgrade* the result when populated.
