// The one module that talks to the console Worker. Same-origin fetches carry the session cookie;
// every write sends the session's CSRF token in X-CSRF-Token, which the Worker checks together
// with the Origin header. Errors come back as ApiError with the Worker's message.

import {
  ApiError,
  type AuditEntry,
  type Device,
  type BuoySettings,
  type Fleet,
  type Invite,
  type Providers,
  type Reading,
  type Role,
  type Session,
  type StorageReport,
  type Team,
  type TokenList,
} from "./types";

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
  requestTxCount: (buoyId: number, txCount: number) =>
    call<{ ok: true }>("POST", `/api/fleet/buoys/${buoyId}/tx-count`, { tx_count: txCount }),
  addBuoy: (buoyId: number, label: string) => call<{ ok: true }>("POST", "/api/fleet/buoys", { buoy_id: buoyId, label }),
  settings: () => call<BuoySettings>("GET", "/api/settings"),
  renameBuoy: (buoyId: number, label: string) => call<{ ok: true }>("POST", `/api/fleet/buoys/${buoyId}/label`, { label }),

  team: () => call<Team>("GET", "/api/team"),
  createInvite: (email: string, role: Role) => call<{ link: string }>("POST", "/api/team/invites", { email, role }),
  revokeInvite: (id: string) => call<{ ok: true }>("POST", `/api/team/invites/${encodeURIComponent(id)}/revoke`),
  readings: (buoyId: number, limit = 50) => call<{ readings: Reading[] }>("GET", `/api/readings?buoy=${buoyId}&limit=${limit}`),
  storage: () => call<StorageReport>("GET", "/api/storage"),
  tokens: () => call<TokenList>("GET", "/api/tokens"),
  createToken: (name: string, scopes: string[], days: number) =>
    call<{ token: string; id: string }>("POST", "/api/tokens", { name, scopes, days }),
  revokeToken: (id: string) => call<{ ok: true }>("POST", `/api/tokens/${encodeURIComponent(id)}/revoke`),
  setCommandStation: (buoyId: number, deviceId: string | null) =>
    call<{ ok: true }>("POST", `/api/fleet/buoys/${buoyId}/command-station`, { device_id: deviceId }),
  setRole: (userId: string, role: Role) => call<{ ok: true }>("POST", `/api/team/users/${encodeURIComponent(userId)}/role`, { role }),
  resetLink: (userId: string) => call<{ link: string }>("POST", `/api/team/users/${encodeURIComponent(userId)}/reset`),
  setDisabled: (userId: string, disabled: boolean) =>
    call<{ ok: true }>("POST", `/api/team/users/${encodeURIComponent(userId)}/${disabled ? "disable" : "enable"}`),

  devices: () => call<{ devices: Device[] }>("GET", "/api/devices"),
  createDevice: (name: string) => call<{ token: string; name: string }>("POST", "/api/devices", { name }),
  revokeDevice: (id: string) => call<{ ok: true }>("POST", `/api/devices/${encodeURIComponent(id)}/revoke`),

  audit: () => call<{ entries: AuditEntry[] }>("GET", "/api/audit"),
};
