// The audit log in words: the Worker stores action codes and JSON snapshots (worker/audit.js);
// people read "Transmit count requested: nothing → 2", not {"requested":null} → {"requested":2}.

import type { AuditEntry } from "./api/types";

const ACTIONS: Record<string, string> = {
  "buoy.add": "Added buoy",
  "buoy.rename": "Renamed buoy",
  "buoy.tx_count": "Requested transmit count",
  "buoy.command_station": "Picked command station",
  "device.create": "Created station token",
  "device.revoke": "Revoked station token",
  "invite.create": "Invited",
  "invite.accept": "Accepted invite",
  "invite.revoke": "Revoked invite",
  "user.role": "Changed role",
  "user.disable": "Disabled",
  "user.enable": "Re-enabled",
  "user.reset_link": "Made reset link",
  "user.password_reset": "Reset password",
  "user.link": "Linked sign-in",
  "user.bootstrap_admin": "First admin",
  "user.guest_signup": "Signed in as guest",
};

const FIELDS: Record<string, string> = {
  label: "Name",
  role: "Role",
  requested: "Requested",
  reported: "Reported",
  station: "Station",
};

export function actionLabel(action: string): string {
  return ACTIONS[action] ?? action;
}

/** buoy.rename stores the numeric buoy ID as its target; every other action stores a name. */
export function targetLabel(entry: Pick<AuditEntry, "action" | "target">): string {
  return entry.action === "buoy.rename" && /^\d+$/.test(entry.target) ? `Buoy ${entry.target}` : entry.target;
}

function parse(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const value: unknown = JSON.parse(json);
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function show(value: unknown): string {
  if (value === null || value === undefined) return "nothing";
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** One "Field: before → after" per field that changed (or was set), in the order first seen. */
export function changeLines(entry: Pick<AuditEntry, "before_json" | "after_json">): string[] {
  const before = parse(entry.before_json);
  const after = parse(entry.after_json);
  const keys = [...new Set([...Object.keys(after), ...Object.keys(before)])];
  return keys
    .filter((key) => key in after)
    .filter((key) => !(key in before) || show(before[key]) !== show(after[key]))
    .map((key) => {
      const name = FIELDS[key] ?? key;
      return key in before ? `${name}: ${show(before[key])} → ${show(after[key])}` : `${name}: ${show(after[key])}`;
    });
}
