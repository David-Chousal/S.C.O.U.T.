"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The audit log moved to a tab of the Developer page; old links land there. */
export function AuditRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/developer/?tab=audit"), [router]);
  return <span className="sc-tag">The audit log is now under Developer → Audit log…</span>;
}
