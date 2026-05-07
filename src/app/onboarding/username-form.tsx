"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { SubmitEvent, useState } from "react";
import { toast } from "sonner";

export default function UsernameForm() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/users/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. john_doe"
          className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/10"
        />
        <p className="text-xs text-zinc-400">
          3–20 characters. Letters, numbers, and underscores only.
        </p>
      </div>
      <Button
        type="submit"
        className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none"
        disabled={username.length < 3 || isLoading}
      >
        {isLoading ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
