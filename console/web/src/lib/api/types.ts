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
  /** Set when an admin disconnected it on Fleet: its packets are not stored until it is added again. */
  disconnected_at?: number | null;
  state: CountState;
  /** Remote settings (worker/buoy-settings.js): each one's requested value, null = default. */
  settings_requested: Record<string, number | null>;
  /** The snapshot the buoy should run, in setting-ID order, and its digest. */
  settings_wanted: number[];
  settings_digest_wanted: string;
  /** From the newest v5 packet; null until one arrives. */
  settings_digest_reported: string | null;
  settings_state: CountState;
}

/** One remote setting, from the firmware's table (buoy-config.json "remote"). */
export interface RemoteSetting {
  id: number;
  key: string;
  label: string;
  unit: string;
  help: string;
  default: number;
  /** Either a list of allowed values, or min..max in steps of step. */
  choices?: number[];
  min?: number;
  max?: number;
  step?: number;
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
  /** What the setting does, in a sentence or two. */
  description: string;
  /** "radio": per buoy, from its controls on Settings → Buoys. "firmware": only by a firmware update. */
  change: "radio" | "firmware";
}

export interface BuoySettings {
  buoys: Buoy[];
  /** slotsSod: the three transmit slots at slot phase 0, seconds after midnight UTC. */
  firmware: { source: string; settings: FirmwareSetting[]; remote: RemoteSetting[]; tierGapMv: number; slotsSod: number[] };
  /** Battery life by transmit count, for the confirmation before a count changes. */
  estimates: Estimates;
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

/** Whether the console emailed an invite or reset link (SCO-300). Anything but "sent" means the
 * admin sends the link by hand. */
export type EmailDelivery = "sent" | "failed" | "not_configured" | "rate_limited";

export interface LinkIssued {
  link: string;
  email: string;
  delivery: EmailDelivery;
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
  /** null: never expires. */
  expires_at: number | null;
  last_used_at: number | null;
  revoked_at: number | null;
}

export interface TokenList {
  tokens: ApiToken[];
  scopes: string[];
  /** 0 means never expires. */
  expiryDays: number[];
}

export interface StorageReport {
  usage: { month: string; writes: number; reads: number; storedBytes: number; objects: number };
  budget: { writesPerMonth: number; readsPerMonth: number; storedBytes: number; maxObjectBytes: number };
  lastBackup: { key: string; bytes: number } | null;
  bound: boolean;
  /** Fred's use today (UTC), across everyone; counts only. */
  assistant?: { day: string; questions: number; model_calls: number; tokens_in: number; tokens_out: number; fallbacks: number; people: number };
}

export interface ReportRequest {
  buoys: number[];
  /** UTC, like 2026-10-30T00:00:00Z. */
  from: string;
  to: string;
  columns: string[];
}

export interface ReportItem {
  id: string;
  params: ReportRequest;
  rows: number;
  bytes: number;
  created_at: number;
  link_expires_at: number;
  /** When R2 deletes the file. */
  expires_at: number;
}

export interface ReportList {
  reports: ReportItem[];
  columns: string[];
}

/** Fred, the console's assistant (console/worker/assistant/route.js). */
export interface FredMessage {
  role: "user" | "assistant";
  text: string;
}

export interface FredContext {
  page?: string;
  tab?: string;
  buoy?: number;
}

export interface FredStatus {
  enabled: boolean;
  used: number;
  cap: number;
}

/** Fred's morning brief, written by the daily cron (console/worker/assistant/brief.js). */
export interface FredBrief {
  day: string;
  text: string;
  provider: "gemini" | "facts";
  created_at: number;
}

/** A change Fred proposed; it runs only on Confirm, within 10 minutes. */
export interface FredCard {
  id: string;
  kind: string;
  title: string;
  details: [string, string][];
  expiresAt: number;
}

/** One server-sent event from POST /api/assistant. */
export type FredEvent =
  | { event: "text"; data: { delta: string } }
  | { event: "tool"; data: { name: string; label: string } }
  | { event: "action"; data: FredCard }
  | { event: "notice"; data: { message: string } }
  | { event: "reset"; data: Record<string, never> }
  | { event: "done"; data: { provider: string; used: number; cap: number } }
  | { event: "error"; data: { message: string } };
