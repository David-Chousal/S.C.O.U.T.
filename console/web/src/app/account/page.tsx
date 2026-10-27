import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Account" };

export default function Page() {
  return (
    <AppShell title="Account">
      <AccountPanel />
    </AppShell>
  );
}
