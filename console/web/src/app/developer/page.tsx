import type { Metadata } from "next";
import { Suspense } from "react";
import { DeveloperTabs } from "@/components/developer/developer-tabs";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Developer" };

export default function Page() {
  return (
    <AppShell title="Developer">
      <Suspense fallback={null}><DeveloperTabs /></Suspense>
    </AppShell>
  );
}
