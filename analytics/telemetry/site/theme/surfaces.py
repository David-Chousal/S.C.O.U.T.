"""Surfaces shared by every page type: cards, stat tiles, the data table, alert text.

The content and dashboard bundles both use these, so they ship on every page (see
``theme.styles``).
"""

CSS = """
/* ── Shared surfaces ── */
.card{height:100%;background:var(--color-surface);border-radius:var(--radius-none);
  padding:clamp(1.5rem,1.1rem + 1.2vw,2.2rem);box-shadow:var(--shadow-1);
  transition:transform var(--dur-settle) var(--ease-settle),box-shadow var(--dur-settle) var(--ease-settle)}
.card.hoverable:hover{transform:translateY(-4px);box-shadow:var(--shadow-2)}
.card h3{margin-bottom:0.5rem}
.card p{color:var(--color-text-muted);margin-bottom:0}
.card .kicker{font-size:var(--text-micro);letter-spacing:var(--track-micro);text-transform:uppercase;
  color:var(--color-text-subtle);font-weight:500;margin-bottom:1.1rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));
  gap:clamp(0.8rem,0.4rem + 0.8vw,1.2rem);margin:0 0 2.4rem}
/* Instrument plates sit flat on a hairline; marketing cards float on a shadow. */
.stat{background:var(--color-surface);border-radius:var(--radius-none);padding:1.1rem 1.25rem;
  border:var(--border-hairline);box-shadow:var(--shadow-0);container-type:inline-size}
.stat .stat-label{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.08em;
  text-transform:uppercase;font-weight:500}
.stat .stat-value{font-family:var(--font-mono);font-size:1.55rem;font-weight:500;margin:0.4rem 0 0;line-height:1.1;
  letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.stat .stat-sub{color:var(--color-text-subtle);font-size:var(--text-micro);margin:0.25rem 0 0}
.table-scroll{overflow-x:auto;border-radius:var(--radius-none);border:var(--border-hairline);
  box-shadow:var(--shadow-0);
  background:var(--color-surface);-webkit-overflow-scrolling:touch}
table.data{border-collapse:collapse;width:100%;min-width:520px;font-size:0.94rem}
table.data caption{text-align:left;padding:1rem 1.2rem 0;color:var(--color-text-subtle);
  font-size:var(--text-small)}
table.data th,table.data td{padding:0.8rem 1.2rem;text-align:left;border-bottom:1px solid var(--color-line)}
table.data thead th{color:var(--color-text-subtle);font-weight:500;font-size:var(--text-micro);
  letter-spacing:0.08em;text-transform:uppercase}
table.data tbody tr:last-child td{border-bottom:0}
table.data .num{text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums}
table.data .lvl{font-weight:500;color:var(--color-text)}
/* Alert levels set as text use the text-safe variant of each NOAA hue (≥ 4.6:1). */
.a-nostress{color:var(--alert-nostress-text)}.a-watch{color:var(--alert-watch-text)}
.a-warning{color:var(--alert-warning-text)}.a-alert1{color:var(--alert-alert1-text)}
.a-alert2{color:var(--alert-alert2-text)}
"""
