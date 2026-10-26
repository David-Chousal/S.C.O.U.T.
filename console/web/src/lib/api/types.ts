// The console JSON API's shapes (console/worker/api.js). The Worker is the source of truth; these
// types mirror what it returns, and src/lib/api/client.ts is the only place that calls it.

export type Role = "admin" | "member" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  hasPassword: boolean;
  github: boolean;
  google: boolean;
}

export interface Session {
  user: User;
  csrf: string;
}

/** confirmed | pending | rejected | unreported | default — shore/scout_shore/tx_schedule.py. */
export type CountState = "confirmed" | "pending" | "rejected" | "unreported" | "default";

export interface Buoy {
  buoy_id: number;
  label: string;
  tx_count_requested: number | null;
  requested_by: string | null;
  requested_at: number | null;
  tx_count_reported: number | null;
  cmd_rejected: number;
  reported_at: number | null;
  last_seen_at: number | null;
  state: CountState;
}

export interface LifeRow {
  scenario: "best" | "pessimistic";
  tx_per_day: number;
  cells: number;
  mah_per_day: number;
  days: number;
  months: number;
}

/** console/worker/battery-life.json, exported from analytics/telemetry/battery_life.py. */
export interface Estimates {
  estimate: true;
  source: string;
  allowed_tx_counts: number[];
  without_listen_window: LifeRow[];
  with_listen_window: LifeRow[];
}

export interface Fleet {
  buoys: Buoy[];
  estimates: Estimates;
  slotLabels: Record<string, string>;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  disabled: number;
  created_at: number;
  has_password: number;
  has_github: number;
  has_google: number;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  created_at: number;
  expires_at: number;
}

export interface Team {
  members: Member[];
  invites: Invite[];
}

export interface Device {
  id: string;
  name: string;
  created_at: number;
  revoked_at: number | null;
  last_seen_at: number | null;
}

export interface AuditEntry {
  id: number;
  at: number;
  actor_label: string;
  action: string;
  target: string;
  before_json: string | null;
  after_json: string | null;
}

export interface Providers {
  github: boolean;
  google: boolean;
}

/** A failed call: the HTTP status and the Worker's plain-language message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
