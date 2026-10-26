"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import { PasswordField } from "./password-field";
import { ProviderLinks } from "./provider-links";

/** Sign in with GitHub, Google or a password. A message left by a failed OAuth round trip (kept
 * server-side in a one-time cookie, never in the URL) shows above the form. */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/flash", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((body: { message?: string | null }) => body.message && setError(body.message))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.signIn(email.trim(), password);
      router.replace("/fleet/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <form className="sc-auth-form" onSubmit={onSubmit}>
      <div className="sc-auth-form__head">
        <h2>Sign in</h2>
        <span className="sc-help">The S.C.O.U.T. team console. Accounts are by invitation.</span>
      </div>
      {error && <Banner tone="failed">{error}</Banner>}
      <ProviderLinks />
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Email</span></span>
        <input className="sc-input" name="email" type="email" autoComplete="username" required value={email}
          onChange={(event) => setEmail(event.target.value)} />
      </label>
      <PasswordField label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
      <button className="sc-key sc-key--primary sc-auth-form__submit" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"} <kbd>⏎</kbd>
      </button>
      <span className="sc-help">Forgot it? Ask an admin for a reset link.</span>
    </form>
  );
}
