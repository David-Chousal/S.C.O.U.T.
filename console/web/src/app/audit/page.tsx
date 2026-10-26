import type { Metadata } from "next";
import { AuditTable } from "@/components/audit/audit-table";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return (
    <AppShell title="Audit log">
      <AuditTable />
    </AppShell>
  );
}
