import type { SignalState } from "@/components/status/signal-meter";

/** A status word with a small coloured dot: the word carries the meaning, the dot lets the eye scan. */
export function StatusDot({ state, word }: { state: SignalState; word: string }) {
  return <span className={`sc-status sc-status--${state}`}><i aria-hidden="true" />{word}</span>;
}
