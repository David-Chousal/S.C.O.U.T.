"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { api } from "@/lib/api/client";
import type { BuoySettings } from "@/lib/api/types";
import { can, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { BrowserSettingsPanel } from "./browser-settings";
import { BuoySettingsPanel } from "./buoy-settings";
import { StoragePanel } from "./storage-panel";

const TABS = [
  { id: "buoys", label: "Buoys" },
  { id: "browser", label: "This browser" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** The Settings page: buoy settings for the team, page settings for this browser. Tabs follow
 * the WAI-ARIA pattern: arrow keys move between them, Home and End jump to the ends. */
export function SettingsBoard() {
  const { user } = useSession();
  const [active, setActive] = useState<TabId>("buoys");
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
      <div className="sc-tabs" role="tablist" aria-label="Settings" onKeyDown={onKeyDown}>
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
            ? <>
              <BuoySettingsPanel data={buoys.data} error={buoys.error} reload={buoys.reload} />
              {can(user.role, "storage.read") && <StoragePanel />}
            </>
            : <BrowserSettingsPanel />}
        </div>
      ))}
    </>
  );
}
