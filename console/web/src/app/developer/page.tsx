import type { Metadata } from "next";
import { DeveloperTabs } from "@/components/developer/developer-tabs";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Developer" };

export default function Page() {
  return (
    <AppShell title="Developer">
      <DeveloperTabs />
    </AppShell>
  );
}
