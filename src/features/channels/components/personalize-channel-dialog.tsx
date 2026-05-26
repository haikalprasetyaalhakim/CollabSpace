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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Loader2, Settings } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateChannel } from "../actions/update-channel";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  channelDescription: string | null;
};

export default function PersonalizeChannelDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  channelDescription,
}: Props) {
  const [name, setName] = useState(channelName);
  const [description, setDescription] = useState(channelDescription ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const previewName =
    name.trim().toLowerCase().replace(/\s+/g, "-") || channelName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateChannel(channelId, {
        name,
        description: description || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Channel personalized successfully!");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Settings className="size-4 text-zinc-500" />
            Personalize Channel
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500">
            Customize how this channel appears to members
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-2"
        >
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Channel Name
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. general"
                  maxLength={80}
                  className="pl-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                maxLength={200}
                rows={4}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none text-sm"
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!name.trim() || isPending}
                className="text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col justify-start">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Live Preview
            </Label>

            <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full min-h-[220px]">
              <div className="h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full relative" />

              <div className="px-4 pb-4 pt-1 flex-1 flex flex-col relative">
                <div className="size-12 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-zinc-100 dark:border-zinc-900 absolute -top-6 left-4 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-sm font-bold">
                  <Hash className="size-5" />
                </div>

                <div className="mt-8 flex-1 flex flex-col min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                    #{previewName}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-3 leading-relaxed break-all">
                    {description.trim() ||
                      "No description set yet. Edit this channel settings to add one."}
                  </p>

                  <div className="mt-auto pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Preview Card</span>
                    <span>CollabSpace</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
