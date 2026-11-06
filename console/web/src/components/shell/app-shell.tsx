"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FredPanel } from "@/components/assistant/fred-panel";
import { Banner } from "@/components/feedback/banner";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ApiError, type Session } from "@/lib/api/types";
import { applyTheme, DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from "@/lib/preferences";
import { FRED } from "@/lib/shell-layout";
import { ViewOnlyNoteContext } from "@/lib/view-only-note";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { cachedSession, forgetSession, rememberSession } from "./session-cache";
import { ResizeHandle } from "./resize-handle";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { useShellLayout } from "./use-shell-layout";

/** The page's title, with its own actions beside it. */
function PageHead({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="sc-page-head">
      <h1 className="sc-page-head__title">{title}</h1>
      {actions && <div className="sc-page-head__actions">{actions}</div>}
    </header>
  );
}

interface AppShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

type Load = { kind: "loading" } | { kind: "ready"; session: Session } | { kind: "failed"; message: string };


/** Every signed-in page: loads the session (or goes to sign-in), then sidebar, top bar, content. */
export function AppShell({ title, actions, children }: AppShellProps) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>(() => {
    const cached = cachedSession();
    return cached ? { kind: "ready", session: cached } : { kind: "loading" };
  });
  // The static HTML is prerendered with the defaults; nothing that reads preferences renders
  // until the session loads, so reading storage here cannot cause a hydration mismatch. The
  // theme itself was already applied before paint by the boot script in app/layout.tsx.
  const [preferences, setPreferences] = useState<Preferences>(() =>
    typeof window === "undefined" ? DEFAULT_PREFERENCES : loadPreferences(),
  );
  const [stored, setStored] = useState(true);
  // Fred mounts on first open and then stays, so it can slide shut and keep its conversation.
  const [fredOpen, setFredOpen] = useState(false);
  const [fredMounted, setFredMounted] = useState(false);
  // The open page's "View only: …" note, shown in the top bar (lib/view-only-note.tsx).
  const [viewOnlyNote, setViewOnlyNote] = useState<string | null>(null);
  const { shellRef, layout, fred, fredMax, dragging, setDragging, resizeSide, toggleSide, resizeFred } = useShellLayout(fredOpen);
  const toggleFred = useCallback(() => {
    setFredMounted(true);
    setFredOpen((open) => !open);
  }, []);
  const closeFred = useCallback(() => {
    setFredOpen(false);
    document.querySelector<HTMLButtonElement>(".sc-ask")?.focus();
  }, []);

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
        rememberSession(session);
        if (live) setLoad({ kind: "ready", session });
      },
      (error: unknown) => {
        if (error instanceof ApiError && error.status === 401) forgetSession();
        if (!live) return;
        if (error instanceof ApiError && error.status === 401) router.replace("/login/");
        else setLoad({ kind: "failed", message: error instanceof Error ? error.message : "The console did not answer." });
      },
    );
    return () => {
      live = false;
    };
  }, [router]);

  if (load.kind !== "ready") {
    // The frame stays up while the session loads, so the page never flashes blank.
    return (
      <div className="sc-shell" ref={shellRef}>
        <TopBar railMenu={layout.sideCollapsed} />
        <Sidebar shortcuts={preferences.shortcuts} collapsed={layout.sideCollapsed} width={layout.sideWidth} />
        <div className="sc-shell__page">
          <main className="sc-main" aria-busy={load.kind === "loading"}>
            <PageHead title={title} />
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
        <div ref={shellRef}
          className={`sc-shell${fredOpen ? " sc-shell--fred" : ""}${dragging ? " sc-shell--resizing" : ""}`}>
          <TopBar user={load.session.user} fredOpen={fredOpen} onToggleFred={toggleFred} railMenu={layout.sideCollapsed} note={viewOnlyNote} />
          <Sidebar shortcuts={preferences.shortcuts} collapsed={layout.sideCollapsed} width={layout.sideWidth}
            onResize={resizeSide} onDragging={setDragging} onToggle={toggleSide} />
          <div className="sc-shell__page">
            <main className="sc-main">
              <PageHead title={title} actions={actions} />
              <ViewOnlyNoteContext value={setViewOnlyNote}>{children}</ViewOnlyNoteContext>
            </main>
          </div>
          <div id="sc-fred-dock" className="sc-fred-dock" aria-hidden={!fredOpen} inert={!fredOpen}>
            {fredMounted && (
              <>
                <ResizeHandle label="Fred's panel width" value={fred} min={FRED.min} max={fredMax} grows="left"
                  onResize={resizeFred} onDragging={setDragging} className="sc-resize--fred" />
                <FredPanel user={load.session.user} open={fredOpen} onClose={closeFred} />
              </>
            )}
          </div>
        </div>
      </Toaster>
    </PreferencesContext>
    </SessionContext>
  );
}
