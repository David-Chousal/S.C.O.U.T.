import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteForm } from "@/components/auth/token-forms";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Accept invite" };

export default function Page() {
  return (
    <AuthFrame>
      <Suspense fallback={null}><InviteForm /></Suspense>
    </AuthFrame>
  );
}
