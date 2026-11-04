import type { Metadata } from "next";
import { HelpGuide } from "@/components/help/help-guide";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Help" };

export default function Page() {
  return (
    <AppShell title="Help">
      <HelpGuide />
    </AppShell>
  );
}
