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
      <>Power the station on. With no WiFi saved it opens its own network, <code>SCOUT-Setup-</code> and four characters. Join it from
        a phone&rsquo;s WiFi settings, pick the network on the page that opens (a phone&rsquo;s hotspot works, on 2.4 GHz), and paste the
        token. To move it to another network later, use <b>Change WiFi</b> in its ⋯ menu on <b>Stations</b>, or hold its BOOT button
        for 3 seconds.</>
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
  "cd shore && SCOUT_CONSOLE_URL=https://console.scoutscu.com SCOUT_CONSOLE_TOKEN=scd_… python scripts/sync_console.py --data data-live --serial /dev/serial/by-id/…";

export const BUOY_STEPS: readonly HelpStep[] = [
  {
    title: "Flash the firmware",
    body: (
      <>Set <code>BUOY_ID</code> in <code>firmware/src/config.h</code> and flash the shipped <code>feather_m0</code> env (never <code>*_downlink</code>).
        The buoy reports as <code>SCOUT-01</code>, <code>SCOUT-02</code>, … (two digits). For radio settings, generate <b>one</b> key per buoy and
        put those <b>same</b> bytes in gitignored <code>downlink_key.h</code> on the buoy (that buoy&rsquo;s row only) and on the S3 (<b>every</b> buoy
        the station commands — never leave a public example key for an active id). Copy from <code>downlink_key_example.h</code>, add a row if
        <code>BUOY_ID</code> is not 1 or 2, <b>delete</b> <code>SCOUT_DOWNLINK_KEY_IS_EXAMPLE</code>, and flash both. Only the optional Python USB
        host also needs that key as <code>SCOUT_CMD_KEY_&lt;id&gt;</code>. The console never holds it.</>
    ),
  },
  {
    title: "Power it on near a shore station",
    body: <>Add it first with <b>Add buoy</b> on Fleet, then power it on. On a normal cold start with enough battery it sends one packet
      straight away (boot hello); that is skipped after a watchdog reset or in CRITICAL power mode — wait for the next UTC slot, or check
      Serial for <code>boot:</code>. The dialog turns green when the shore station passes a packet on. A buoy that is not added shows up on its
      own with that same first packet.</>,
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
    fix: <>Its device token was revoked or typed wrong. Make a new one on <b>Stations</b>, hold the station&rsquo;s BOOT button for 3 seconds, and paste it on its setup page.</>,
  },
  {
    symptom: "A setting stays “pending”",
    fix: <>The buoy has not sent a packet since the shore station delivered the change, or a different station is set to send its commands. Check which one on <b>Stations</b>.</>,
  },
  {
    symptom: "There is a gap in a chart",
    fix: <>The buoy was silent for more than 26 hours. It keeps a copy on its SD card, which can be imported later to fill the gap.</>,
  },
  {
    symptom: "An invite or reset email didn’t arrive",
    fix: (
      <>When an admin invites someone on <b>Team</b> or issues a reset link, the console emails the link from console@scoutscu.com and
        says “Email sent to …”. If it says “Couldn’t email”, or the person sees nothing (check spam), copy the link from the same card
        and send it yourself; it works the same way. Links are shown once, so if you closed it, revoke the invite and make a new one.
        Each admin can send 20 emails a day, the whole console 50.</>
    ),
  },
  {
    symptom: "I want an email when a buoy needs attention",
    fix: (
      <>Open <b>Settings → Notifications</b>, turn on <b>Email me when one of my alerts fires</b>, and add an alert: start from a
        preset (battery low, housing humidity, water temperature, buoy silent) or build one. Alerts go only to your own account
        email, at most one email per batch of readings, and each alert emails once until it clears. Use <b>Send test email</b> to
        check it arrives. Each email has a link that turns that one alert off. Guests can&rsquo;t have alerts. Each person gets at most
        10 alert emails a day and the console 30; an alert over a cap shows under <b>Recent alerts</b> instead.</>
    ),
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
  { keys: ["A"], action: "Ask Fred" },
  { keys: ["E"], action: "Customize (on Dashboard)" },
  { keys: ["⌘", "S"], action: "Save (on Dashboard)", together: true },
];
