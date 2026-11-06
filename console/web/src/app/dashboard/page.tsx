import type { Metadata } from "next";
import { MorningBrief } from "@/components/assistant/morning-brief";
import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <AppShell title="Dashboard">
      <MorningBrief />
      <DashboardBoard />
    </AppShell>
  );
}
