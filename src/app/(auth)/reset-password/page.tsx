"use client";

import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function Page() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-[400px] flex flex-col gap-6 bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl backdrop-blur-md text-center items-center">
          <div className="size-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs border border-amber-250/50 dark:border-amber-800/30">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Invalid Reset Link
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
              This link is invalid or has expired. Please request a new link to reset your password.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 hover:underline underline-offset-4 flex items-center gap-1.5 mt-2"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-10 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 group">
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            CollabSpace<span className="text-indigo-500 font-extrabold">.</span>
          </span>
        </Link>
        <Link
          href="/sign-in"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-[400px] flex flex-col gap-6 bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Set new password
            </h1>
            <p className="text-xs text-zinc-555 dark:text-zinc-400">
              Choose a strong, secure password for your CollabSpace account.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
