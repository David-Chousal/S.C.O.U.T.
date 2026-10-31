"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";

/** "Sign in as guest": a name and an email, no password, for a view-only look round the console.
 * Collapsed to one key until asked for, so the team's own sign-in stays the obvious path. */
export function GuestSignIn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.guestSignIn(name.trim(), email.trim());
      router.replace("/fleet/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Guest sign-in failed.");
      setBusy(false);
    }
  }

  if (!open) {
    return <Key className="sc-auth-guest__open" icon="eye" onClick={() => setOpen(true)}>Sign in as guest</Key>;
  }
  return (
    <form className="sc-auth-form sc-auth-guest" onSubmit={onSubmit}>
      <span className="sc-help">Look round without an account: every page and setting, view only. Team emails stay hidden.</span>
      {error && <Banner tone="failed">{error}</Banner>}
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Name</span></span>
        <input className="sc-input" name="name" autoComplete="name" required maxLength={80} value={name}
          onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Email</span></span>
        <input className="sc-input" name="guest-email" type="email" autoComplete="email" required value={email}
          onChange={(event) => setEmail(event.target.value)} />
      </label>
      <Key type="submit" disabled={busy}>{busy ? "Signing in…" : "Continue as guest"}</Key>
    </form>
  );
}
