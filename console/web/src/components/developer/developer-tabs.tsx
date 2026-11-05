"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { AuditTable } from "@/components/audit/audit-table";
import { DeveloperBoard } from "./developer-board";

const TABS = [
  { id: "tokens", label: "API tokens" },
  { id: "audit", label: "Audit log" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabOf(wanted: string | null): TabId {
  return TABS.find((tab) => tab.id === wanted)?.id ?? "tokens";
}

/** The Developer page: API tokens and the audit log as two tabs. "?tab=audit" opens the log, so
 * the old /audit/ address and links can land on it, and keeps following the address when it
 * changes. Tabs follow the WAI-ARIA pattern. */
export function DeveloperTabs() {
  const tabParam = useSearchParams()?.get("tab") ?? null;
  const [active, setActive] = useState<TabId>(() => tabOf(tabParam));
  const [seenParam, setSeenParam] = useState(tabParam);
  if (tabParam !== seenParam) {
    setSeenParam(tabParam);
    setActive(tabOf(tabParam));
  }
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
