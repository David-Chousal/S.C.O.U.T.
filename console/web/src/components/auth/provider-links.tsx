"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Providers } from "@/lib/api/types";

/** "Continue with GitHub / Google" for the providers the console has set up; nothing otherwise. */
export function ProviderLinks({ invite = "" }: { invite?: string }) {
  const [providers, setProviders] = useState<Providers | null>(null);
  useEffect(() => {
    api.providers().then(setProviders, () => setProviders({ github: false, google: false }));
  }, []);
  if (!providers || (!providers.github && !providers.google)) return null;
  const query = invite ? `?invite=${encodeURIComponent(invite)}` : "";
  return (
    <div className="sc-providers">
      {providers.github && <a className="sc-key" href={`/auth/github${query}`}>Continue with GitHub</a>}
      {providers.google && <a className="sc-key" href={`/auth/google${query}`}>Continue with Google</a>}
      <span className="sc-help sc-providers__or">or with a password</span>
    </div>
  );
}
