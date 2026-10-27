/** Freshness as signal bars + a word: ok (live, confirmed), stale (pending), failed, off. */
export type SignalState = "ok" | "stale" | "failed" | "off";

interface SignalMeterProps {
  state: SignalState;
  lit: number;
  word: string;
  age?: string;
}

const BARS = [0, 1, 2, 3];

export function SignalMeter({ state, lit, word, age }: SignalMeterProps) {
  return (
    <span className={`sc-signal sc-signal--${state}`}>
      <span className="sc-signal__bars" aria-hidden="true">
        {BARS.map((bar) => <i key={bar} className={bar < lit ? undefined : "off"} />)}
      </span>
      {word}
      {age && <> <b>{age}</b></>}
    </span>
  );
}
