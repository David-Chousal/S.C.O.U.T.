"""Layout utilities on the space scale, emitted last so they win over component defaults.

They replace the static inline ``style=""`` attributes the page builders used to carry.
"""

CSS = """
/* ── Utilities ── */
.stack-3{margin-top:var(--space-3)}
.stack-4{margin-top:var(--space-4)}.stack-5{margin-top:var(--space-5)}
.stack-6{margin-top:var(--space-6)}.stack-7{margin-top:var(--space-7)}
.stack-section{margin-top:var(--space-section)}
.align-start{align-items:start}.align-center{align-items:center}
.flush{margin:0}.flush-x{padding-inline:0}
.refs{line-height:1.6}
.ratio-16-9{aspect-ratio:16/9}
.cta-title{max-width:20ch;margin-inline:auto}
.live-band{gap:1.4rem 1.8rem}
.live-note{margin:var(--space-2) 0 0}
/* The About timeline: phase tag, name, window, status chip on one row at every width. */
.spec-row.spec-row-timeline{grid-template-columns:6rem 1fr auto auto;gap:var(--space-4)}
.spec-row-timeline dt{color:var(--color-accent)}
.spec-row-timeline dd:nth-of-type(1){color:var(--color-text)}
.spec-row-timeline dd:nth-of-type(2){text-align:right}
"""
