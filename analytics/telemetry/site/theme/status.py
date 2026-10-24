"""The instrument status glyph from ``web.status_line``: shared by the dashboard pages and the
Home hero strip, which shows the buoy's live status once real packets exist."""

CSS = """
/* ── Status glyph: the colour is on the glyph; the label stays readable text. ── */
.status{display:inline-flex;align-items:center;gap:0.45rem;font-family:var(--font-mono);
  font-size:var(--text-micro);letter-spacing:0.08em;text-transform:uppercase;
  color:var(--color-text-muted)}
.status svg{width:11px;height:11px;flex:none}
.status-live svg{fill:var(--status-live)}.status-stale svg{fill:var(--status-stale)}
.status-offline svg{fill:var(--status-offline)}.status-fault svg{fill:var(--status-warning)}
.status svg .ring{fill:none;stroke-width:1.5}
.status-stale svg .ring{stroke:var(--status-stale)}.status-offline svg .ring{stroke:var(--status-offline)}
"""
