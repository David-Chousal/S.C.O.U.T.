# Site static assets

Everything here is copied verbatim into `<site>/assets/` at build time by
`telemetry/site/build.py`. All same-origin — the published pages never request an external host.

```
static/
├── fonts/        Self-hosted WOFF2 (optional): DM Sans (prose) and JetBrains Mono (measured
│                 values), built by scripts/subset_site_fonts.py. If dmsans-latin.woff2 is
│                 absent the pages fall back to the system sans and mono stacks.
├── stability/    The buoy stability explorer (index.html), embedded on the Technology page. Generated, not
│                 hand-edited: python3 -m telemetry.site.stability_embed <explorer.html> (from analytics/).
├── viewer/       The 3D buoy viewer (index.html + three.min.js, orbit-controls.js, models.js). Generated, not hand-edited:
│                 python3 -m telemetry.site.design_explorer (from analytics/), from mechanical/simulations/buoy-viewer/.
├── design-explorer/  The page the Technology page embeds: one slider that drives the viewer and the stability explorer
│                 together (same command). Its design list comes from mechanical/simulations/buoy-stability/iterations.json.
├── js/embed-fit.js   Fits a data-fit iframe to its content (the design explorer reports its height).
└── img/          Curated reef photographs (optional). A photo appears on a pill card only
                  when the file is here AND its exact credit is recorded in imagery.py
                  (Ocean Image Bank licence: every photographer must be credited).
```

Nothing here is required — the site ships complete with authored inline-SVG atmospheres and
system-font fallbacks. These directories only *upgrade* the result when populated.
