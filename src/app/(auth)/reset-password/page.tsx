"use client";

import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center flex flex-col gap-3 max-w-sm">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Invalid reset link
          </h1>
          <p className="text-sm text-zinc-500">
            This link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-50 underline underline-offset-4"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <div className="flex items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          CollabSpace
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-7">
          <div className="text-center flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Set new password
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Choose a strong password for your account.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
