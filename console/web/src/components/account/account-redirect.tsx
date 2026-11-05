"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The Account page became Settings → Account; old links land there. */
export function AccountRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/settings/?tab=account"), [router]);
  return <span className="sc-tag">Your account is now under Settings → Account…</span>;
}
