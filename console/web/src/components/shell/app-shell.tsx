"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Banner } from "@/components/feedback/banner";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ApiError, type Session } from "@/lib/api/types";
import { SessionContext } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

type Load = { kind: "loading" } | { kind: "ready"; session: Session } | { kind: "failed"; message: string };

/** Every signed-in page: loads the session (or goes to sign-in), then sidebar, top bar, content. */
export function AppShell({ title, actions, children }: AppShellProps) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    api.session().then(
      (session) => live && setLoad({ kind: "ready", session }),
      (error: unknown) => {
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
    router.replace("/login/");
  }

  if (load.kind === "loading") {
    return <main className="sc-main" aria-busy="true"><span className="sc-tag">Checking your session…</span></main>;
  }
  if (load.kind === "failed") {
    return <main className="sc-main"><Banner tone="failed">{load.message}</Banner></main>;
  }
  return (
    <SessionContext value={load.session}>
      <Toaster>
        <div className="sc-shell">
          <Sidebar user={load.session.user} onSignOut={signOut} />
          <div className="sc-shell__page">
            <TopBar title={title} actions={actions} />
            <main className="sc-main">{children}</main>
          </div>
        </div>
      </Toaster>
    </SessionContext>
  );
}
