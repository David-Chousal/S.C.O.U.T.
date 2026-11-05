import type { Session } from "@/lib/api/types";

// Each page mounts its own AppShell, so moving between pages would re-check the session and
// blank the shell every time. The last session answer is kept here: a page opened from another
// one renders straight away and re-checks in the background. Only a full page load waits.
let lastSession: Session | null = null;

export function cachedSession(): Session | null {
  return lastSession;
}

export function rememberSession(session: Session | null): void {
  lastSession = session;
}

/** Drop the cached session, so the next page re-checks it; call after signing out. */
export function forgetSession(): void {
  lastSession = null;
}
