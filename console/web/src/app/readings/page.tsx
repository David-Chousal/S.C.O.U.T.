import type { Metadata } from "next";
import { ReadingsBoard } from "@/components/readings/readings-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Readings" };

export default function Page() {
  return (
    <AppShell title="Readings">
      <ReadingsBoard />
    </AppShell>
  );
}
