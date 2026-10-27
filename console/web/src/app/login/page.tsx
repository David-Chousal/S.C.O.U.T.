import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <AuthFrame>
      <LoginForm />
    </AuthFrame>
  );
}
