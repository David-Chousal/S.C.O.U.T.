// The one module that talks to the console Worker. Same-origin fetches carry the session cookie;
// every write sends the session's CSRF token in X-CSRF-Token, which the Worker checks together
// with the Origin header. Errors come back as ApiError with the Worker's message.

import {
  ApiError,
  type AuditEntry,
  type Device,
  type BuoySettings,
  type Fleet,
  type FredBrief,
  type FredCard,
  type FredContext,
  type FredEvent,
  type FredMessage,
  type FredStatus,
  type Invite,
  type LinkIssued,
  type Providers,
  type Reading,
  type ReportList,
  type ReportRequest,
  type Role,
  type Session,
  type StorageReport,
  type Team,
  type TokenList,
} from "./types";
import type { BayConfig, SavedView } from "../dashboard/layout";

let csrfToken = "";

export function rememberCsrf(token: string): void {
  csrfToken = token;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = csrfToken;
  }
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "same-origin",
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the console. Check your connection and try again.");
  }
  const payload: unknown = await response.json().catch(() => ({}));
  const data = (payload && typeof payload === "object" ? payload : {}) as { ok?: boolean; error?: string };
  if (!response.ok || data.ok === false) {
    throw new ApiError(response.status, data.error ?? `The console answered ${response.status}.`);
  }
  return payload as T;
}

/** Each `event:`/`data:` block of a text/event-stream body, as it arrives. */
async function readEvents(body: ReadableStream<Uint8Array>, onEvent: (event: FredEvent) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    let cut = buffer.indexOf("\n\n");
    while (cut !== -1) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const event = /^event: (.*)$/m.exec(block)?.[1];
      const data = /^data: (.*)$/m.exec(block)?.[1];
      if (event && data) onEvent({ event, data: JSON.parse(data) } as FredEvent);
      cut = buffer.indexOf("\n\n");
    }
    if (done) return;
  }
}

/** Ask Fred: the open conversation goes up, the reply streams back through `onEvent`. */
async function askFred(messages: FredMessage[], context: FredContext, onEvent: (event: FredEvent) => void, signal?: AbortSignal): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/assistant", {
      method: "POST",
      headers: { Accept: "text/event-stream", "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      credentials: "same-origin",
      body: JSON.stringify({ messages, context }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the console. Check your connection and try again.");
  }
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, payload.error ?? `The console answered ${response.status}.`);
  }
  try {
    await readEvents(response.body, onEvent);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Fred's reply was cut off. Check your connection and ask again.");
  }
}

export const api = {
  session: async (): Promise<Session> => {
    const session = await call<Session>("GET", "/api/session");
    rememberCsrf(session.csrf);
    return session;
  },
  providers: () => call<Providers>("GET", "/api/providers"),
  signIn: (email: string, password: string) => call<{ ok: true }>("POST", "/api/login", { email, password }),
  guestSignIn: (name: string, email: string) => call<{ ok: true }>("POST", "/api/guest", { name, email }),
  signOut: () => call<{ ok: true }>("POST", "/api/logout"),
  signOutEverywhere: () => call<{ ok: true }>("POST", "/api/account/sign-out-everywhere"),

  invite: (token: string) => call<{ invite: Pick<Invite, "email" | "role"> }>("GET", `/api/invites/${encodeURIComponent(token)}`),
  acceptInvite: (token: string, name: string, password: string) =>
    call<{ ok: true }>("POST", `/api/invites/${encodeURIComponent(token)}/accept`, { name, password }),
  resetValid: (token: string) => call<{ ok: true }>("GET", `/api/resets/${encodeURIComponent(token)}`),
  resetPassword: (token: string, password: string) =>
    call<{ ok: true }>("POST", `/api/resets/${encodeURIComponent(token)}`, { password }),

  fleet: () => call<Fleet>("GET", "/api/fleet"),
  addBuoy: (buoyId: number, label: string) => call<{ ok: true }>("POST", "/api/fleet/buoys", { buoy_id: buoyId, label }),
  settings: () => call<BuoySettings>("GET", "/api/settings"),
  renameBuoy: (buoyId: number, label: string) => call<{ ok: true }>("POST", `/api/fleet/buoys/${buoyId}/label`, { label }),
  requestSettings: (buoyId: number, settings: Record<string, number | null>) =>
    call<{ ok: true }>("POST", `/api/settings/buoys/${buoyId}`, { settings }),
  restoreDefaults: (buoyId: number) => call<{ ok: true }>("POST", `/api/settings/buoys/${buoyId}/defaults`, {}),

  team: () => call<Team>("GET", "/api/team"),
  createInvite: (email: string, role: Role) => call<LinkIssued>("POST", "/api/team/invites", { email, role }),
  revokeInvite: (id: string) => call<{ ok: true }>("POST", `/api/team/invites/${encodeURIComponent(id)}/revoke`),
  readings: (buoyId: number, limit = 50) => call<{ readings: Reading[] }>("GET", `/api/readings?buoy=${buoyId}&limit=${limit}`),
  dashboards: () => call<{ dashboards: SavedView[] }>("GET", "/api/dashboards"),
  createDashboard: (name: string, shared: boolean, bays: BayConfig[]) => call<{ id: string }>("POST", "/api/dashboards", { name, shared, bays }),
  saveDashboard: (id: string, bays: BayConfig[]) => call<{ ok: true }>("POST", `/api/dashboards/${encodeURIComponent(id)}`, { bays }),
  deleteDashboard: (id: string) => call<{ ok: true }>("POST", `/api/dashboards/${encodeURIComponent(id)}/delete`),
  reports: () => call<ReportList>("GET", "/api/reports"),
  createReport: (request: ReportRequest) => call<{ id: string; link: string; rows: number }>("POST", "/api/reports", request),
  reportLink: (id: string) => call<{ link: string }>("POST", `/api/reports/${encodeURIComponent(id)}/link`),
  readingsBetween: (buoyId: number, from: string, to: string) =>
    call<{ readings: Reading[] }>("GET", `/api/readings?buoy=${buoyId}&from=${from}&to=${to}&limit=1000`),
  storage: () => call<StorageReport>("GET", "/api/storage"),
  tokens: () => call<TokenList>("GET", "/api/tokens"),
  createToken: (name: string, scopes: string[], days: number) =>
    call<{ token: string; id: string }>("POST", "/api/tokens", { name, scopes, days }),
  revokeToken: (id: string) => call<{ ok: true }>("POST", `/api/tokens/${encodeURIComponent(id)}/revoke`),
  setCommandStation: (buoyId: number, deviceId: string | null) =>
    call<{ ok: true }>("POST", `/api/fleet/buoys/${buoyId}/command-station`, { device_id: deviceId }),
  setRole: (userId: string, role: Role) => call<{ ok: true }>("POST", `/api/team/users/${encodeURIComponent(userId)}/role`, { role }),
  resetLink: (userId: string) => call<LinkIssued>("POST", `/api/team/users/${encodeURIComponent(userId)}/reset`),
  setDisabled: (userId: string, disabled: boolean) =>
    call<{ ok: true }>("POST", `/api/team/users/${encodeURIComponent(userId)}/${disabled ? "disable" : "enable"}`),

  devices: () => call<{ devices: Device[] }>("GET", "/api/devices"),
  createDevice: (name: string) => call<{ id: string; token: string; name: string }>("POST", "/api/devices", { name }),
  revokeDevice: (id: string) => call<{ ok: true }>("POST", `/api/devices/${encodeURIComponent(id)}/revoke`),
  deleteDevice: (id: string) => call<{ ok: true }>("POST", `/api/devices/${encodeURIComponent(id)}/delete`),

  audit: () => call<{ entries: AuditEntry[] }>("GET", "/api/audit"),

  fredBrief: () => call<{ brief: FredBrief | null }>("GET", "/api/assistant/brief"),
  fredStatus: () => call<FredStatus>("GET", "/api/assistant/status"),
  askFred,
  confirmFred: (id: FredCard["id"]) => call<{ message: string; link?: string }>("POST", "/api/assistant/confirm", { id }),
  declineFred: (id: FredCard["id"]) => call<{ ok: true }>("POST", "/api/assistant/decline", { id }),
};
