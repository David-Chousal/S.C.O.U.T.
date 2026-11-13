import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { CopyCommand } from "./copy-command";
import {
  BUOY_STEPS, PROBLEMS, ROLES, SHORE_STEPS, SHORTCUTS, TASKS, USB_FALLBACK_COMMAND, type HelpStep,
} from "./help-content";

interface GuideSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}

function GuideSection({ id, eyebrow, title, lead, children }: GuideSectionProps) {
  return (
    <section id={id} className="sc-guide__section" aria-labelledby={`${id}-title`}>
      <header className="sc-guide__head">
        <span className="sc-guide__eyebrow">{eyebrow}</span>
        <h2 className="sc-guide__title" id={`${id}-title`}>{title}</h2>
        {lead ? <p className="sc-guide__lead">{lead}</p> : null}
      </header>
      {children}
    </section>
  );
}

interface StepsProps {
  steps: readonly HelpStep[];
  done: ReactNode;
}

function Steps({ steps, done }: StepsProps) {
  return (
    <>
      <ol className="sc-guide__steps">
        {steps.map((step) => (
          <li key={step.title} className="sc-guide__step">
            <h3 className="sc-guide__step-title">{step.title}</h3>
            <p className="sc-guide__text">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="sc-guide__done"><Icon name="check" /><span><b>Done when</b> {done}</span></p>
    </>
  );
}

const FLOW_NODES = [
  { name: "Buoy", detail: "Measures and stores" },
  { name: "Shore station", detail: "ESP32-S3 within radio range" },
  { name: "Console", detail: "You are here" },
];
const FLOW_LINKS = ["LoRa radio", "WiFi"];

function FlowDiagram() {
  return (
    <ol className="sc-guide__flow" aria-label="Buoy to shore station to console">
      {FLOW_NODES.map((node, index) => (
        <li key={node.name} className="sc-guide__flow-item">
          <div className={index === FLOW_NODES.length - 1 ? "sc-guide__node sc-guide__node--here" : "sc-guide__node"}>
            <strong>{node.name}</strong><span>{node.detail}</span>
          </div>
          {FLOW_LINKS[index] ? <span className="sc-guide__wire">{FLOW_LINKS[index]}</span> : null}
        </li>
      ))}
    </ol>
  );
}

function TaskPicker() {
  return (
    <nav className="sc-guide__intro" aria-label="Help topics">
      <p className="sc-guide__lead">What do you need to do?</p>
      <ul className="sc-guide__tasks">
        {TASKS.map((task) => (
          <li key={task.id}>
            <a className="sc-guide__task" href={`#${task.id}`}>
              <Icon name={task.icon} size={20} />
              <strong>{task.title}</strong>
              <span>{task.summary}</span>
              <small>{task.who}</small>
              <Icon name="chevron-right" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const PAGE_INDEX = [
  { id: "flow", label: "How readings reach the console" },
  { id: "shore", label: "Connect a shore station" },
  { id: "buoy", label: "Add a buoy" },
  { id: "settings", label: "Change how a buoy behaves" },
  { id: "trouble", label: "Fix something that looks wrong" },
  { id: "fred", label: "Ask Fred" },
  { id: "roles", label: "Who can do what" },
  { id: "keys", label: "Keyboard shortcuts" },
  { id: "api", label: "Scripts and notebooks" },
];

function PageIndex() {
  return (
    <nav className="sc-guide__index" aria-label="On this page">
      <span className="sc-guide__eyebrow">On this page</span>
      <ul>
        {PAGE_INDEX.map((entry) => <li key={entry.id}><a href={`#${entry.id}`}>{entry.label}</a></li>)}
      </ul>
    </nav>
  );
}

function ShoreFallback() {
  return (
    <details className="sc-guide__more">
      <summary>No WiFi at the site? Use a computer instead<Icon name="chevron-down" /></summary>
      <div className="sc-guide__more-body">
        <p className="sc-guide__text">
          Plug the shore station into a Linux computer (a Raspberry Pi works) and run the receiver as a service with{" "}
          <code>shore/deploy/scout-shore.service</code>, setting <code>--serial</code> to the device under <code>/dev/serial/by-id/</code>.
          Then push on a timer. Keep the token in the environment, never in a file in the repo:
        </p>
        <CopyCommand command={USB_FALLBACK_COMMAND} />
        <p className="sc-guide__text">Pushing the same day twice is safe; repeats are ignored.</p>
      </div>
    </details>
  );
}

function Reference() {
  return (
    <div className="sc-guide__reference">
      <GuideSection id="roles" eyebrow="Reference" title="Who can do what">
        <dl className="sc-guide__roles">
          {ROLES.map((row) => (
            <div key={row.role}><dt className="sc-tag">{row.role}</dt><dd className="sc-guide__text">{row.can}</dd></div>
          ))}
        </dl>
      </GuideSection>
      <GuideSection id="keys" eyebrow="Reference" title="Keyboard shortcuts"
        lead={<>Press <kbd>G</kbd>, then a letter, to jump to a page. They are off until you turn them on in <b>Settings → This browser</b>.</>}>
        <dl className="sc-guide__shortcuts">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.action}>
              <dt aria-label={shortcut.keys.join(shortcut.together ? " plus " : " then ")}>
                {shortcut.keys.map((key, index) => <span key={key}>{index > 0 ? <i>{shortcut.together ? "+" : "then"}</i> : null}<kbd>{key}</kbd></span>)}
              </dt>
              <dd>{shortcut.action}</dd>
            </div>
          ))}
        </dl>
      </GuideSection>
    </div>
  );
}

/** The Help page: task-first how-tos, one short explanation, troubleshooting by symptom, then reference. */
export function HelpGuide() {
  return (
    <div className="sc-guide">
      <TaskPicker />
      <PageIndex />
      <div className="sc-guide__body">
        <GuideSection id="flow" eyebrow="Before you start" title="How readings reach the console"
          lead="The buoy never talks to the console directly. A shore station listens for it and passes each reading on.">
          <FlowDiagram />
          <p className="sc-guide__text sc-guide__aside">
            The buoy transmits at 00:10, 08:10 and 16:10 UTC by default, in a 46-byte packet; raw audio stays on the buoy. On a normal cold start with enough battery it also sends one packet at power-on (skipped after a watchdog reset or in CRITICAL power). Every minute
            the shore station also asks the console for setting changes and hands them to the buoy right after its next packet.
          </p>
        </GuideSection>

        <GuideSection id="shore" eyebrow="Admin" title="Connect a shore station">
          <Steps steps={SHORE_STEPS} done={<>the check under its new token turns green and says <b>Connected</b>.</>} />
          <ShoreFallback />
        </GuideSection>

        <GuideSection id="buoy" eyebrow="Member" title="Add a buoy">
          <Steps steps={BUOY_STEPS} done={<>the <b>Add buoy</b> dialog turns green and says <b>Connected</b>.</>} />
        </GuideSection>

        <GuideSection id="settings" eyebrow="Member" title="Change how a buoy behaves"
          lead={<>Open <b>Settings → Buoys</b>. Each setting that can change by radio has its own control.</>}>
          <p className="sc-guide__text">
            You can change transmits a day, slot phase, reading interval, hydrophone clip, power thresholds and the housing humidity alert.
            The shore station sends the whole set right after the buoy&rsquo;s next packet.
          </p>
          <dl className="sc-guide__states">
            <div><dt>Pending</dt><dd>Sent, waiting for a packet from the buoy that reports the same settings.</dd></div>
            <div><dt>Confirmed</dt><dd>The buoy is running the new settings.</dd></div>
            <div><dt>Rejected</dt><dd>The buoy refused the change and kept its old settings.</dd></div>
          </dl>
          <p className="sc-guide__text sc-guide__aside">The radio and the listen window never change by radio; they need a firmware update.</p>
        </GuideSection>

        <GuideSection id="trouble" eyebrow="Troubleshooting" title="Fix something that looks wrong" lead="Pick what you are seeing.">
          <div className="sc-guide__problems">
            {PROBLEMS.map((problem) => (
              <details key={problem.symptom} className="sc-guide__problem">
                <summary>{problem.symptom}<Icon name="chevron-down" /></summary>
                <p className="sc-guide__text">{problem.fix}</p>
              </details>
            ))}
          </div>
        </GuideSection>

        <GuideSection id="fred" eyebrow="Anyone" title="Ask Fred"
          lead={<>Fred is the console&rsquo;s assistant. Open it with <b>Ask Fred</b> in the top bar on any page.</>}>
          <p className="sc-guide__text">
            Ask about a page, the project or the live fleet: &ldquo;Which buoys missed a transmission today?&rdquo;, &ldquo;Why is buoy 2
            still Pending?&rdquo;, &ldquo;Why can&rsquo;t we send audio over LoRa?&rdquo; Fred looks things up with the same data the pages
            show, cites the repo files it used, and says when it does not know.
          </p>
          <p className="sc-guide__text">
            Members can ask for a change, such as &ldquo;drop buoy 1 to two transmits a day&rdquo;. Fred shows a card with the effect, and
            nothing changes until you click <b>Confirm</b> within 10 minutes. The audit log records it as made by you, via Fred. Guests can
            ask questions but not changes.
          </p>
          <p className="sc-guide__text sc-guide__aside">
            Fred runs on Google Gemini&rsquo;s free tier: Google may review what you type, so don&rsquo;t share personal information. Nothing you
            type is kept by the console; the conversation goes when you close the tab. If an answer is wrong, use <b>Report this answer</b> and
            paste it into a Linear issue. Each person has a daily limit, and when Gemini is busy a smaller model answers and cannot draft changes.
          </p>
        </GuideSection>

        <Reference />

        <GuideSection id="api" eyebrow="Developer" title="Use the data in scripts and notebooks">
          <p className="sc-guide__text">
            Make a personal token on <b>Developer → API tokens</b> and send it as a header with every request to <code>/api/v1</code>. It acts
            with your role, limited to the scopes you gave it. Every change anyone makes is listed on <b>Developer → Audit log</b>.
          </p>
          <CopyCommand command="Authorization: Bearer sct_…" />
        </GuideSection>
      </div>
    </div>
  );
}
