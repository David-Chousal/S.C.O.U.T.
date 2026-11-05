"use client";

import { useEffect, useState } from "react";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { FredCard as Card } from "@/lib/api/types";

type CardState = { kind: "open" } | { kind: "busy" } | { kind: "done"; message: string; link?: string }
  | { kind: "declined" } | { kind: "failed"; message: string } | { kind: "expired" };

function remaining(expiresAt: number, now: number): string {
  const minutes = Math.ceil((expiresAt - now) / 60000);
  return minutes <= 1 ? "Expires in under a minute" : `Expires in ${minutes} min`;
}

/** A change Fred drafted. Nothing happens until Confirm; the server re-checks the role, runs the
 * same handler the page would and records it in the audit log as "via Fred". */
export function FredConfirmCard({ card, now: initialNow }: { card: Card; now?: number }) {
  const [state, setState] = useState<CardState>({ kind: "open" });
  const [now, setNow] = useState(() => initialNow ?? Date.now());
  const open = state.kind === "open" || state.kind === "failed";

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, [open]);

  const expired = state.kind === "expired" || (open && now >= card.expiresAt);

  async function confirm() {
    setState({ kind: "busy" });
    try {
      const done = await api.confirmFred(card.id);
      setState({ kind: "done", message: done.message, link: done.link });
    } catch (error) {
      const message = error instanceof Error ? error.message : "That did not go through.";
      setState(/expired/i.test(message) ? { kind: "expired" } : { kind: "failed", message });
    }
  }

  async function decline() {
    setState({ kind: "declined" });
    await api.declineFred(card.id).catch(() => undefined);
  }

  const tone = state.kind === "done" ? " sc-fred__card--done" : expired || state.kind === "declined" ? " sc-fred__card--gone" : "";
  return (
    <section className={`sc-fred__card${tone}`} aria-label={`Proposed: ${card.title}`}>
      <h3 className="sc-fred__card-title">{card.title}</h3>
      <dl>{card.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="sc-fred__card-foot">
        {state.kind === "done" && <span className="sc-fred__card-state" role="status">{state.message}{state.link && <> <a href={state.link}>Download CSV</a></>}</span>}
        {state.kind === "declined" && <span className="sc-fred__card-state">Declined. Nothing changed.</span>}
        {expired && <span className="sc-fred__card-state">Expired. Nothing changed; ask Fred again.</span>}
        {state.kind === "failed" && !expired && <span className="sc-fred__card-state" role="alert">{state.message}</span>}
        {(open || state.kind === "busy") && !expired && <>
          {state.kind !== "failed" && <span className="sc-fred__card-state">{remaining(card.expiresAt, now)}</span>}
          <Key size="sm" onClick={decline} disabled={state.kind === "busy"}>Decline</Key>
          <Key size="sm" variant="primary" onClick={confirm} disabled={state.kind === "busy"}>Confirm</Key>
        </>}
      </div>
    </section>
  );
}
