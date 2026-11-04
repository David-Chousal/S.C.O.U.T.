import type { Metadata } from "next";
import { AuditRedirect } from "@/components/audit/audit-redirect";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return <AuditRedirect />;
}
