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
          <div className="sc-guide__node"><strong>{node.name}</strong><span>{node.detail}</span></div>
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
            </a>
          </li>
        ))}
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
        lead={<>Press <kbd>G</kbd>, then a letter, to jump to a page. Turn shortcuts off in <b>Settings → This browser</b>.</>}>
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

      <GuideSection id="flow" eyebrow="Before you start" title="How readings reach the console"
        lead="The buoy never talks to the console directly. A shore station listens for it and passes each reading on.">
        <FlowDiagram />
        <p className="sc-guide__text sc-guide__aside">
          The buoy transmits at 00:10, 08:10 and 16:10 UTC by default, in a 44-byte packet; raw audio stays on the buoy. Every 10 minutes
          the shore station also asks the console for setting changes and hands them to the buoy right after its next packet.
        </p>
      </GuideSection>

      <GuideSection id="shore" eyebrow="Admin" title="Connect a shore station">
        <Steps steps={SHORE_STEPS} done={<>the station shows a recent <b>last heard</b> time on Stations.</>} />
        <ShoreFallback />
      </GuideSection>

      <GuideSection id="buoy" eyebrow="Member" title="Add a buoy">
        <Steps steps={BUOY_STEPS} done={<>the buoy appears on Fleet with a recent reading.</>} />
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

      <Reference />

      <GuideSection id="api" eyebrow="Developer" title="Use the data in scripts and notebooks">
        <p className="sc-guide__text">
          Make a personal token on <b>Developer → API tokens</b> and send it as a header with every request to <code>/api/v1</code>. It acts
          with your role, limited to the scopes you gave it. Every change anyone makes is listed on <b>Developer → Audit log</b>.
        </p>
        <CopyCommand command="Authorization: Bearer sct_…" />
      </GuideSection>
    </div>
  );
}
