"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthNav() {
  const { user, isLoading, signOut } = useAuth();

  return (
    <div className="border-b border-slate-200 bg-[#032147]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-sm text-white">
        <Link href="/" className="font-semibold text-[#ecad0a]">
          Prelegal
        </Link>

        {isLoading ? null : user ? (
          <div className="flex items-center gap-4">
            <span className="text-slate-200">{user.email}</span>
            <button type="button" onClick={signOut} className="text-slate-200 hover:text-white">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-200 hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="text-slate-200 hover:text-white">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
