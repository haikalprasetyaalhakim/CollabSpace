"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChannelWithStatus } from "../queries/get-all-channels";
import { toast } from "sonner";
import { Hash, Loader2, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinChannel } from "../actions/join-channel";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BrowserChannelsDialog({ open, onOpenChange }: Props) {
  const [channels, setChannels] = useState<ChannelWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => setChannels(data))
      .catch(() => toast.error("Failed to load channels."))
      .finally(() => setIsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;

    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [query, channels]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Browse channels
          </DialogTitle>
          <DialogDescription>
            {channels.length} channels in this workspace
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels..."
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto -mx-1 px-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-4 animate-spin text-zinc-400" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="size-5 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">
                No channels match &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                onJoined={() => {
                  setChannels((prev) =>
                    prev.map((c) =>
                      c.id === channel.id
                        ? {
                            ...c,
                            isJoined: true,
                            memberCount: c.memberCount + 1,
                          }
                        : c,
                    ),
                  );
                }}
                onNavigate={() => {
                  onOpenChange(false);
                  router.push(`/channels/${channel.id}`);
                }}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ChannelRowProps = {
  channel: ChannelWithStatus;
  onJoined: () => void;
  onNavigate: () => void;
};

export function ChannelRow({ channel, onJoined, onNavigate }: ChannelRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinChannel(channel.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Joined #${channel.name}`);
      onJoined();
    });
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group">
      <div className="size-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <Hash className="size-3.5 text-zinc-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          #{channel.name}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Users className="size-3" />
          <span>{channel.memberCount} members</span>
          {channel.description && (
            <>
              <span>.</span>
              <span className="truncate">{channel.description}</span>
            </>
          )}
        </div>
      </div>

      {channel.isJoined ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs shrink-0"
          onClick={onNavigate}
        >
          Open
        </Button>
      ) : (
        <Button
          size="sm"
          className="text-xs shrink-0 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
          onClick={handleJoin}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : "Join"}
        </Button>
      )}
    </div>
  );
}
