"use client";

import { useState } from "react";
import GoogleIcon from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  disabled?: boolean;
}

export default function GoogleAuthButton({
  disabled = false,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
      });
    } catch {
      setIsLoading(false);
      toast.error("Failed to connect to Google. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-2xs transition-all hover:-translate-y-0.5"
      onClick={handleGoogleSignUp}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin text-zinc-500" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  );
}
