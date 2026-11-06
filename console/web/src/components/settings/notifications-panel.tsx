"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { AlertHistoryItem, AlertRule, AlertRuleInput, AlertsView, EmailDelivery, Fleet } from "@/lib/api/types";
import { useWhen } from "@/lib/preferences-context";
import { can, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { AlertEditor, draftOfRule, emptyDraft, type Draft } from "./alert-editor";

const STATUS: Record<EmailDelivery, string> = {
  sent: "Emailed", failed: "Not sent", rate_limited: "Cap reached", not_configured: "Email off",
};

const message = (failure: unknown) => (failure instanceof Error ? failure.message : "The console did not answer.");

/** Settings → Notifications: your own email alerts. A master switch, your rules (built from scratch
 * or a preset), a test email, and what fired lately. Alerts go only to your account email; guests
 * see the tab but cannot have alerts, and the Worker refuses them too (roles.js alerts.write). */
export function NotificationsPanel() {
  const { user } = useSession();
  const view = useApi<AlertsView>(api.alerts);
  const fleet = useApi<Fleet>(api.fleet);
  const allowed = can(user.role, "alerts.write");

  if (view.error) return <Banner tone="failed">{view.error}</Banner>;
  if (!view.data) return <span className="sc-tag" aria-busy="true">Loading your alerts…</span>;
  const buoys = (fleet.data?.buoys ?? []).filter((b) => !b.disconnected_at);
  return (
    <>
      <MasterBay data={view.data} allowed={allowed} reload={view.reload} />
      <RulesBay data={view.data} buoys={buoys} allowed={allowed} reload={view.reload} />
      <HistoryBay history={view.data.history} />
    </>
  );
}

interface BayProps {
  data: AlertsView;
  allowed: boolean;
  reload: () => void;
}

function MasterBay({ data, allowed, reload }: BayProps) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle(enabled: boolean) {
    setBusy(true);
    try {
      await api.setAlertsEnabled(enabled);
      reload();
    } catch (failure) {
      show({ tone: "failed", title: "Alerts not changed", detail: message(failure) });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const { delivery } = await api.testAlert();
      show(delivery === "sent"
        ? { tone: "ok", title: "Test email sent", detail: `Check ${data.email}.` }
        : { tone: "failed", title: "Test email not sent", detail: delivery === "rate_limited" ? "A daily email cap is reached." : delivery === "not_configured" ? "Email is not set up on this console." : "The email provider refused it." });
      reload();
    } catch (failure) {
      show({ tone: "failed", title: "Test email not sent", detail: message(failure) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sc-bay" aria-labelledby="alerts-title">
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id="alerts-title">Email alerts</h2>
        <span className="sc-tag">Sent to {data.email}</span>
      </div>
      {!allowed && <Banner tone="info" icon="info">Guests can&rsquo;t have email alerts: a guest&rsquo;s email isn&rsquo;t verified. Ask an admin for a member account.</Banner>}
      {data.caps.cappedToday > 0 && (
        <Banner tone="caution">
          {data.caps.cappedToday === 1 ? "1 alert" : `${data.caps.cappedToday} alerts`} today hit a daily email cap and {data.caps.cappedToday === 1 ? "was" : "were"} not emailed. See Recent alerts.
        </Banner>
      )}
      <label className="sc-switch">
        <input type="checkbox" role="switch" checked={data.enabled} disabled={!allowed || busy} onChange={(event) => toggle(event.target.checked)} />
        <span className="sc-switch__state">{data.enabled ? "On" : "Off"}</span>
        <span>Email me when one of my alerts fires</span>
      </label>
      <p className="sc-help">
        Only to your account email, at most one email per batch of readings. Today: <span className="sc-num">{data.caps.sentToday}</span> of
        your <span className="sc-num">{data.caps.person}</span> a day; the console sends at most <span className="sc-num">{data.caps.total}</span> alert
        emails a day for everyone.
      </p>
      <span className="sc-row"><Key icon="bell" disabled={!allowed || busy} onClick={test}>Send test email</Key></span>
    </section>
  );
}

function RulesBay({ data, buoys, allowed, reload }: BayProps & { buoys: readonly { buoy_id: number; label: string }[] }) {
  const { show } = useToast();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(data));
  const [editing, setEditing] = useState<string | null>(null);
  const label = (id: number | null) => (id === null ? "Any buoy" : buoys.find((b) => b.buoy_id === id)?.label ?? `SCOUT-${String(id).padStart(2, "0")}`);

  async function save(input: AlertRuleInput) {
    try {
      if (editing) await api.updateAlertRule(editing, input);
      else await api.createAlertRule(input);
      show({ tone: "ok", title: editing ? "Alert saved" : "Alert added" });
      setEditing(null);
      setDraft(emptyDraft(data));
      reload();
    } catch (failure) {
      show({ tone: "failed", title: "Alert not saved", detail: message(failure) });
    }
  }

  async function run(work: () => Promise<unknown>, failed: string) {
    try {
      await work();
      reload();
    } catch (failure) {
      show({ tone: "failed", title: failed, detail: message(failure) });
    }
  }

  function edit(rule: AlertRule) {
    setEditing(rule.id);
    setDraft(draftOfRule(rule));
  }

  return (
    <section className="sc-bay" aria-labelledby="rules-title">
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id="rules-title">Your alerts</h2>
        <span className="sc-tag">{data.rules.length} {data.rules.length === 1 ? "rule" : "rules"}</span>
      </div>
      {!data.enabled && data.rules.length > 0 && <Banner tone="caution">Email alerts are off, so none of these send. Turn them on above.</Banner>}
      <AlertEditor catalog={data} buoys={buoys} draft={draft} onDraft={setDraft} editing={Boolean(editing)} disabled={!allowed} onSave={save}
        onCancel={() => { setEditing(null); setDraft(emptyDraft(data)); }} />
      {data.rules.length === 0
        ? <p className="sc-help">No alerts yet. Start from a preset or build one above.</p>
        : (
          <div className="sc-table-wrap">
            <table className="sc-table sc-alert-table">
              <colgroup><col className="sc-alert-table__state" /><col /><col className="sc-alert-table__fired" /><col className="sc-alert-table__actions" /></colgroup>
              <thead><tr><th scope="col">State</th><th scope="col">Alert</th><th scope="col">On</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {data.rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.firing && rule.enabled ? <span className="sc-badge sc-badge--pending">Firing</span>
                      : <span className={`sc-badge${rule.enabled ? "" : " sc-badge--muted"}`}>{rule.enabled ? "Armed" : "Off"}</span>}</td>
                    <td><span className="sc-list__main"><strong className={rule.enabled ? undefined : "sc-alert-table__paused"}>{rule.description}</strong>
                      <span className="sc-help">{label(rule.buoy_id)}{rule.remind_hours ? ` · reminds every ${rule.remind_hours} h` : ""}</span></span></td>
                    <td>
                      <label className="sc-switch">
                        <input type="checkbox" role="switch" aria-label={`${rule.description}: on`} checked={rule.enabled} disabled={!allowed}
                          onChange={(event) => run(() => api.updateAlertRule(rule.id, { enabled: event.target.checked }), "Alert not changed")} />
                        <span className="sc-switch__state">{rule.enabled ? "On" : "Off"}</span>
                      </label>
                    </td>
                    <td><span className="sc-row sc-alert-table__buttons">
                      <Key size="sm" disabled={!allowed} onClick={() => edit(rule)} aria-label={`Edit ${rule.description}`}>Edit</Key>
                      <Key size="sm" icon="trash" disabled={!allowed} aria-label={`Delete ${rule.description}`}
                        onClick={() => run(() => api.deleteAlertRule(rule.id), "Alert not deleted")}>Delete</Key>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

function HistoryBay({ history }: { history: AlertHistoryItem[] }) {
  const when = useWhen();
  return (
    <section className="sc-bay" aria-labelledby="history-title">
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id="history-title">Recent alerts</h2>
        <span className="sc-tag">Last {history.length || 0}</span>
      </div>
      {history.length === 0
        ? <p className="sc-help">Nothing has fired yet.</p>
        : (
          <ul className="sc-feed">
            {history.map((item) => (
              <li key={item.id} className="sc-feed__row">
                <span className="sc-num sc-help">{when(item.at)}</span>
                <span className="sc-list__main">
                  <strong>{item.kind === "test" ? `Test · ${item.summary}` : item.summary}</strong>
                  <span className="sc-row">
                    <span className={`sc-badge${item.status === "sent" ? "" : " sc-badge--pending"}`}>{STATUS[item.status] ?? item.status}</span>
                    {item.reason && <span className="sc-help">{item.status === "rate_limited" ? `Not emailed: ${item.reason}` : item.reason}</span>}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
