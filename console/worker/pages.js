/* Signed-in pages. Every page renders for every role; controls a role cannot use are shown
 * disabled with a "view only" note, and the server refuses the write regardless (roles.js). */

import { estimates, lifeFor, SLOT_LABELS, TX_COUNTS } from "./fleet.js";
import { esc } from "./http.js";
import { can, ROLES } from "./roles.js";
import { csrfField, lockFor, message, page } from "./views.js";

const STATE_TEXT = {
  confirmed: "Confirmed: the buoy reports this count",
  default: "Default: nothing requested, the buoy runs 3 a day",
  pending: "Pending: waiting for the buoy to report the new count",
  unreported: "Pending: the buoy has not reported a count yet",
  rejected: "Rejected: the buoy refused the last command (see its CMD_REJECTED flag)",
};

function when(ms) {
  return ms ? new Date(ms).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—";
}

function months(row) {
  return row ? `${row.months} mo` : "—";
}

function optionLabel(n) {
  const life = lifeFor(n, 2);
  return `${n} a day (${SLOT_LABELS[n]}) · ≈ ${months(life.best)} best, ${months(life.pessimistic)} pessimistic`;
}

function buoyCard(session, buoy) {
  const lock = lockFor(can(session.user, "settings.write"), "member");
  const requested = buoy.tx_count_requested;
  const options = TX_COUNTS.map((n) =>
    `<option value="${n}"${n === (requested ?? 3) ? " selected" : ""}>${esc(optionLabel(n))}</option>`).join("");
  return `<section class="card" aria-labelledby="b${buoy.buoy_id}"><h2 id="b${buoy.buoy_id}">${esc(buoy.label)}</h2>` +
    `<p><span class="badge ${esc(buoy.state)}">${esc(buoy.state)}</span> ${esc(STATE_TEXT[buoy.state])}</p>` +
    `<div class="table-wrap"><table><caption>Daily transmit count</caption><tbody>` +
    `<tr><th scope="row">Requested</th><td>${requested ? `${requested} a day` : "nothing requested"}` +
    `${buoy.requested_by ? ` <span class="muted">by ${esc(buoy.requested_by)}, ${when(buoy.requested_at)}</span>` : ""}</td></tr>` +
    `<tr><th scope="row">Buoy reports</th><td>${buoy.tx_count_reported ? `${buoy.tx_count_reported} a day` : "not reported yet"}` +
    ` <span class="muted">newest packet ${when(buoy.reported_at)}</span></td></tr></tbody></table></div>` +
    `<form method="post" action="/settings/buoys/${buoy.buoy_id}/tx-count">${csrfField(session)}` +
    `<div class="row"><div><label for="tx${buoy.buoy_id}">Transmits a day</label>` +
    `<select id="tx${buoy.buoy_id}" name="tx_count"${lock.attr}>${options}</select></div>` +
    `<div class="shrink"><button type="submit"${lock.attr}>Request</button></div></div></form>${lock.note}</section>`;
}

function estimateTable(listenWindow) {
  const rows = TX_COUNTS.map((n) => {
    const one = lifeFor(n, 1, listenWindow);
    const two = lifeFor(n, 2, listenWindow);
    return `<tr><th scope="row">${n} a day</th>` +
      [one.best, two.best, one.pessimistic, two.pessimistic]
        .map((r) => `<td class="num">${r.days.toLocaleString("en-US")} d · ${r.months} mo</td>`).join("") + "</tr>";
  }).join("");
  return `<div class="table-wrap"><table><caption>Battery life ${listenWindow ? "with" : "without"} the 1 s ` +
    `listen window (estimate)</caption><thead><tr><th scope="col">Transmits</th><th scope="col">Best · 1 cell</th>` +
    `<th scope="col">Best · 2 cells</th><th scope="col">Pessimistic · 1 cell</th><th scope="col">Pessimistic · 2 cells</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function settingsPage(session, buoys, notice = {}) {
  const addLock = lockFor(can(session.user, "buoys.add"), "admin");
  const cards = buoys.length ? buoys.map((b) => buoyCard(session, b)).join("")
    : `<p class="card">No buoys yet. One appears when its shore station first pushes a reading, or an admin adds it.</p>`;
  return page({
    title: "Fleet settings", session, active: "/settings",
    body: `<h1>Fleet settings</h1><p class="lede">How often each buoy transmits a day. A change goes to the ` +
      `shore station, which sends it to the buoy right after the buoy's next transmission; the buoy's ` +
      `following packet confirms it.</p>${message(notice.ok)}${message(notice.error, "bad")}` +
      `<p class="note warn">The range 1–3 is pending the electrical lead's power sign-off, and the radio ` +
      `downlink that carries the setting is built but off in the shipped firmware. Until it is switched on, ` +
      `a request here stays pending.</p>${cards}` +
      `<h2>Battery life by transmit count</h2><p class="lede">From the power budget's datasheet figures ` +
      `(${esc(estimates.source)}), not a measurement. The radio is under half a percent of the daily draw, ` +
      `so the count mostly changes how fresh the data is.</p>${estimateTable(false)}<p></p>${estimateTable(true)}` +
      `<h2>Add a buoy</h2><form class="card" method="post" action="/settings/buoys">${csrfField(session)}` +
      `<div class="row"><div><label for="bid">Buoy ID</label><input id="bid" name="buoy_id" inputmode="numeric" ` +
      `pattern="[0-9]{1,5}" required${addLock.attr}></div><div><label for="blabel">Label</label>` +
      `<input id="blabel" name="label" maxlength="40" placeholder="SCOUT-01"${addLock.attr}></div>` +
      `<div class="shrink"><button type="submit"${addLock.attr}>Add</button></div></div>${addLock.note}</form>`,
  });
}

function roleSelect(name, id, current, attr) {
  return `<select id="${id}" name="${name}"${attr}>${ROLES.map((r) =>
    `<option value="${r}"${r === current ? " selected" : ""}>${r}</option>`).join("")}</select>`;
}

export function teamPage(session, users, invites, notice = {}) {
  const lock = lockFor(can(session.user, "invites.write"), "admin");
  const userRows = users.map((u) => `<tr><td>${esc(u.email)}<br><span class="muted">${esc(u.name)}</span></td>` +
    `<td>${[u.has_password && "password", u.has_github && "GitHub", u.has_google && "Google"].filter(Boolean).join(", ") || "—"}</td>` +
    `<td><form method="post" action="/team/users/${esc(u.id)}/role" class="row">${csrfField(session)}` +
    `<div><label class="muted" for="r${esc(u.id)}">Role</label>${roleSelect("role", `r${esc(u.id)}`, u.role, lock.attr)}</div>` +
    `<div class="shrink"><button class="quiet" type="submit"${lock.attr}>Save</button></div></form></td>` +
    `<td><form method="post" action="/team/users/${esc(u.id)}/reset" class="inline">${csrfField(session)}` +
    `<button class="quiet" type="submit"${lock.attr}>Reset link</button></form>` +
    `<form method="post" action="/team/users/${esc(u.id)}/${u.disabled ? "enable" : "disable"}" class="inline">` +
    `${csrfField(session)}<button class="quiet" type="submit"${lock.attr}>${u.disabled ? "Enable" : "Disable"}</button>` +
    `</form>${u.disabled ? ' <span class="badge rejected">disabled</span>' : ""}</td></tr>`).join("");
  const inviteRows = invites.map((i) => `<tr><td>${esc(i.email)}</td><td>${esc(i.role)}</td><td>${when(i.expires_at)}</td>` +
    `<td><form method="post" action="/team/invites/${esc(i.id)}/revoke" class="inline">${csrfField(session)}` +
    `<button class="quiet" type="submit"${lock.attr}>Revoke</button></form></td></tr>`).join("") ||
    `<tr><td colspan="4" class="muted">No open invites.</td></tr>`;
  return page({
    title: "Team", session, active: "/team",
    body: `<h1>Team</h1><p class="lede">Admins invite people and set roles. Members change buoy settings. ` +
      `Guests see everything here but change nothing.</p>${notice.html || ""}${message(notice.error, "bad")}${lock.note}` +
      `<h2>Invite someone</h2><form class="card" method="post" action="/team/invites">${csrfField(session)}` +
      `<div class="row"><div><label for="iemail">Email</label><input id="iemail" name="email" type="email" required${lock.attr}></div>` +
      `<div><label for="irole">Role</label>${roleSelect("role", "irole", "member", lock.attr)}</div>` +
      `<div class="shrink"><button type="submit"${lock.attr}>Create invite link</button></div></div></form>` +
      `<h2>People</h2><div class="table-wrap"><table><caption>Everyone with an account</caption><thead><tr>` +
      `<th scope="col">Email</th><th scope="col">Signs in with</th><th scope="col">Role</th><th scope="col">Access</th>` +
      `</tr></thead><tbody>${userRows}</tbody></table></div>` +
      `<h2>Open invites</h2><div class="table-wrap"><table><caption>Invites not yet used</caption><thead><tr>` +
      `<th scope="col">Email</th><th scope="col">Role</th><th scope="col">Expires</th><th scope="col"></th>` +
      `</tr></thead><tbody>${inviteRows}</tbody></table></div>`,
  });
}

/** Shown once, right after creation: the link or token is not stored and cannot be shown again. */
export function oneTimeSecret(label, value) {
  return `<div class="note" role="status"><p><strong>${esc(label)}</strong> — copy it now; it is shown only once.</p>` +
    `<p class="secret">${esc(value)}</p></div>`;
}

export function devicesPage(session, devices, notice = {}) {
  const lock = lockFor(can(session.user, "devices.write"), "admin");
  const rows = devices.map((d) => `<tr><td>${esc(d.name)}</td><td>${when(d.created_at)}</td><td>${when(d.last_seen_at)}</td>` +
    `<td>${d.revoked_at ? `revoked ${when(d.revoked_at)}` : `<form method="post" action="/devices/${esc(d.id)}/revoke" ` +
    `class="inline">${csrfField(session)}<button class="quiet" type="submit"${lock.attr}>Revoke</button></form>`}</td></tr>`).join("") ||
    `<tr><td colspan="4" class="muted">No shore stations yet.</td></tr>`;
  return page({
    title: "Shore stations", session, active: "/devices",
    body: `<h1>Shore stations</h1><p class="lede">Each shore station signs in to the console's device API with ` +
      `its own token (SCOUT_CONSOLE_TOKEN in shore/scripts/sync_console.py). It pushes readings and pulls the ` +
      `requested transmit counts. The buoys' command keys stay on the shore station and are never sent here.</p>` +
      `${notice.html || ""}${message(notice.error, "bad")}${lock.note}` +
      `<form class="card" method="post" action="/devices">${csrfField(session)}<div class="row"><div>` +
      `<label for="dname">Name</label><input id="dname" name="name" maxlength="60" required placeholder="Kaneohe shore"${lock.attr}>` +
      `</div><div class="shrink"><button type="submit"${lock.attr}>Create token</button></div></div></form>` +
      `<div class="table-wrap"><table><caption>Device tokens</caption><thead><tr><th scope="col">Name</th>` +
      `<th scope="col">Created</th><th scope="col">Last seen</th><th scope="col">Status</th></tr></thead>` +
      `<tbody>${rows}</tbody></table></div>`,
  });
}

export function auditPage(session, entries) {
  const rows = entries.map((e) => `<tr><td class="num">${when(e.at)}</td><td>${esc(e.actor_label)}</td>` +
    `<td>${esc(e.action)}</td><td>${esc(e.target)}</td><td class="muted">${esc(e.before_json || "")} → ` +
    `${esc(e.after_json || "")}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Nothing yet.</td></tr>`;
  return page({
    title: "Audit log", session, active: "/audit",
    body: `<h1>Audit log</h1><p class="lede">Every change in the console: who, what, and the value before and after.</p>` +
      `<div class="table-wrap"><table><caption>Newest first, last 200</caption><thead><tr><th scope="col">When</th>` +
      `<th scope="col">Who</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Change</th>` +
      `</tr></thead><tbody>${rows}</tbody></table></div>`,
  });
}

export function accountPage(session, notice = {}) {
  const u = session.user;
  return page({
    title: "Account", session, active: "/account",
    body: `<h1>Account</h1>${message(notice.ok)}<div class="card"><p><strong>${esc(u.email)}</strong> · ${esc(u.role)}</p>` +
      `<p class="muted">Signs in with: ${[u.hasPassword && "password", u.github && "GitHub", u.google && "Google"]
        .filter(Boolean).join(", ") || "—"}. Signing in with GitHub or Google under this same verified email links it.</p></div>` +
      `<form class="card" method="post" action="/account/sign-out-everywhere">${csrfField(session)}` +
      `<p>Sign out on every device, including this one.</p><button type="submit">Sign out everywhere</button></form>`,
  });
}
