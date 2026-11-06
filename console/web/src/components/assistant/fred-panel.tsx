"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { Icon } from "@/components/ui/icon";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { FredCard, FredContext, FredEvent, FredMessage, User } from "@/lib/api/types";
import { FredConfirmCard } from "./fred-card";
import { FredMarkdown } from "./fred-markdown";


const SUGGESTIONS = [
  "Which buoys missed a transmission today?",
  "Why can't we send audio over LoRa?",
  "What does Pending mean on Settings?",
];

export interface FredTurn {
  id: number;
  question: string;
  answer: string;
  tools: string[];
  notices: string[];
  cards: FredCard[];
  error?: string;
  provider?: string;
  done: boolean;
}

/** What the person is looking at, so "why is this one late?" works. */
export function contextFrom(pathname: string, search: string): FredContext {
  const params = new URLSearchParams(search);
  const page = pathname.split("/").filter(Boolean)[0];
  const buoy = Number(params.get("buoy"));
  return { page: page || "dashboard", tab: params.get("tab") ?? undefined, buoy: Number.isInteger(buoy) && buoy > 0 ? buoy : undefined };
}

/** The conversation as the Worker wants it: every finished exchange, then the new question. */
export function historyFor(turns: FredTurn[], question: string): FredMessage[] {
  const past = turns.filter((t) => t.done && !t.error && t.answer)
    .flatMap((t): FredMessage[] => [{ role: "user", text: t.question }, { role: "assistant", text: t.answer }]);
  return [...past, { role: "user", text: question }];
}

/** One exchange, as plain text for a Linear issue: the conversation is not kept anywhere else. */
export function reportText(turn: FredTurn, now = new Date()): string {
  return [`Fred answer report (${now.toISOString().slice(0, 16)}Z, ${turn.provider ?? "unknown model"})`, "",
    `Question: ${turn.question}`, "", `Tools: ${turn.tools.join("; ") || "none"}`, "", "Answer:", turn.answer || turn.error || ""].join("\n");
}

function apply(turn: FredTurn, event: FredEvent): FredTurn {
  switch (event.event) {
    case "text": return { ...turn, answer: turn.answer + event.data.delta };
    case "reset": return { ...turn, answer: "" };
    case "tool": return { ...turn, tools: [...turn.tools, event.data.label] };
    case "action": return { ...turn, cards: [...turn.cards, event.data] };
    case "notice": return { ...turn, notices: [...turn.notices, event.data.message] };
    case "error": return { ...turn, error: event.data.message, done: true };
    case "done": return { ...turn, provider: event.data.provider, done: true };
    default: return turn;
  }
}

function Exchange({ turn }: { turn: FredTurn }) {
  const [copied, setCopied] = useState(false);
  async function report() {
    try {
      await navigator.clipboard.writeText(reportText(turn));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <li className="sc-fred__turn">
      <p className="sc-fred__q">{turn.question}</p>
      {turn.tools.length > 0 && (
        <ul className="sc-fred__tools" aria-label="What Fred looked at">{turn.tools.map((label, i) => <li key={i}>{label}</li>)}</ul>
      )}
      {turn.notices.map((notice, i) => <p key={i} className="sc-fred__notice">{notice}</p>)}
      <div className="sc-fred__a" aria-live="polite">
        {turn.answer ? <FredMarkdown text={turn.answer} /> : !turn.done && <span className="sc-tag">Thinking…</span>}
      </div>
      {turn.cards.map((card) => <FredConfirmCard key={card.id} card={card} />)}
      {turn.error && <Banner tone="failed">{turn.error}</Banner>}
      {turn.done && (turn.answer || turn.error) && (
        <div className="sc-fred__turn-foot">
          <Key size="sm" onClick={report}>{copied ? "Copied" : "Report this answer"}</Key>
        </div>
      )}
    </li>
  );
}

interface FredPanelProps {
  user: User;
  /** Shown now. The panel stays mounted while closed, so the conversation lasts until the tab
   * closes and the panel can slide shut. */
  open?: boolean;
  onClose: () => void;
}

export function FredPanel({ user, open = true, onClose }: FredPanelProps) {
  const pathname = usePathname() ?? "/";
  const [turns, setTurns] = useState<FredTurn[]>([]);
  const [draft, setDraft] = useState("");
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const busy = turns.some((t) => !t.done);

  useEffect(() => () => abort.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
  }, [open]);

  // The question box grows with what is typed, up to its CSS max-height, then scrolls. Set through
  // the DOM (no inline style attribute), so the strict CSP holds.
  useLayoutEffect(() => {
    const box = input.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight + 2}px`;
  }, [draft]);

  // Keep the newest text and card, with its Confirm key, in view as the reply streams in.
  useEffect(() => {
    log.current?.scrollTo?.({ top: log.current.scrollHeight });
  }, [turns]);

  const send = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    const id = Date.now();
    const history = historyFor(turns, text);
    setTurns((all) => [...all, { id, question: text, answer: "", tools: [], notices: [], cards: [], done: false }]);
    setDraft("");
    abort.current = new AbortController();
    const update = (fn: (t: FredTurn) => FredTurn) => setTurns((all) => all.map((t) => (t.id === id ? fn(t) : t)));
    try {
      await api.askFred(history, contextFrom(pathname, window.location.search), (event) => {
        update((t) => apply(t, event));
      }, abort.current.signal);
      // A stream that closes without "done" was cut off on the way.
      update((t) => (t.done ? t : { ...t, done: true, error: "Fred's reply was cut off. Ask again." }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      update((t) => ({ ...t, done: true, error: error instanceof Error ? error.message : "Fred did not answer." }));
    }
  }, [busy, pathname, turns]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  function onInputKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  function startOver() {
    abort.current?.abort();
    setTurns([]);
    input.current?.focus();
  }

  return (
    <aside className="sc-fred" role="dialog" aria-label="Ask Fred" onKeyDown={onKeyDown}>
      <div className="sc-drawer__head">
        <h2 className="sc-drawer__title">Fred</h2>
        <div className="sc-fred__head-keys">
          <Key size="sm" onClick={startOver} disabled={turns.length === 0}>New conversation</Key>
          <Key size="sm" icon="close" iconOnly aria-label="Close Fred" onClick={onClose} />
        </div>
      </div>
      {turns.length === 0 ? (
        <div className="sc-fred__empty">
          <p>Ask about the console, the project or the live fleet{user.role === "guest" ? "." : ". Fred can also draft changes for you to confirm."}</p>
          <div className="sc-fred__suggest">
            {SUGGESTIONS.map((s) => <Key key={s} size="sm" onClick={() => void send(s)}>{s}</Key>)}
          </div>
        </div>
      ) : (
        <ol className="sc-fred__log" ref={log}>{turns.map((turn) => <Exchange key={turn.id} turn={turn} />)}</ol>
      )}
      <form className="sc-fred__form" onSubmit={submit}>
        <label className="sc-visually-hidden" htmlFor="fred-input">Your question</label>
        <div className="sc-fred__compose">
          <textarea id="fred-input" ref={input} rows={2} maxLength={4000} value={draft} placeholder="Ask Fred…"
            onChange={(e) => setDraft(e.target.value)} onKeyDown={onInputKey} />
          <button type="submit" className="sc-fred__send" aria-label="Send" title="Send (Return)" disabled={busy || !draft.trim()}>
            <Icon name="return" />
          </button>
        </div>
      </form>
    </aside>
  );
}
