import GoogleAuthButton from "@/features/auth/components/google-auth-button";
import SignUpForm from "@/features/auth/components/sign-up-form";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your CollabSpace account.",
};

export default function SignUpPage() {
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
        <p className="text-xs text-zinc-550 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-zinc-900 dark:text-zinc-50 font-bold hover:underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-[400px] flex flex-col gap-6 bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl backdrop-blur-md my-8">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create your account
            </h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400">
              Start collaborating with your team in seconds.
            </p>
          </div>

          <GoogleAuthButton />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-150 dark:bg-zinc-805" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-150 dark:bg-zinc-805" />
          </div>

          <SignUpForm />

          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed font-normal">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-zinc-650 dark:hover:text-zinc-400 transition-colors font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-zinc-650 dark:hover:text-zinc-400 transition-colors font-medium"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
