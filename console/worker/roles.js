/* Roles (ADR-0012). Three, ordered. The server checks every write; the UI only mirrors it.
 *
 *   guest  — sees every page and every setting, admin pages included, but changes nothing
 *   member — also changes buoy settings, makes personal API tokens and sets email alerts
 *   admin  — also invites, changes roles, disables accounts, issues reset links and manages
 *            shore-station tokens, and uploads or cancels firmware (SCO-312) */

export const ROLES = ["guest", "member", "admin"];

const RANK = { guest: 0, member: 1, admin: 2 };

/** Which role each action needs. Anything not listed is refused. */
const NEEDS = {
  "settings.write": "member",
  "tokens.write": "member",
  "reports.write": "member",
  "dashboards.write": "member",
  "alerts.write": "member",
  "buoys.add": "admin",
  "invites.write": "admin",
  "users.role": "admin",
  "users.reset": "admin",
  "users.disable": "admin",
  "devices.write": "admin",
  "storage.read": "admin",
  "firmware.write": "admin",
};

export function isRole(value) {
  return Object.hasOwn(RANK, value);
}

/** @param {{role: string} | null} user @param {string} action @returns {boolean} */
export function can(user, action) {
  const needed = NEEDS[action];
  if (!user || !needed || !isRole(user.role)) return false;
  return RANK[user.role] >= RANK[needed];
}
