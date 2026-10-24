"""The Analytics and Fleet dashboard: stats, chart panels, series colours, buoy tiles."""

CSS = """/* ══ Analytics dashboard ═══════════════════════════════════════════════════ */
.dash-meta{color:var(--color-text-subtle);font-size:var(--text-small);display:flex;flex-wrap:wrap;
  gap:0.4rem 1.6rem;font-variant-numeric:tabular-nums}
.dash-meta .k{color:var(--color-text-subtle);text-transform:uppercase;letter-spacing:0.1em;
  font-size:var(--text-micro);margin-right:0.4rem}
.panels{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,0.6rem + 1vw,1.6rem)}
@media(max-width:720px){.panels{grid-template-columns:1fr}}
.panel{background:var(--color-surface);border-radius:var(--radius-none);padding:1.4rem 1.5rem 1.2rem;
  border:var(--border-hairline);box-shadow:var(--shadow-0);overflow:hidden;container-type:inline-size}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:0.6rem;
  margin-bottom:0.9rem}
.panel-head h3{font-size:1rem;font-weight:500}
.panel-head .unit{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.03em}
/* Charts (telemetry/charts.py): the SVG holds geometry only and stretches to the panel, so
   strokes and dots use non-scaling strokes and every label is HTML at real pixels. */
/* One column that may shrink below its content: an open data table scrolls inside it rather
   than widening the chart past the panel. */
.chart-frame{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-2)}
.chart-plot{position:relative;height:180px;margin-left:3.25rem;background:var(--color-surface-raised)}
.chart-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.chart-svg *{vector-effect:non-scaling-stroke}
.chart-svg .grid{stroke:var(--color-line);stroke-width:1}
.chart-svg .line{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.chart-svg .est{fill:none;stroke-width:1.5;stroke-dasharray:5 4;opacity:0.75}
.chart-svg .pt,.chart-svg .pt-dot{fill:none;stroke-width:5;stroke-linecap:round}
.chart-svg .pt-dot{stroke-width:0}
.chart-svg .pt-last{fill:none;stroke-width:7;stroke-linecap:round}
.chart-svg .ev{fill:none;stroke:var(--status-warning);stroke-width:9;stroke-linecap:round}
.chart-svg .rl{stroke-width:1;stroke-dasharray:4 3}
.s-temp{stroke:var(--data-temp)}.s-turb{stroke:var(--data-turb)}.s-dhw{stroke:var(--color-text)}
.s-batt{stroke:var(--data-instrument)}.chart-svg .line.s-batt{stroke-dasharray:6 3}
.rl-mmm{stroke:var(--color-line-strong)}.rl-threshold{stroke:var(--alert-alert1-fill)}
.band{opacity:0.16}.band-alert1{fill:var(--alert-alert1-fill)}.band-alert2{fill:var(--alert-alert2-fill)}
.band-alert3{fill:var(--alert-alert3-fill)}.band-alert4{fill:var(--alert-alert4-fill)}.band-alert5{fill:var(--alert-alert5-fill)}
/* Missing days: a hatched band, crisp because it is HTML rather than stretched SVG. */
.gap{position:absolute;top:0;bottom:0;left:var(--x0);right:calc(100% - var(--x1));
  background:repeating-linear-gradient(45deg,transparent 0 5px,var(--p-stone-300) 5px 6px);
  overflow:hidden;display:flex;justify-content:center}
.gap b{font-family:var(--font-mono);font-size:var(--text-micro);font-weight:400;
  color:var(--color-text-subtle);padding-top:var(--space-1);white-space:nowrap}
.ax{position:absolute;font-family:var(--font-mono);font-size:var(--text-micro);line-height:1;
  color:var(--color-text-subtle);font-variant-numeric:tabular-nums}
.ax-y{right:calc(100% + var(--space-2));top:var(--y);transform:translateY(-50%)}
.ax-ref{right:var(--space-1);top:var(--y);transform:translateY(calc(-100% - 3px));
  background:color-mix(in oklab,var(--color-surface-raised) 85%,transparent);padding:1px 3px}
.tx-mmm{color:var(--color-text-subtle)}.tx-threshold{color:var(--alert-alert1-text)}
.ax-x{display:flex;justify-content:space-between;margin-left:3.25rem;font-family:var(--font-mono);
  font-size:var(--text-micro);color:var(--color-text-subtle)}
.chart-empty{color:var(--color-text-subtle);font-size:var(--text-small)}
.viewdata summary{cursor:pointer;font-size:var(--text-small);font-weight:500;color:var(--color-text);
  list-style:none;display:inline-flex;align-items:center;gap:0.55rem;min-height:32px;
  padding:0.25rem 0.95rem;border:var(--border-control);border-radius:var(--radius-pill);
  white-space:nowrap;transition:color var(--dur-quick) var(--ease-standard),
  border-color var(--dur-quick) var(--ease-standard)}
.viewdata summary::-webkit-details-marker{display:none}
.viewdata summary:hover{color:var(--color-accent);border-color:var(--color-accent)}
/* A chevron drawn from two borders: points down when closed, up when open. */
.viewdata summary::after{content:"";width:0.42em;height:0.42em;margin-top:-0.2em;
  border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;
  transform:rotate(45deg);transition:transform var(--dur-quick) var(--ease-standard)}
.viewdata[open] summary::after{margin-top:0.2em;transform:rotate(-135deg)}
.viewdata .table-scroll{margin-top:var(--space-2);max-height:16rem}
.viewdata table.data{min-width:0;font-size:var(--text-small)}  /* three short columns fit any panel; no sideways scroll */
.viewdata table.data td,.viewdata table.data th{padding:0.4rem 0.6rem;white-space:nowrap}
/* Instrument status: the colour is on the glyph; the label stays readable text. */
.freshness{display:flex;flex-wrap:wrap;gap:0.3rem 0.8rem;align-items:center;margin-bottom:0;
  font-size:var(--text-small);color:var(--color-text-muted)}
/* The slot rule: one tick per transmit slot (00:10 · 08:10 · 16:10 UTC). */
.slot-rule{margin-top:var(--space-3);max-width:36rem}
.slot-rule svg{display:block;width:100%;height:24px}
.slot-rule .base{stroke:var(--color-line-strong);stroke-width:1;vector-effect:non-scaling-stroke}
.slot-rule .tick{stroke-width:1.5;vector-effect:non-scaling-stroke}
.slot-rule .got{fill:var(--color-text);stroke:var(--color-text)}
.slot-rule .miss{fill:var(--color-surface-raised);stroke:var(--color-text)}
.slot-rule .due{fill:none;stroke:var(--color-line-strong)}
.panel-note{margin:0.8rem 0 0;font-size:var(--text-micro);color:var(--color-text-muted);line-height:1.5}
.panel-note .pn-verdict{font-weight:600}
.legend{display:flex;flex-wrap:wrap;gap:0.4rem 1.1rem;margin-top:0.8rem;
  font-size:var(--text-micro);color:var(--color-text-subtle)}
.legend span{display:inline-flex;align-items:center;gap:0.4rem}
.legend i{width:0.85rem;height:0.2rem;border-radius:2px;display:inline-block}
.sw-temp{background:var(--data-temp)}.sw-turb{background:var(--data-turb)}
.sw-dhw{background:var(--color-text)}.sw-batt{background:var(--data-instrument)}
.sw-est{background:repeating-linear-gradient(90deg,var(--color-text-subtle) 0 4px,transparent 4px 7px)}
.legend i.sw-gap{height:0.7rem;background:repeating-linear-gradient(45deg,transparent 0 3px,var(--p-stone-400) 3px 4px)}
.legend i.sw-alert1,.legend i.sw-alert2,.legend i.sw-alert3,.legend i.sw-alert4,.legend i.sw-alert5{height:0.7rem}
.sw-alert1{background:var(--alert-alert1-fill)}.sw-alert2{background:var(--alert-alert2-fill)}
.sw-alert3{background:var(--alert-alert3-fill)}.sw-alert4{background:var(--alert-alert4-fill)}.sw-alert5{background:var(--alert-alert5-fill)}
.legend i.sw-ev{width:0.55rem;height:0.55rem;border-radius:50%;background:var(--status-warning)}
.data-links{color:var(--color-text-subtle);font-size:var(--text-small);margin-top:1.8rem}
.data-links a{font-weight:500}

/* Fleet overview — the network view (telemetry.fleet_web) */
.fleet-strip{margin-bottom:clamp(1.6rem,1rem + 2vw,2.6rem)}
.fleet-grid{display:grid;gap:clamp(1rem,0.6rem + 1vw,1.6rem);
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.buoy-tile{display:flex;flex-direction:column;gap:1.1rem;color:inherit}
.buoy-tile:hover{opacity:1}
.buoy-head{display:flex;align-items:center;justify-content:space-between;gap:0.8rem}
.buoy-head h3{font-size:1.15rem;font-weight:500;letter-spacing:-0.01em;color:var(--color-text)}
.alert-badge{font-size:var(--text-micro);font-weight:500;letter-spacing:0.05em;
  text-transform:uppercase;white-space:nowrap;padding:0.3rem 0.72rem;border-radius:var(--radius-pill);
  background:color-mix(in srgb,currentColor 12%,var(--color-surface))}
/* On a Fleet tile the reef alert is the loud colour: a solid NOAA fill with its computed label. */
.alert-badge.lvl-nostress{background:var(--alert-nostress-fill);color:var(--alert-nostress-on)}
.alert-badge.lvl-watch{background:var(--alert-watch-fill);color:var(--alert-watch-on)}
.alert-badge.lvl-warning{background:var(--alert-warning-fill);color:var(--alert-warning-on)}
.alert-badge.lvl-alert1{background:var(--alert-alert1-fill);color:var(--alert-alert1-on)}
.alert-badge.lvl-alert2{background:var(--alert-alert2-fill);color:var(--alert-alert2-on)}
.alert-badge.lvl-alert3{background:var(--alert-alert3-fill);color:var(--alert-alert3-on)}
.alert-badge.lvl-alert4{background:var(--alert-alert4-fill);color:var(--alert-alert4-on)}
.alert-badge.lvl-alert5{background:var(--alert-alert5-fill);color:var(--alert-alert5-on)}
.spark{position:relative;width:100%;height:56px;display:block}
.spark-empty{height:56px;border-radius:var(--radius-none);background:var(--color-canvas-sunken)}
.tile-stats{display:grid;grid-template-columns:1fr 1fr;gap:0.7rem 1rem;margin:0}
.tile-stats div{display:flex;flex-direction:column;gap:0.15rem}
.tile-stats dt{color:var(--color-text-subtle);font-size:var(--text-micro);letter-spacing:0.06em;
  text-transform:uppercase}
.tile-stats dd{margin:0;color:var(--color-text);font-weight:500;font-size:0.98rem;
  font-family:var(--font-mono)}
.tile-more{margin-top:auto;color:var(--color-accent);font-size:var(--text-small);font-weight:500}
.buoy-tile:hover .tile-more{color:var(--color-accent)}

"""
