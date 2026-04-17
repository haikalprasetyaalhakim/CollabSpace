"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { createChannel } from "../actions/create-channel";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateChannelDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createChannel({ name, description });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`#${formattedName} created!`);
      onOpenChange(false);
      setName("");
      setDescription("");
      router.push(`/channels/${result.data!.id}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Channels are where your team communicates around a topic
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-1 w-full overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Channel name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. marketing"
                maxLength={80}
                className="pl-8"
                autoFocus
              />
            </div>
            {formattedName && (
              <p className="text-xs text-zinc-400 flex gap-1 min-w-0">
                <span className="shrink-0">Will be created as</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate">
                  #{formattedName}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Description{" "}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              maxLength={200}
            />
          </div>

          {formattedName && (
            <div className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 flex items-center gap-2.5 overflow-hidden">
              <div className="size-7 rounded-md bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center shrink-0">
                <Hash className="size-3.5 text-white dark:text-zinc-900" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  #{formattedName}
                </p>
                <p className="text-xs text-zinc-400">0 members</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isPending}
              className="text-xs bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
            >
              {isPending ? "Creating..." : "Create channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
