import type { Metadata } from "next";
import { TeamBoard } from "@/components/team/team-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return (
    <AppShell title="Team">
      <TeamBoard />
    </AppShell>
  );
}
