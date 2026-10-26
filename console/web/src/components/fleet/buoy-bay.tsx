"use client";

import { useId, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toaster";
import { SignalMeter } from "@/components/status/signal-meter";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, Estimates } from "@/lib/api/types";
import { COUNT_SIGNAL, lifeFor, months, utc } from "@/lib/format";

interface BuoyBayProps {
  buoy: Buoy;
  estimates: Estimates;
  slotLabels: Record<string, string>;
  canChange: boolean;
  onChanged: () => void;
}

/** One buoy: what was asked, what it reports, and the 1/2/3 choice with each option's battery cost. */
export function BuoyBay({ buoy, estimates, slotLabels, canChange, onChanged }: BuoyBayProps) {
  const { show } = useToast();
  const titleId = useId();
  const current = buoy.tx_count_requested ?? 3;
  const [choice, setChoice] = useState(current);
  const [saving, setSaving] = useState(false);
  const signal = COUNT_SIGNAL[buoy.state];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.requestTxCount(buoy.buoy_id, choice);
      show({ tone: "ok", title: `Requested ${choice} a day for ${buoy.label}`, detail: "It stays pending until the buoy reports it." });
      onChanged();
    } catch (error) {
      show({ tone: "failed", title: "Not saved", detail: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sc-bay" aria-labelledby={titleId}>
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id={titleId}>{buoy.label}</h2>
        <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} />
      </div>
      <p className="sc-help">{signal.detail}</p>
      <dl className="sc-pair">
        <div>
          <dt className="sc-tag">Requested</dt>
          <dd>{buoy.tx_count_requested ? `${buoy.tx_count_requested} a day` : "Nothing"}
            <small>{buoy.requested_by ? `${buoy.requested_by} · ${utc(buoy.requested_at)}` : "the buoy runs its default"}</small>
          </dd>
        </div>
        <div>
          <dt className="sc-tag">Buoy reports</dt>
          <dd>{buoy.tx_count_reported ? `${buoy.tx_count_reported} a day` : "Not yet"}
            <small>newest packet {utc(buoy.reported_at)}</small>
          </dd>
        </div>
      </dl>
      <form onSubmit={onSubmit} className="sc-row">
        <fieldset className="sc-tx-options">
          <legend className="sc-tag">Transmits a day · battery life, two D cells (estimate)</legend>
          {estimates.allowed_tx_counts.map((n) => {
            const life = lifeFor(estimates, n, 2);
            return (
              <label key={n} className="sc-tx-option">
                <input type="radio" name={`tx-${buoy.buoy_id}`} value={n} checked={choice === n}
                  disabled={!canChange} onChange={() => setChoice(n)} />
                <span><strong>{n} a day</strong><span className="sc-tx-option__slots">{slotLabels[String(n)]}</span></span>
                <span className="sc-tx-option__life">{months(life.best)} best<span>{months(life.pessimistic)} pessimistic</span></span>
              </label>
            );
          })}
        </fieldset>
        <Key type="submit" variant="primary" disabled={!canChange || saving || choice === current}>
          {saving ? "Requesting…" : `Request ${choice} a day`}
        </Key>
      </form>
    </section>
  );
}
