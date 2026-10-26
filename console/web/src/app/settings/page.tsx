import type { Metadata } from "next";
import { SettingsBoard } from "@/components/settings/settings-board";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <AppShell title="Settings">
      <SettingsBoard />
    </AppShell>
  );
}
