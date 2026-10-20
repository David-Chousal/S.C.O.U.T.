"""The Analytics and Fleet dashboard: stats, chart panels, series colours, buoy tiles."""

CSS = """/* ══ Analytics dashboard ═══════════════════════════════════════════════════ */
.dash-meta{color:var(--muted);font-size:var(--text-small);display:flex;flex-wrap:wrap;
  gap:0.4rem 1.6rem;font-variant-numeric:tabular-nums}
.dash-meta .k{color:var(--color-text-subtle);text-transform:uppercase;letter-spacing:0.1em;
  font-size:var(--text-micro);margin-right:0.4rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));
  gap:clamp(0.8rem,0.4rem + 0.8vw,1.2rem);margin:0 0 2.4rem}
.stat{background:var(--surface);border-radius:0;padding:1.1rem 1.25rem;
  box-shadow:var(--shadow-1)}
.stat .stat-label{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.08em;
  text-transform:uppercase;font-weight:500}
.stat .stat-value{font-size:1.55rem;font-weight:560;margin:0.4rem 0 0;line-height:1.1;
  letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.stat .stat-sub{color:var(--muted);font-size:var(--text-micro);margin:0.25rem 0 0}
.panels{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,0.6rem + 1vw,1.6rem)}
@media(max-width:760px){.panels{grid-template-columns:1fr}}
.panel{background:var(--surface);border-radius:var(--radius-lg);padding:1.4rem 1.5rem 1.2rem;
  box-shadow:var(--shadow-1);overflow:hidden}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:0.6rem;
  margin-bottom:0.9rem}
.panel-head h3{font-size:1rem;font-weight:560}
.panel-head .unit{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.03em}
.chart{width:100%;height:auto;display:block;overflow:visible}
.chart .ax{fill:var(--color-text-subtle);font-size:9px;font-family:var(--font)}
.chart .grid{stroke:var(--line-2);stroke-width:1}
.s-temp{stroke:var(--c-temp)}.f-temp{fill:var(--c-temp)}
.s-dhw{stroke:var(--c-dhw)}.f-dhw{fill:var(--c-dhw)}
.s-turb{stroke:var(--c-turb)}.f-turb{fill:var(--c-turb)}
.s-batt{stroke:var(--c-batt)}.f-batt{fill:var(--c-batt)}
.rl-mmm{stroke:var(--color-text-subtle)}.tx-mmm{fill:var(--color-text-subtle)}
.rl-threshold{stroke:var(--a-alert1)}.tx-threshold{fill:var(--a-alert1)}
.rl-a1{stroke:var(--a-alert1)}.tx-a1{fill:var(--a-alert1)}
.rl-a2{stroke:var(--a-alert2)}.tx-a2{fill:var(--a-alert2)}
.mk-event{fill:var(--coral)}
.panel-note{margin:0.8rem 0 0;font-size:var(--text-micro);color:var(--color-text-muted);line-height:1.5}
.panel-note .pn-verdict{font-weight:600}
.legend{display:flex;flex-wrap:wrap;gap:0.4rem 1.1rem;margin-top:0.8rem;
  font-size:var(--text-micro);color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:0.4rem}
.legend i{width:0.85rem;height:0.2rem;border-radius:2px;display:inline-block}
/* Alert levels set as text use the text-safe variant of each NOAA hue (≥ 4.6:1). The chart
   lines and legend swatches keep --a-* until the chart rebuild (migration step 6). */
.a-nostress{color:var(--alert-nostress-text)}.a-watch{color:var(--alert-watch-text)}
.a-warning{color:var(--alert-warning-text)}.a-alert1{color:var(--alert-alert1-text)}
.a-alert2{color:var(--alert-alert2-text)}
.data-links{color:var(--muted);font-size:var(--text-small);margin-top:1.8rem}
.data-links a{font-weight:500}

/* Fleet overview — the network view (telemetry.fleet_web) */
.fleet-strip{margin-bottom:clamp(1.6rem,1rem + 2vw,2.6rem)}
.fleet-grid{display:grid;gap:clamp(1rem,0.6rem + 1vw,1.6rem);
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.buoy-tile{display:flex;flex-direction:column;gap:1.1rem;color:inherit}
.buoy-tile:hover{opacity:1}
.buoy-head{display:flex;align-items:center;justify-content:space-between;gap:0.8rem}
.buoy-head h3{font-size:1.15rem;font-weight:560;letter-spacing:-0.01em;color:var(--ink)}
.alert-badge{font-size:var(--text-micro);font-weight:560;letter-spacing:0.05em;
  text-transform:uppercase;white-space:nowrap;padding:0.3rem 0.72rem;border-radius:var(--radius-pill);
  background:color-mix(in srgb,currentColor 12%,var(--surface))}
.spark{width:100%;height:56px;display:block}
.spark-empty{height:56px;border-radius:var(--radius);background:var(--surface-2)}
.tile-stats{display:grid;grid-template-columns:1fr 1fr;gap:0.7rem 1rem;margin:0}
.tile-stats div{display:flex;flex-direction:column;gap:0.15rem}
.tile-stats dt{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.06em;
  text-transform:uppercase}
.tile-stats dd{margin:0;color:var(--ink);font-weight:560;font-size:0.98rem}
.tile-more{margin-top:auto;color:var(--accent);font-size:var(--text-small);font-weight:500}
.buoy-tile:hover .tile-more{color:var(--accent)}

"""
