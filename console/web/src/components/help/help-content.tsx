import type { ReactNode } from "react";
import type { IconName } from "@/components/ui/icon-paths";

export interface HelpTask {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  who: string;
}

export interface HelpStep {
  title: string;
  body: ReactNode;
  command?: string;
}

export interface HelpProblem {
  symptom: string;
  fix: ReactNode;
}

/** The four jobs people open Help for, in the order they usually meet them. */
export const TASKS: readonly HelpTask[] = [
  { id: "shore", icon: "connections", title: "Connect a shore station", summary: "Get readings flowing from the pier to the console.", who: "Admin" },
  { id: "buoy", icon: "plus", title: "Add a buoy", summary: "Bring a new buoy online and give it a name.", who: "Member" },
  { id: "settings", icon: "settings", title: "Change how a buoy behaves", summary: "Change its schedule, interval or alerts by radio.", who: "Member" },
  { id: "trouble", icon: "warning", title: "Fix something that looks wrong", summary: "Stale buoys, rejected pushes, gaps in a chart.", who: "Anyone" },
];

export const SHORE_STEPS: readonly HelpStep[] = [
  {
    title: "Make a device token",
    body: (
      <>Go to <b>Stations → Shore stations</b>, give the station a name such as &ldquo;Kona pier&rdquo;, and copy the <code>scd_…</code> token.
        You only see it once. If you lose it, make a new one.</>
    ),
  },
  {
    title: "Give the shore station its WiFi and token",
    body: (
      <>Copy <code>firmware/src/shore_rx/shore_secrets_example.h</code> to <code>shore_secrets.h</code>, then fill in the WiFi name,
        password and token. That file is never committed. Flash the <code>feather_esp32s3_shore</code> environment with PlatformIO.</>
    ),
  },
  {
    title: "Watch it connect",
    body: <>Leave Stations open after making the token. A live check under it turns green the moment the station joins WiFi and
      checks in, usually within seconds of power-on. From now on it sends readings by itself.
      If two stations hear the same buoy, choose there which one sends that buoy&rsquo;s commands.</>,
  },
];

export const USB_FALLBACK_COMMAND =
  "SCOUT_CONSOLE_URL=https://console.scoutscu.com SCOUT_CONSOLE_TOKEN=scd_… python scripts/sync_console.py --data data-live --serial /dev/serial/by-id/…";

export const BUOY_STEPS: readonly HelpStep[] = [
  {
    title: "Flash the firmware",
    body: (
      <>Set <code>BUOY_ID</code> in <code>firmware/src/config.h</code> and flash it with PlatformIO. The buoy reports as <code>SCOUT-&lt;id&gt;</code>.
        To change its settings by radio later, also give it a downlink key in <code>src/downlink_key.h</code> (never committed) and the
        same key to the shore station as <code>SCOUT_CMD_KEY_&lt;id&gt;</code>. The console never holds that key.</>
    ),
  },
  {
    title: "Power it on near a shore station",
    body: <>Add it first with <b>Add buoy</b> on Fleet, then power it on. It sends one packet straight away, and the dialog turns green
      as soon as the shore station passes it on. A buoy that is not added shows up on its own with that same first packet.</>,
  },
  {
    title: "Give it a name",
    body: <>Open <b>Settings → Buoys</b>. The name is just a label in the console; the buoy keeps its ID.</>,
  },
];

export const PROBLEMS: readonly HelpProblem[] = [
  {
    symptom: "A buoy says it is stale",
    fix: (
      <>Open <b>Stations</b> first. If the shore station is stale too, the problem is on land: power, WiFi, or (on the USB setup) the computer
        is off. Run <code>journalctl -u scout-shore -f</code> on it to see. If only the buoy is stale, it missed its slots: check the battery,
        the antenna, and that it is in range.</>
    ),
  },
  {
    symptom: "The shore station gets a 401 error",
    fix: <>Its device token was revoked or typed wrong. Make a new one on <b>Stations</b> and flash it again.</>,
  },
  {
    symptom: "A setting stays “pending”",
    fix: <>The buoy has not sent a packet since the shore station delivered the change, or a different station is set to send its commands. Check which one on <b>Stations</b>.</>,
  },
  {
    symptom: "There is a gap in a chart",
    fix: <>The buoy was silent for more than 26 hours. It keeps a copy on its SD card, which can be imported later to fill the gap.</>,
  },
];

export const ROLES: readonly { role: string; can: string }[] = [
  { role: "Guest", can: "Sees every page, with the controls switched off. Signs in with a name and email, and cannot be promoted." },
  { role: "Member", can: "Everything a guest can, plus changing buoy settings, dashboards, reports and API tokens." },
  { role: "Admin", can: "Everything a member can, plus managing people on Team and shore stations on Stations." },
];

export const SHORTCUTS: readonly { keys: readonly string[]; action: string; together?: boolean }[] = [
  { keys: ["G", "H"], action: "Dashboard" },
  { keys: ["G", "F"], action: "Fleet" },
  { keys: ["G", "R"], action: "Readings" },
  { keys: ["G", "E"], action: "Reports" },
  { keys: ["G", "S"], action: "Stations" },
  { keys: ["G", "T"], action: "Team" },
  { keys: ["G", "P"], action: "Settings" },
  { keys: ["G", "D"], action: "Developer" },
  { keys: ["G", "Y"], action: "Help" },
  { keys: ["G", "A"], action: "Account" },
  { keys: ["E"], action: "Customize (on Dashboard)" },
  { keys: ["⌘", "S"], action: "Save (on Dashboard)", together: true },
];
