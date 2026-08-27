"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthToken } from "@/lib/auth/api";
import { useAuth } from "@/lib/auth/AuthContext";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  passwordMaxLength?: number;
  passwordMinLength?: number;
  onSubmit: (email: string, password: string) => Promise<AuthToken>;
  footer: ReactNode;
}

export default function AuthForm({
  title,
  submitLabel,
  submittingLabel,
  passwordMaxLength,
  passwordMinLength,
  onSubmit,
  footer,
}: AuthFormProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await onSubmit(email, password);
      await signIn(token.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-lg font-semibold text-[#032147]">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            minLength={passwordMinLength}
            maxLength={passwordMaxLength}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordMinLength ? `At least ${passwordMinLength} characters` : "Your password"}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f2e75] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>

        <p className="text-center text-sm text-[#888888]">{footer}</p>
      </form>
    </main>
  );
}
