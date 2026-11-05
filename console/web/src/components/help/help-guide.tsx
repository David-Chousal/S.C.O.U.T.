import type { ReactNode } from "react";

interface HelpSection {
  id: string;
  title: string;
  tag: string;
  body: ReactNode;
}

const SECTIONS: readonly HelpSection[] = [
  {
    id: "flow",
    title: "How data reaches the console",
    tag: "Buoy → shore → console",
    body: (
      <>
        <p className="sc-help">
          The buoy never talks to the console. It sends a 44-byte LoRa packet in each transmit slot (00:10, 08:10 and 16:10 UTC
          by default). The <strong>shore station</strong>, an ESP32-S3 Feather with a LoRa FeatherWing, receives it and pushes the
          reading here over WiFi with its device token. Every 10 minutes it also reads each buoy&apos;s requested transmit count and
          sends it to the buoy right after that buoy&apos;s next packet. Without WiFi, a computer plugged into the S3 over USB does the
          same job (<code>sync_console.py</code>).
        </p>
        <code className="sc-secret">buoy ──LoRa 915 MHz──► shore S3 ──WiFi, HTTPS──► console   (fallback: S3 ──USB──► computer ──HTTPS──► console)</code>
      </>
    ),
  },
  {
    id: "shore",
    title: "Connect a shore station",
    tag: "Admin",
    body: (
      <ol className="sc-help sc-help-steps">
        <li><strong>Make a device token.</strong> Stations → Shore stations → name the station (e.g. &quot;Kona pier&quot;) → copy the
          <code>scd_…</code> token. It is shown once and stored hashed; make a new one if it is lost.</li>
        <li><strong>Give the S3 its WiFi and token.</strong> Copy <code>firmware/src/shore_rx/shore_secrets_example.h</code> to
          <code>shore_secrets.h</code> (never committed), fill in the WiFi name and password and the <code>scd_…</code> token, then
          flash the <code>feather_esp32s3_shore</code> environment with PlatformIO. It pushes on its own from then on and keeps its
          clock from NTP.</li>
        <li><strong>No WiFi at the site?</strong> Plug the S3 into a Linux computer (a Raspberry Pi works), run the receiver as a
          service (<code>shore/deploy/scout-shore.service</code>, <code>--serial</code> set to the S3&apos;s name under
          <code>/dev/serial/by-id/</code>), and push on a timer with the token in the environment, never in a file in the repo:
          <code className="sc-secret">SCOUT_CONSOLE_URL=https://console.scoutscu.com SCOUT_CONSOLE_TOKEN=scd_… python scripts/sync_console.py --data data-live --serial /dev/serial/by-id/…</code>
          Pushing the same day twice is safe; repeats are ignored.</li>
        <li><strong>Check it on Stations:</strong> the station shows &quot;last heard&quot; within a minute of its first push. If two stations
          hear the same buoy, pick which one sends that buoy&apos;s commands there.</li>
      </ol>
    ),
  },
  {
    id: "buoy",
    title: "Add a buoy",
    tag: "Member",
    body: (
      <ol className="sc-help sc-help-steps">
        <li><strong>Flash the firmware</strong> from <code>firmware/</code> with PlatformIO, with <code>BUOY_ID</code> set in
          <code>src/config.h</code> (it reports as <code>SCOUT-&lt;id&gt;</code>). For settings by radio, give it its own downlink key in
          <code>src/downlink_key.h</code> (never committed) and the same key to the shore station as <code>SCOUT_CMD_KEY_&lt;id&gt;</code>;
          the console never holds it.</li>
        <li><strong>Power it within range</strong> of a running shore station. Nothing else is needed: the buoy appears on Readings and
          Fleet with its first pushed packet. You can also add it by hand on Fleet, to name it before it reports.</li>
        <li><strong>Name it</strong> in Settings → Buoys. The name is the console&apos;s label only; the buoy keeps its ID.</li>
      </ol>
    ),
  },
  {
    id: "settings",
    title: "Change how a buoy behaves",
    tag: "Member",
    body: (
      <p className="sc-help">
        Settings → Buoys has a control for each remote setting: transmits a day, slot phase, reading interval, hydrophone
        clip, power thresholds and the housing humidity alert (Fleet also changes the transmit count). The shore station sends
        the whole set right after the buoy&apos;s next packet; it shows <strong>pending</strong> until a packet reports the
        same settings digest, then <strong>confirmed</strong>, or <strong>rejected</strong> if the buoy refused it. The radio
        and the listen window never change by radio; they need a firmware update.
      </p>
    ),
  },
  {
    id: "roles",
    title: "Roles",
    tag: "Who can do what",
    body: (
      <dl className="sc-pair">
        <div><dt className="sc-tag">Guest</dt><dd className="sc-help">Sees every page with the controls off. Signs in with a name and email, can never be promoted.</dd></div>
        <div><dt className="sc-tag">Member</dt><dd className="sc-help">Also changes buoy settings, dashboards, reports and API tokens.</dd></div>
        <div><dt className="sc-tag">Admin</dt><dd className="sc-help">Also manages people (Team) and shore stations (Stations).</dd></div>
      </dl>
    ),
  },
  {
    id: "keys",
    title: "Keyboard shortcuts",
    tag: "Settings → This browser",
    body: (
      <p className="sc-help">
        Press <kbd>G</kbd> then a letter to jump: <kbd>H</kbd> Dashboard, <kbd>F</kbd> Fleet, <kbd>R</kbd> Readings, <kbd>E</kbd> Reports,
        <kbd>S</kbd> Stations, <kbd>T</kbd> Team, <kbd>P</kbd> Settings, <kbd>D</kbd> Developer, <kbd>Y</kbd> Help, <kbd>A</kbd> Account.
        On the Dashboard, <kbd>E</kbd> customizes and <kbd>⌘S</kbd> saves. Turn shortcuts off in Settings → This browser.
      </p>
    ),
  },
  {
    id: "api",
    title: "Scripts and notebooks",
    tag: "Developer",
    body: (
      <p className="sc-help">
        Make a personal API token on Developer → API tokens and send it as <code>Authorization: Bearer sct_…</code> to
        <code>/api/v1</code>. It acts with your role, limited to its scopes. Every change anyone makes is on Developer → Audit log.
      </p>
    ),
  },
  {
    id: "trouble",
    title: "When something looks wrong",
    tag: "Troubleshooting",
    body: (
      <ul className="sc-help sc-help-steps">
        <li><strong>A buoy is stale:</strong> check Stations first. If the shore station is stale too, the problem is ashore
          (no power, WiFi down, or on the USB fallback the computer off: <code>journalctl -u scout-shore -f</code>). If only the buoy is, it missed its slots: battery,
          antenna, or out of range.</li>
        <li><strong>The shore station gets 401:</strong> its device token was revoked or mistyped. Make a new one on Stations.</li>
        <li><strong>A transmit count stays pending:</strong> the buoy has not sent since the shore station delivered it, or a different
          station is set to send its commands (Stations).</li>
        <li><strong>A gap in a trend line:</strong> the buoy was silent for over 26 hours. Readings it stored on its SD card can be
          imported later and fill the gap.</li>
      </ul>
    ),
  },
];

/** The Help page: how to connect a buoy and a shore station, and what else a console user needs. */
export function HelpGuide() {
  return (
    <>
      <nav className="sc-bay" aria-label="On this page">
        <ul className="sc-help-toc">
          {SECTIONS.map((section) => <li key={section.id}><a className="sc-link" href={`#${section.id}`}>{section.title}</a></li>)}
        </ul>
      </nav>
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="sc-bay" aria-labelledby={`${section.id}-title`}>
          <div className="sc-bay__head">
            <h2 className="sc-bay__title" id={`${section.id}-title`}>{section.title}</h2>
            <span className="sc-tag">{section.tag}</span>
          </div>
          {section.body}
        </section>
      ))}
    </>
  );
}
