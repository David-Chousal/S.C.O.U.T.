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
  /** Signed in with just a name and an email: view only, other people's emails masked. */
  selfSignup: boolean;
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
  clock_lost: number;
  /** The one shore station that sends this buoy's downlink commands; null until an admin picks. */
  command_device_id: string | null;
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

/** One firmware setting, from console/worker/buoy-config.json (scripts/export_buoy_config.py). */
export interface FirmwareSetting {
  key: string;
  label: string;
  value: string;
  /** How it can be changed: by radio (only the transmit count) or by a firmware update. */
  change: string;
  status: "decided" | "provisional" | "pending sign-off";
  note: string;
  source: string;
}

export interface BuoySettings {
  buoys: Buoy[];
  firmware: { source: string; settings: FirmwareSetting[] };
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
  self_signup: number;
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

/** One stored reading: the schema row the shore station sent (shore/scout_shore/schema.py). */
export type Reading = Record<string, string>;

export interface ApiToken {
  id: string;
  name: string;
  /** Space-separated: read:telemetry, write:settings. */
  scopes: string;
  created_at: number;
  expires_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

export interface TokenList {
  tokens: ApiToken[];
  scopes: string[];
  expiryDays: number[];
}

