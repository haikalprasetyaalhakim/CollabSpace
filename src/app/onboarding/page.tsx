import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UsernameForm from "./username-form";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/sign-in");
  if (session.user.username) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Choose your username
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This is how others will @mention you in CollabSpace.
          </p>
        </div>
        <UsernameForm />
      </div>
    </div>
  );
}
