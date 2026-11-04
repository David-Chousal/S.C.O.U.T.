"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/feedback/toaster";
import { forgetSession } from "@/components/shell/app-shell";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import { ROLE_LABEL, useSession } from "@/lib/session";

/** Who you are, how you sign in, and signing out here or everywhere. The sidebar's profile card
 * opens this page; signing out lives here, not in the sidebar. */
export function AccountPanel() {
  const { user } = useSession();
  const router = useRouter();
  const { show } = useToast();
  const ways = user.selfSignup ? "guest sign-in (name and email)" : [user.hasPassword && "password", user.github && "GitHub", user.google && "Google"].filter(Boolean).join(" · ") || "—";

  async function signOut() {
    // Leaving even if the request fails: the session cookie is the server's to clear, and a
    // failed sign-out still sends the browser to sign-in, where a stale cookie is re-checked.
    await api.signOut().catch(() => undefined);
    forgetSession();
    router.replace("/login/");
  }

  async function signOutEverywhere() {
    try {
      await api.signOutEverywhere();
      forgetSession();
      router.replace("/login/");
    } catch (failure) {
      show({ tone: "failed", title: "Still signed in", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  return (
    <>
      <section className="sc-bay" aria-labelledby="you-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="you-title">You</h2><span className="sc-tag">{ROLE_LABEL[user.role]}</span></div>
        <dl className="sc-pair">
          <div><dt className="sc-tag">Email</dt><dd className="sc-account__value">{user.email}</dd></div>
          <div><dt className="sc-tag">Signs in with</dt><dd className="sc-account__value">{ways}</dd></div>
        </dl>
        <p className="sc-help">Signing in with GitHub or Google under this same verified email links it to this account.</p>
      </section>
      <section className="sc-bay" aria-labelledby="sessions-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="sessions-title">Sessions</h2></div>
        <p className="sc-help">Sign out of this browser, or on every device, this one included. Use the second if a laptop or phone went missing.</p>
        <span className="sc-row">
          <Key icon="logout" onClick={signOut}>Sign out</Key>
          <HoldKey label="Hold to sign out everywhere" holdLabel="Hold to sign out on every device" onConfirm={signOutEverywhere} />
        </span>
      </section>
    </>
  );
}
