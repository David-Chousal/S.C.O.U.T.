"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { api } from "@/lib/api/client";
import type { BuoySettings } from "@/lib/api/types";
import { useApi } from "@/lib/use-api";
import { AccountPanel } from "@/components/account/account-panel";
import { BrowserSettingsPanel } from "./browser-settings";
import { BuoySettingsPanel } from "./buoy-settings";
import { NotificationsPanel } from "./notifications-panel";

const TABS = [
  { id: "buoys", label: "Buoys" },
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "browser", label: "This browser" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabOf(wanted: string | null): TabId {
  return TABS.find((tab) => tab.id === wanted)?.id ?? "buoys";
}

/** The Settings page: buoy settings for the team, your account (how you sign in, signing out), your
 * email alerts (Notifications), and page settings for this browser. The address's "?tab=" picks the tab, and keeps picking it: a link
 * such as the account menu's "Account settings" switches tabs even when Settings is already open.
 * Tabs follow the WAI-ARIA pattern: arrow keys move between them, Home and End jump to the ends. */
export function SettingsBoard() {
  const tabParam = useSearchParams()?.get("tab") ?? null;
  const [active, setActiveState] = useState<TabId>(() => tabOf(tabParam));
  // Follow the address when it changes from outside this page (adjusting state during render,
  // React's pattern for state that tracks a prop).
  const [seenParam, setSeenParam] = useState(tabParam);
  if (tabParam !== seenParam) {
    setSeenParam(tabParam);
    setActiveState(tabOf(tabParam));
  }
  function setActive(id: TabId) {
    setActiveState(id);
    const url = new URL(window.location.href);
    if (id === "buoys") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const buoys = useApi<BuoySettings>(api.settings);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = TABS[(next + TABS.length) % TABS.length];
    setActive(tab.id);
    buttons.current[tab.id]?.focus();
  }

  return (
    <>
      <div className="sc-tabs sc-settings-tabs" role="tablist" aria-label="Settings" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button key={tab.id} ref={(el) => { buttons.current[tab.id] = el; }} id={`tab-${tab.id}`} className="sc-tab"
            type="button" role="tab" aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id}
          className="sc-tabpanel">
          {tab.id === "buoys"
            ? <BuoySettingsPanel data={buoys.data} error={buoys.error} reload={buoys.reload} />
            : tab.id === "account" ? <AccountPanel />
              : tab.id === "notifications" ? (active === "notifications" && <NotificationsPanel />) : <BrowserSettingsPanel />}
        </div>
      ))}
    </>
  );
}
