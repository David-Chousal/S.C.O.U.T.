"use client";

import { Banner } from "@/components/feedback/banner";
import type { ThemeChoice, TimeChoice } from "@/lib/preferences";
import { usePreferences, useWhen } from "@/lib/preferences-context";

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match system" },
];
const TIMES: { value: TimeChoice; label: string }[] = [
  { value: "utc", label: "UTC" },
  { value: "local", label: "My time zone" },
];

function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <div className="sc-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Settings → This browser: how the console looks and reads here. Saved in this browser only. */
export function BrowserSettingsPanel() {
  const { preferences, update, stored } = usePreferences();
  const when = useWhen();
  const sample = Date.UTC(2026, 9, 26, 16, 10);

  return (
    <section className="sc-bay" aria-labelledby="browser-title">
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id="browser-title">Page settings</h3>
        <span className="sc-tag">This browser only · saved as you change them</span>
      </div>
      {!stored && <Banner tone="caution">This browser is blocking storage, so these apply until you close the page.</Banner>}
      <div className="sc-settings-form">
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag" id="theme-label">Theme</span></span>
          <Segmented label="Theme" options={THEMES} value={preferences.theme} onChange={(theme) => update({ theme })} />
          <span className="sc-help">Light is the default. Match system follows your device&rsquo;s dark mode.</span>
        </div>
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Times</span></span>
          <Segmented label="Times" options={TIMES} value={preferences.time} onChange={(time) => update({ time })} />
          <span className="sc-help">The buoy keeps UTC. Example: the 16:10 UTC slot reads <span className="sc-num">{when(sample)}</span>.</span>
        </div>
        <div className="sc-fieldset sc-settings-form__wide">
          <span className="sc-fieldset__label"><span className="sc-tag">Keyboard shortcuts</span></span>
          <label className="sc-switch">
            <input type="checkbox" role="switch" checked={preferences.shortcuts}
              onChange={(event) => update({ shortcuts: event.target.checked })} />
            <span className="sc-switch__state">{preferences.shortcuts ? "On" : "Off"}</span>
            <span>&ldquo;G then a letter&rdquo; to jump between pages (G F Fleet, G P Settings…)</span>
          </label>
        </div>
      </div>
    </section>
  );
}
