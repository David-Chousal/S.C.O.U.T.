/* Console stylesheet: the Tideline day-ground tokens (analytics/telemetry/site/theme/tokens.py,
 * docs/engineering/design-system.md) applied to a plain admin surface. Served at /console.css
 * so the CSP can stay at style-src 'self'. Works from 320 px up with no sideways page scroll. */

export const CONSOLE_CSS = `
:root{--color-canvas:#f8f3ef;--color-surface:#fdf9f7;--color-surface-raised:#fffcfa;
--color-text:#2b2520;--color-text-muted:#534c45;--color-text-subtle:#6f6760;
--color-line:rgb(43 37 32 / 0.10);--color-line-strong:#867f78;--color-accent:#1f6763;
--color-accent-hover:#16524f;--color-accent-tint:#d6eeeb;--color-on-accent:#fffcfa;
--color-focus:#1f6763;--warn:#8a5a00;--warn-tint:#fbeed5;--bad:#9b2c2c;--bad-tint:#f8e1de;
--font:system-ui,-apple-system,"Segoe UI",sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
--radius:6px}
*{box-sizing:border-box}
body{margin:0;background:var(--color-canvas);color:var(--color-text);font:16px/1.5 var(--font)}
a{color:var(--color-accent)}a:hover{color:var(--color-accent-hover)}
:focus-visible{outline:2px solid var(--color-focus);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:8px;background:var(--color-surface-raised);padding:8px}
header.top{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:space-between;
padding:12px 16px;border-bottom:1px solid var(--color-line);background:var(--color-surface)}
.brand{font-weight:600;letter-spacing:.06em;text-decoration:none;color:var(--color-text)}
nav ul{display:flex;flex-wrap:wrap;gap:4px 16px;list-style:none;margin:0;padding:0}
nav a{text-decoration:none;color:var(--color-text-muted)}nav a[aria-current=page]{color:var(--color-text);
border-bottom:2px solid var(--color-accent)}
.who{font-size:.875rem;color:var(--color-text-subtle);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
main{max-width:960px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:1.6rem;margin:0 0 8px}h2{font-size:1.15rem;margin:32px 0 8px}
.lede{color:var(--color-text-muted);margin:0 0 20px;max-width:70ch}
.card{background:var(--color-surface-raised);border:1px solid var(--color-line);border-radius:var(--radius);
padding:16px;margin:0 0 16px}
.narrow{max-width:420px;margin:48px auto}.card>h2:first-child{margin-top:0}
.table-wrap{overflow-x:auto;border:1px solid var(--color-line);border-radius:var(--radius);background:var(--color-surface-raised)}
table{border-collapse:collapse;width:100%;font-size:.95rem}
caption{text-align:left;padding:12px 12px 0;color:var(--color-text-subtle);font-size:.875rem}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-line);vertical-align:top}
thead th{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--color-text-subtle);font-weight:500}
tbody tr:last-child td{border-bottom:0}.num{font-family:var(--mono);text-align:right;white-space:nowrap}
label{display:block;font-weight:500;margin:12px 0 4px}
input,select{font:inherit;width:100%;max-width:100%;padding:8px 10px;border:1px solid var(--color-line-strong);
border-radius:var(--radius);background:var(--color-surface-raised);color:var(--color-text)}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}.row>*{flex:1 1 160px}
button{font:inherit;font-weight:500;padding:8px 14px;border-radius:var(--radius);border:1px solid var(--color-accent);
background:var(--color-accent);color:var(--color-on-accent);cursor:pointer}
button:hover{background:var(--color-accent-hover)}
button.quiet{background:transparent;color:var(--color-accent)}
button:disabled,input:disabled,select:disabled{opacity:.55;cursor:not-allowed}
.inline{display:inline}.row>.shrink{flex:0 0 auto}
.providers{display:grid;gap:8px;margin:16px 0}.providers a{display:block;text-align:center;padding:10px;
border:1px solid var(--color-line-strong);border-radius:var(--radius);text-decoration:none;color:var(--color-text)}
.or{text-align:center;color:var(--color-text-subtle);margin:16px 0 0}
.note{border-left:3px solid var(--color-accent);background:var(--color-accent-tint);padding:10px 12px;
border-radius:var(--radius);margin:0 0 16px}
.note.warn{border-color:var(--warn);background:var(--warn-tint)}.note.bad{border-color:var(--bad);background:var(--bad-tint)}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.8rem;border:1px solid var(--color-line-strong)}
.badge.confirmed,.badge.default{border-color:var(--color-accent);color:var(--color-accent)}
.badge.pending,.badge.unreported{border-color:var(--warn);color:var(--warn)}
.badge.rejected{border-color:var(--bad);color:var(--bad)}
.secret{font-family:var(--mono);word-break:break-all;background:var(--color-surface);padding:8px;border-radius:var(--radius)}
.muted{color:var(--color-text-subtle);font-size:.875rem}
`;
