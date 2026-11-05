import type { Metadata } from "next";
import { AccountRedirect } from "@/components/account/account-redirect";

export const metadata: Metadata = { title: "Account" };

export default function Page() {
  return <AccountRedirect />;
}
