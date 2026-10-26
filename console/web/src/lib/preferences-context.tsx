"use client";

import { createContext, useContext } from "react";
import { local, utc } from "./format";
import { DEFAULT_PREFERENCES, type Preferences } from "./preferences";

interface PreferencesValue {
  preferences: Preferences;
  /** Change some preferences; applied at once and saved for this browser. */
  update: (change: Partial<Preferences>) => void;
  /** False when this browser refused to store them (they still apply until the page closes). */
  stored: boolean;
}

export const PreferencesContext = createContext<PreferencesValue>({
  preferences: DEFAULT_PREFERENCES,
  update: () => undefined,
  stored: true,
});

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}

/** Format a time the way this browser asked: UTC (the buoy's clock) or the local zone, labelled. */
export function useWhen(): (ms: number | null | undefined) => string {
  const { preferences } = usePreferences();
  return preferences.time === "local" ? (ms) => local(ms) : utc;
}
