import type { Metadata } from "next";
import { FleetBoard } from "@/components/fleet/fleet-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Fleet" };

export default function FleetPage() {
  return (
    <AppShell title="Fleet">
      <FleetBoard />
    </AppShell>
  );
}
