"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Banner } from "@/components/feedback/banner";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ApiError, type Session } from "@/lib/api/types";
import { applyTheme, DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

type Load = { kind: "loading" } | { kind: "ready"; session: Session } | { kind: "failed"; message: string };

// Each page mounts its own AppShell, so moving between pages would re-check the session and
// blank the shell every time. The last session answer is kept here: a page opened from another
// one renders straight away and re-checks in the background. Only a full page load waits.
let lastSession: Session | null = null;

/** Every signed-in page: loads the session (or goes to sign-in), then sidebar, top bar, content. */
export function AppShell({ title, actions, children }: AppShellProps) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>(() => (lastSession ? { kind: "ready", session: lastSession } : { kind: "loading" }));
  // The static HTML is prerendered with the defaults; nothing that reads preferences renders
  // until the session loads, so reading storage here cannot cause a hydration mismatch. The
  // theme itself was already applied before paint by the boot script in app/layout.tsx.
  const [preferences, setPreferences] = useState<Preferences>(() =>
    typeof window === "undefined" ? DEFAULT_PREFERENCES : loadPreferences(),
  );
  const [stored, setStored] = useState(true);

  const update = useCallback((change: Partial<Preferences>) => {
    const next = { ...preferences, ...change };
    applyTheme(next.theme);
    setStored(savePreferences(next));
    setPreferences(next);
  }, [preferences]);
  const preferencesValue = useMemo(() => ({ preferences, update, stored }), [preferences, update, stored]);

  useEffect(() => {
    let live = true;
    api.session().then(
      (session) => {
        lastSession = session;
        if (live) setLoad({ kind: "ready", session });
      },
      (error: unknown) => {
        if (error instanceof ApiError && error.status === 401) lastSession = null;
        if (!live) return;
        if (error instanceof ApiError && error.status === 401) router.replace("/login/");
        else setLoad({ kind: "failed", message: error instanceof Error ? error.message : "The console did not answer." });
      },
    );
    return () => {
      live = false;
    };
  }, [router]);

  async function signOut() {
    await api.signOut().catch(() => undefined);
    lastSession = null;
    router.replace("/login/");
  }

  if (load.kind !== "ready") {
    // The frame stays up while the session loads, so the page never flashes blank.
    return (
      <div className="sc-shell">
        <Sidebar onSignOut={signOut} shortcuts={preferences.shortcuts} />
        <div className="sc-shell__page">
          <TopBar title={title} />
          <main className="sc-main" aria-busy={load.kind === "loading"}>
            {load.kind === "loading"
              ? <span className="sc-tag">Checking your session…</span>
              : <Banner tone="failed">{load.message}</Banner>}
          </main>
        </div>
      </div>
    );
  }
  return (
    <SessionContext value={load.session}>
    <PreferencesContext value={preferencesValue}>
      <Toaster>
        <div className="sc-shell">
          <Sidebar user={load.session.user} onSignOut={signOut} shortcuts={preferences.shortcuts} />
          <div className="sc-shell__page">
            <TopBar title={title} actions={actions} />
            <main className="sc-main">{children}</main>
          </div>
        </div>
      </Toaster>
    </PreferencesContext>
    </SessionContext>
  );
}
