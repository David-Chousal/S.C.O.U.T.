"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/session";
import { PasswordField } from "./password-field";
import { ProviderLinks } from "./provider-links";

type Check = { kind: "checking" } | { kind: "ok" } | { kind: "gone"; message: string };

function useToken(): string {
  return useSearchParams()?.get("token") ?? "";
}

function Gone({ title, message }: { title: string; message: string }) {
  return (
    <div className="sc-auth-form">
      <div className="sc-auth-form__head"><h2>{title}</h2></div>
      <Banner tone="failed">{message}</Banner>
      <a className="sc-link" href="/login/">Go to sign in</a>
    </div>
  );
}

/** /invite/?token=…: join with a password, or with GitHub / Google under the invited email. */
export function InviteForm() {
  const token = useToken();
  const router = useRouter();
  const [check, setCheck] = useState<Check>({ kind: "checking" });
  const [invite, setInvite] = useState<{ email: string; role: Role } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.invite(token).then(
      (result) => { setInvite(result.invite); setCheck({ kind: "ok" }); },
      (failure: unknown) => setCheck({ kind: "gone", message: failure instanceof Error ? failure.message : "This invite is not valid." }),
    );
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.acceptInvite(token, name.trim(), password);
      router.replace("/fleet/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The account was not created.");
    }
  }

  if (!token) return <Gone title="Invite not valid" message="This link has no invite in it." />;
  if (check.kind === "checking") return <span className="sc-tag" aria-busy="true">Checking the invite…</span>;
  if (check.kind === "gone" || !invite) return <Gone title="Invite not valid" message={check.kind === "gone" ? check.message : ""} />;
  return (
    <form className="sc-auth-form" onSubmit={onSubmit}>
      <div className="sc-auth-form__head">
        <h2>Join the console</h2>
        <span className="sc-help">Invited as <strong>{invite.email}</strong> · {ROLE_LABEL[invite.role]}</span>
      </div>
      {error && <Banner tone="failed">{error}</Banner>}
      <ProviderLinks invite={token} />
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Your name</span></span>
        <input className="sc-input" autoComplete="name" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <PasswordField label="Password · 12 characters or more" autoComplete="new-password" minLength={12} value={password} onChange={setPassword} />
      <button className="sc-key sc-key--primary sc-auth-form__submit" type="submit">Create account <kbd>⏎</kbd></button>
      <span className="sc-help">With GitHub or Google, the account&rsquo;s verified email must be {invite.email}.</span>
    </form>
  );
}

/** /reset/?token=…: set a new password; every other session ends. */
export function ResetForm() {
  const token = useToken();
  const router = useRouter();
  const [check, setCheck] = useState<Check>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.resetValid(token).then(
      () => setCheck({ kind: "ok" }),
      (failure: unknown) => setCheck({ kind: "gone", message: failure instanceof Error ? failure.message : "This link is not valid." }),
    );
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.resetPassword(token, password);
      router.replace("/fleet/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The password was not changed.");
    }
  }

  if (!token) return <Gone title="Link not valid" message="This link has no reset token in it." />;
  if (check.kind === "checking") return <span className="sc-tag" aria-busy="true">Checking the link…</span>;
  if (check.kind === "gone") return <Gone title="Link not valid" message={check.message} />;
  return (
    <form className="sc-auth-form" onSubmit={onSubmit}>
      <div className="sc-auth-form__head"><h2>Set a new password</h2><span className="sc-help">Saving signs you out on every other device.</span></div>
      {error && <Banner tone="failed">{error}</Banner>}
      <PasswordField label="New password · 12 characters or more" autoComplete="new-password" minLength={12} value={password} onChange={setPassword} />
      <button className="sc-key sc-key--primary sc-auth-form__submit" type="submit">Save and sign in <kbd>⏎</kbd></button>
    </form>
  );
}
