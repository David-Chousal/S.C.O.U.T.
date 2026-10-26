/* Page shell and the signed-out pages (sign in, invite, reset). All values are escaped. */

import { esc, html } from "./http.js";
import { configured, PROVIDERS } from "./oauth.js";

const NAV = [
  ["/settings", "Fleet settings"],
  ["/team", "Team"],
  ["/devices", "Shore stations"],
  ["/audit", "Audit log"],
  ["/account", "Account"],
];

const ROLE_LABEL = { admin: "Admin", member: "Member", guest: "Guest (view only)" };

/** A hidden CSRF field for every form a signed-in user can submit. */
export function csrfField(session) {
  return `<input type="hidden" name="csrf" value="${esc(session.csrf)}">`;
}

/** The disabled attribute and note for a control the user's role cannot use. */
export function lockFor(allowed, needs) {
  return allowed ? { attr: "", note: "" }
    : { attr: " disabled", note: `<p class="muted">View only: changing this needs the ${esc(needs)} role.</p>` };
}

export function page({ title, session = null, active = "", body, status = 200, headers = {} }) {
  const nav = session
    ? `<nav aria-label="Console"><ul>${NAV.map(([href, label]) =>
      `<li><a href="${href}"${href === active ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul></nav>` +
      `<div class="who"><span>${esc(session.user.email)} · ${esc(ROLE_LABEL[session.user.role])}</span>` +
      `<form method="post" action="/logout" class="inline">${csrfField(session)}` +
      `<button class="quiet" type="submit">Sign out</button></form></div>`
    : "";
  return html(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<meta name="robots" content="noindex"><title>${esc(title)} · S.C.O.U.T. Console</title>` +
      `<link rel="stylesheet" href="/console.css"></head><body>` +
      `<a class="skip" href="#main">Skip to content</a>` +
      `<header class="top"><a class="brand" href="/settings">S.C.O.U.T. Console</a>${nav}</header>` +
      `<main id="main">${body}</main></body></html>`,
    { status, headers },
  );
}

export function message(text, kind = "") {
  return text ? `<p class="note ${kind}" role="${kind === "bad" ? "alert" : "status"}">${esc(text)}</p>` : "";
}

function providerLinks(env, invite = "") {
  const links = Object.entries(PROVIDERS)
    .filter(([key]) => configured(key, env))
    .map(([key, p]) => `<a href="/auth/${key}${invite ? `?invite=${esc(invite)}` : ""}">Continue with ${p.label}</a>`);
  return links.length ? `<div class="providers">${links.join("")}</div>` : "";
}

export function loginPage(env, { error = "", email = "", status = 200 } = {}) {
  return page({
    title: "Sign in",
    status,
    body: `<div class="card narrow"><h1>Sign in</h1>` +
      `<p class="lede">The S.C.O.U.T. team console. Accounts are by invitation.</p>${message(error, "bad")}` +
      (providerLinks(env) ? providerLinks(env) + `<p class="or">or with a password</p>` : "") +
      `<form method="post" action="/login"><label for="email">Email</label>` +
      `<input id="email" name="email" type="email" autocomplete="username" required value="${esc(email)}">` +
      `<label for="password">Password</label>` +
      `<input id="password" name="password" type="password" autocomplete="current-password" required>` +
      `<p><button type="submit">Sign in</button></p></form>` +
      `<p class="muted">Forgot it? Ask an admin for a reset link.</p></div>`,
  });
}

export function invitePage(env, invite, token, { error = "", status = 200 } = {}) {
  if (!invite) {
    return page({ title: "Invite", status: 410, body: `<div class="card narrow"><h1>Invite not valid</h1>` +
      `<p>This invite has expired, was revoked, or was already used. Ask an admin for a new one.</p></div>` });
  }
  return page({
    title: "Accept invite",
    status,
    body: `<div class="card narrow"><h1>Join the console</h1>` +
      `<p class="lede">Invited as <strong>${esc(invite.email)}</strong>, role ${esc(ROLE_LABEL[invite.role])}.</p>` +
      message(error, "bad") +
      (providerLinks(env, token) ? providerLinks(env, token) + `<p class="or">or set a password</p>` : "") +
      `<form method="post" action="/invite/${esc(token)}"><label for="name">Your name</label>` +
      `<input id="name" name="name" autocomplete="name" maxlength="120">` +
      `<label for="password">Password (12 characters or more)</label>` +
      `<input id="password" name="password" type="password" autocomplete="new-password" minlength="12" required>` +
      `<p><button type="submit">Create account</button></p></form>` +
      `<p class="muted">With GitHub or Google, the account's verified email must be ${esc(invite.email)}.</p></div>`,
  });
}

export function resetPage(reset, token, { error = "", status = 200 } = {}) {
  if (!reset) {
    return page({ title: "Reset", status: 410, body: `<div class="card narrow"><h1>Link not valid</h1>` +
      `<p>This reset link has expired or was already used. Ask an admin for a new one.</p></div>` });
  }
  return page({
    title: "Set a new password",
    status,
    body: `<div class="card narrow"><h1>Set a new password</h1>${message(error, "bad")}` +
      `<form method="post" action="/reset/${esc(token)}"><label for="password">New password (12 characters or more)</label>` +
      `<input id="password" name="password" type="password" autocomplete="new-password" minlength="12" required>` +
      `<p><button type="submit">Save and sign in</button></p></form>` +
      `<p class="muted">Saving signs you out on every other device.</p></div>`,
  });
}

export function errorPage(status, text, session = null) {
  return page({ title: "Error", session, status, body: `<h1>${status === 403 ? "Not allowed" : "Something went wrong"}</h1>` +
    `<p>${esc(text)}</p><p><a href="/settings">Back to the console</a></p>` });
}
