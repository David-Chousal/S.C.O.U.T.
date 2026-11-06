/* The HTML part of the console's emails, styled like a console dialog (COR in Tideline colour,
 * console/web/src/styles): a card with the 2 px ink rail on top, a mono uppercase tag, a primary
 * key with its keybed edge, label/value pairs, and the link in the dashed "secret" box.
 *
 * Email clients ignore stylesheets and many CSS features, so everything is inline and laid out
 * with tables. No images, remote fonts or anything that loads from a server: DM Sans and
 * JetBrains Mono are named first and fall back to the reader's system fonts. */

// Tideline light tokens (console/web/src/styles/tokens.css).
const T = {
  page: "#f8f3ef",
  surface: "#ffffff",
  sunken: "#ede7e1",
  line: "#ddd6d0",
  lineStrong: "#867f78",
  ink: "#2b2520",
  muted: "#6f6760",
  accent: "#1f6763",
  accentEdge: "#164a47", // the key's keybed: accent under a 28% black inset, as in key.css
  onAccent: "#fffcfa",
};
const SANS = "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const tag = (text) =>
  `<div style="font:500 11px/14px ${MONO};letter-spacing:.06em;text-transform:uppercase;color:${T.muted}">${escapeHtml(text)}</div>`;

const paragraph = (text) => `<p style="margin:0 0 12px;font:400 15px/22px ${SANS};color:${T.ink}">${escapeHtml(text)}</p>`;

function facts(rows) {
  const cells = rows.map(([label, value]) =>
    `<tr><td style="padding:8px 16px 8px 0;border-top:1px solid ${T.line};vertical-align:top;white-space:nowrap">${tag(label)}</td>` +
    `<td style="padding:8px 0;border-top:1px solid ${T.line};font:500 14px/20px ${SANS};color:${T.ink}">${escapeHtml(value)}</td></tr>`);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 20px;border-collapse:collapse;border-bottom:1px solid ${T.line}">${cells.join("")}</table>`;
}

function primaryKey(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background:${T.accent};` +
    `border:1px solid ${T.accent};border-bottom:3px solid ${T.accentEdge};border-radius:2px">` +
    `<a href="${href}" style="display:inline-block;padding:9px 16px 8px;font:500 14px/16px ${SANS};color:${T.onAccent};` +
    `text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;
}

function secretBox(href) {
  return `<p style="margin:0 0 6px;font:500 12px/16px ${SANS};color:${T.muted}">Or paste this address into your browser:</p>` +
    `<div style="margin:0 0 20px;padding:12px;border:1px dashed ${T.lineStrong};background:${T.sunken};` +
    `font:400 13px/18px ${MONO};color:${T.ink};word-break:break-all">${href}</div>`;
}

const subtitle = (text) => `<h2 style="margin:0 0 4px;font:700 15px/20px ${SANS};color:${T.ink}">${escapeHtml(text)}</h2>`;

const mutedLink = (href, label) =>
  `<p style="margin:-12px 0 20px;font:400 13px/18px ${SANS};color:${T.muted}">` +
  `<a href="${escapeHtml(href)}" style="color:${T.muted};text-decoration:underline">${escapeHtml(label)}</a></p>`;

/** A titled facts table with an optional muted link under it: one per alert in an alert email. */
function group({ title, facts: rows, link }) {
  return (title ? subtitle(title) : "") + facts(rows) + (link ? mutedLink(link.href, link.label) : "");
}

/**
 * @param {{ title: string, intro: string[], facts?: [string, string][],
 *   groups?: { title?: string, facts: [string, string][], link?: { label: string, href: string } }[],
 *   action: { label: string, href: string }, notes: string[] }} content
 * @returns {string}
 */
export function emailHtml({ title, intro, facts: rows = [], groups = [], action, notes }) {
  const href = escapeHtml(action.href);
  const card =
    `<td style="background:${T.surface};border:1px solid ${T.line};border-top:2px solid ${T.ink};border-radius:0 0 4px 4px;padding:16px 24px 24px">` +
    `<div style="margin:0 0 4px">${tag("S.C.O.U.T. Console")}</div>` +
    `<h1 style="margin:0 0 16px;font:700 18px/24px ${SANS};letter-spacing:-.01em;color:${T.ink}">${escapeHtml(title)}</h1>` +
    intro.map(paragraph).join("") +
    groups.map(group).join("") +
    (rows.length ? facts(rows) : "") +
    primaryKey(href, action.label) +
    secretBox(href) +
    notes.map((note) => `<p style="margin:0 0 8px;font:400 13px/18px ${SANS};color:${T.muted}">${escapeHtml(note)}</p>`).join("") +
    "</td>";
  const footer = `<td style="padding:12px 4px 0;font:400 12px/16px ${SANS};color:${T.muted}">` +
    "Sent by the S.C.O.U.T. Console, console.scoutscu.com. Santa Clara University senior design, 2026–27.</td>";
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>` +
    `<body style="margin:0;padding:24px 12px;background:${T.page}">` +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;margin:0 auto;border-collapse:separate">' +
    `<tr>${card}</tr><tr>${footer}</tr></table></body></html>`;
}
