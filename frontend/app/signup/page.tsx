"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { signup } from "@/lib/auth/api";

export default function SignupPage() {
  return (
    <AuthForm
      title="Create an account"
      submitLabel="Sign up"
      submittingLabel="Creating account..."
      passwordMinLength={8}
      passwordMaxLength={128}
      onSubmit={signup}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[#209dd7] hover:underline">
            Sign in
          </Link>
        </>
      }
    />
  );
}
