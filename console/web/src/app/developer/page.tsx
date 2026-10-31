import type { Metadata } from "next";
import { DeveloperBoard } from "@/components/developer/developer-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Developer" };

export default function Page() {
  return (
    <AppShell title="Developer">
      <DeveloperBoard />
    </AppShell>
  );
}
