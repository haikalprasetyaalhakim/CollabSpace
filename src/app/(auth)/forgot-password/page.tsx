"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";

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
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          CollabSpace
        </Link>
        <Link
          href="/sign-in"
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-7">
          {sent ? (
            <div className="text-center flex flex-col gap-3">
              <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-xl">
                ✉️
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Check your email
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {email}
                </strong>{" "}
                is registered, we sent a reset link. Check your inbox (and spam
                folder).
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600">
                Link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Forgot password?
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
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
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none text-sm font-medium transition-colors"
                >
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
