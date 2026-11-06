"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";

type State =
  | { kind: "checking" }
  | { kind: "ready"; description: string }
  | { kind: "done"; description: string }
  | { kind: "gone"; message: string };

/** /alerts/off/?token=…: the "Turn this alert off" link in an alert email. No sign-in: the link is
 * the proof. Opening it changes nothing (mail scanners open links); the key turns the one alert off.
 * A mail client's own unsubscribe button posts straight to the API (RFC 8058) and skips this page. */
export function AlertOffForm() {
  const token = useSearchParams()?.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "checking" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.alertOffInfo(token).then(
      (info) => setState({ kind: "ready", description: info.description }),
      (failure: unknown) => setState({ kind: "gone", message: failure instanceof Error ? failure.message : "This link is not valid." }),
    );
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const done = await api.alertOff(token);
      setState({ kind: "done", description: done.description });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The alert was not turned off.");
    }
  }

  if (!token) return <Gone message="This link has no alert in it." />;
  if (state.kind === "checking") return <span className="sc-tag" aria-busy="true">Checking the link…</span>;
  if (state.kind === "gone") return <Gone message={state.message} />;
  if (state.kind === "done") {
    return (
      <div className="sc-auth-form" role="status">
        <div className="sc-auth-form__head"><h2>Alert turned off</h2><span className="sc-help"><strong>{state.description}</strong> no longer emails you.</span></div>
        <span className="sc-help">Turn it back on, or change your other alerts, on the Notifications tab.</span>
        <a className="sc-link" href="/settings/?tab=notifications">Open Notifications</a>
      </div>
    );
  }
  return (
    <form className="sc-auth-form" onSubmit={onSubmit}>
      <div className="sc-auth-form__head"><h2>Turn off this alert?</h2><span className="sc-help"><strong>{state.description}</strong></span></div>
      <span className="sc-help">Only this alert stops. Your other alerts keep working. You can turn it back on from the Notifications tab.</span>
      {error && <Banner tone="failed">{error}</Banner>}
      <button className="sc-key sc-key--primary sc-auth-form__submit" type="submit">Turn this alert off</button>
    </form>
  );
}

function Gone({ message }: { message: string }) {
  return (
    <div className="sc-auth-form">
      <div className="sc-auth-form__head"><h2>Link not valid</h2></div>
      <Banner tone="failed">{message}</Banner>
      <a className="sc-link" href="/settings/?tab=notifications">Manage alerts on the Notifications tab</a>
    </div>
  );
}
