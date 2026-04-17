"use client";

import GoogleIcon from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function GoogleAuthButton() {
  const handleGoogleSignUp = async () => {
    await authClient.signIn.social({
      provider: "google",
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full h-10 text-sm font-medium flex items-center gap-2.5 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-none"
      onClick={handleGoogleSignUp}
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}
