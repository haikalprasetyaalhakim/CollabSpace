"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: "/reset-password",
      },
      {
        onSuccess: () => setSent(true),
      },
    );

    setIsPending(false);
  };

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
          {sent ? (
            <div className="text-center flex flex-col gap-4">
              <div className="size-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-xl shadow-xs border border-indigo-200/50 dark:border-indigo-800/30">
                <Mail className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Check your email
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  If <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong> is registered, we sent a password reset link. Check your inbox.
                </p>
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-normal">
                The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Forgot password?
                </h1>
                <p className="text-xs text-zinc-555 dark:text-zinc-400">
                  Enter your email address and we&apos;ll send you a password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="text-xs h-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-9 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold transition-colors mt-2 gap-1.5"
                >
                  {isPending ? "Sending..." : "Send reset link"}
                  {!isPending && <Send className="size-3" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
