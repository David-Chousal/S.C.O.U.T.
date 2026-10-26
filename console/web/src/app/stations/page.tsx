import type { Metadata } from "next";
import { StationsBoard } from "@/components/stations/stations-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Stations" };

export default function Page() {
  return (
    <AppShell title="Stations">
      <StationsBoard />
    </AppShell>
  );
}
