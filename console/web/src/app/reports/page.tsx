import type { Metadata } from "next";
import { ReportsBoard } from "@/components/reports/reports-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <AppShell title="Reports">
      <ReportsBoard />
    </AppShell>
  );
}
