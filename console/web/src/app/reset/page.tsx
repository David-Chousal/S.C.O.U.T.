import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/token-forms";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Set a new password" };

export default function Page() {
  return (
    <AuthFrame>
      <Suspense fallback={null}><ResetForm /></Suspense>
    </AuthFrame>
  );
}
