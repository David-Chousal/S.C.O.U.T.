import type { ReactNode } from "react";

// Three slots a day for a week: the site's slot-rule motif, every third tick lit.
const TICKS = Array.from({ length: 21 }, (_, i) => i);

/** The signed-out layout: brand panel left (hidden on phones), the form right. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="sc-login">
      <div className="sc-login__art">
        <span className="sc-wordmark">S.C.O.U.T. <span className="sc-tag">Console</span></span>
        <div className="sc-login__lede">
          <h1>Low-cost reef monitoring, run from the shore.</h1>
          <p className="sc-login__about">
            The S.C.O.U.T. Console brings every buoy&rsquo;s readings, its radio settings, the shore stations that relay them and the
            team behind them into one place, with an assistant that knows the project, so a small team can run a fleet of reef
            sensors from anywhere.
          </p>
        </div>
        <div className="sc-login__slots" aria-hidden="true">
          <svg viewBox="0 0 420 40" preserveAspectRatio="none">
            {TICKS.map((i) => <rect key={i} className={i % 3 === 0 ? "on" : undefined} x={i * 20 + 7} y={6} width={6} height={28} />)}
          </svg>
        </div>
      </div>
      <div className="sc-login__form">{children}</div>
    </div>
  );
}
