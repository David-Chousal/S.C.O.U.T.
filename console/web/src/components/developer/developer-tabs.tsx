"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AuditTable } from "@/components/audit/audit-table";
import { can, useSession } from "@/lib/session";
import { DeveloperBoard } from "./developer-board";
import { StoragePanel } from "./storage-panel";

const ALL_TABS = [
  { id: "tokens", label: "API tokens" },
  { id: "audit", label: "Audit log" },
  { id: "storage", label: "Storage" },
] as const;
type TabId = (typeof ALL_TABS)[number]["id"];
type Tab = (typeof ALL_TABS)[number];

function tabOf(tabs: readonly Tab[], wanted: string | null): TabId {
  return tabs.find((tab) => tab.id === wanted)?.id ?? "tokens";
}

const PANELS: Record<TabId, () => ReactNode> = {
  tokens: () => <DeveloperBoard />,
  audit: () => <AuditTable />,
  storage: () => <StoragePanel />,
};

/** The Developer page: API tokens, the audit log and, for admins, storage (R2 use, backups and
 * Fred's use today) as tabs. "?tab=audit" opens the log, so the old /audit/ address and links can
 * land on it, and keeps following the address when it changes. Tabs follow the WAI-ARIA pattern. */
export function DeveloperTabs() {
  const { user } = useSession();
  const TABS = ALL_TABS.filter((tab) => tab.id !== "storage" || can(user.role, "storage.read"));
  const tabParam = useSearchParams()?.get("tab") ?? null;
  const [active, setActive] = useState<TabId>(() => tabOf(TABS, tabParam));
  const [seenParam, setSeenParam] = useState(tabParam);
  if (tabParam !== seenParam) {
    setSeenParam(tabParam);
    setActive(tabOf(TABS, tabParam));
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
          {active === tab.id && PANELS[tab.id]()}
        </div>
      ))}
    </>
  );
}
