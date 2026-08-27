"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { signin } from "@/lib/auth/api";

export default function LoginPage() {
  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      submittingLabel="Signing in..."
      onSubmit={signin}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#209dd7] hover:underline">
            Sign up
          </Link>
        </>
      }
    />
  );
}
