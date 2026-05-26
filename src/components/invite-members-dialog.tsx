"use client";

import { Check, Loader2, Search, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "./ui/button";
import { inviteToChannel } from "@/features/channels/actions/invite-to-channel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  currentMembers: { id: string }[];
  onMemberAdded?: (user: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
    status: any;
  }) => void;
};

export default function InviteMemberDialog({
  channelId,
  channelName,
  currentMembers,
  onOpenChange,
  open,
  onMemberAdded,
}: Props) {
  const [users, setUsers] = useState<any>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitedIds, setInviteIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (u: any) => !currentMembers.some((m) => m.id === u.id),
        );
        setUsers(filtered);
      })
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setIsLoading(false));
  }, [open, currentMembers]);

  const filteredUsers = users.filter((u: any) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      u.name.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term))
    );
  });

  const handleInvite = (user: any) => {
    startTransition(async () => {
      const result = await inviteToChannel(channelId, user.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Successfully invited ${user.name} to #${channelName}`);
      setInviteIds((prev) => new Set([...prev, user.id]));

      onMemberAdded?.({
        id: user.id,
        name: user.name,
        image: user.image,
        username: user.username ?? null,
        status: user.status ?? "offline",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <UserPlus className="size-4 text-zinc-500" />
            Invite Friends
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500">
            Invite users to join the channel #{channelName}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto mt-3 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-zinc-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-400">
              No users to invite
            </div>
          ) : (
            filteredUsers.map((user: any) => {
              const isInvited = invitedIds.has(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-8">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {user.name}
                      </p>
                      {user.username && (
                        <p className="text-xs text-zinc-400 truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isInvited ? "outline" : "default"}
                    disabled={isInvited || isPending}
                    onClick={() => handleInvite(user)}
                    className={`h-7 px-3 text-xs shadow-none border-0 ${
                      isInvited
                        ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-150 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-default"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    }`}
                  >
                    {isInvited ? (
                      <span className="flex items-center gap-1">
                        <Check className="size-3 text-emerald-500" />
                      </span>
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
