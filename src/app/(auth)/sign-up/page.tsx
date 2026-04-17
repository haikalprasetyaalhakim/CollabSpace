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
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          CollabSpace
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-zinc-900 dark:text-zinc-50 font-medium underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-7">
          <div className="text-center flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create your account
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Start collaborating with your team in seconds.
            </p>
          </div>

          <GoogleAuthButton />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-400 dark:text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <SignUpForm />

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
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
