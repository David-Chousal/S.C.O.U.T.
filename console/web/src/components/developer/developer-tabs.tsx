"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AuditTable } from "@/components/audit/audit-table";
import { DeveloperBoard } from "./developer-board";

const TABS = [
  { id: "tokens", label: "API tokens" },
  { id: "audit", label: "Audit log" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabFromUrl(): TabId {
  const wanted = new URLSearchParams(window.location.search).get("tab");
  return TABS.find((tab) => tab.id === wanted)?.id ?? "tokens";
}

/** The Developer page: API tokens and the audit log as two tabs. "?tab=audit" opens the log, so
 * the old /audit/ address and links can land on it. Tabs follow the WAI-ARIA pattern. */
export function DeveloperTabs() {
  // Safe to read the URL while rendering: AppShell renders page content only once the session
  // has loaded in the browser, never in the prerendered HTML, so there is no hydration mismatch.
  const [active, setActive] = useState<TabId>(() => (typeof window === "undefined" ? "tokens" : tabFromUrl()));
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  function choose(id: TabId) {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === "tokens") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = TABS[(next + TABS.length) % TABS.length];
    choose(tab.id);
    buttons.current[tab.id]?.focus();
  }

  return (
    <>
      <div className="sc-tabs" role="tablist" aria-label="Developer" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button key={tab.id} ref={(el) => { buttons.current[tab.id] = el; }} id={`tab-${tab.id}`} className="sc-tab"
            type="button" role="tab" aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1} onClick={() => choose(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id}
          className="sc-tabpanel">
          {active === tab.id && (tab.id === "tokens" ? <DeveloperBoard /> : <AuditTable />)}
        </div>
      ))}
    </>
  );
}
