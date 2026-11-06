import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertOffForm } from "@/components/auth/alert-off-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Turn off an alert" };

export default function Page() {
  return (
    <AuthFrame>
      <Suspense fallback={null}><AlertOffForm /></Suspense>
    </AuthFrame>
  );
}
