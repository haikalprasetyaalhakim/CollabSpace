"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { statusColor } from "@/constants";
import { UserStatus } from "@/generated/prisma/enums";
import { getInitials } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { getOrCreateConversation } from "../actions/get-or-create-conversation";

type User = {
  id: string;
  name: string;
  image: string | null;
  status: UserStatus;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NewDmDialog({ open, onOpenChange }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setIsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [query, users]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {users.length} members in this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members..."
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-4 animate-spin text-zinc-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="size-5 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">
                No members match &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSelect={() => onOpenChange(false)}
                router={router}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({
  user,
  onSelect,
  router,
}: {
  user: User;
  onSelect: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await getOrCreateConversation(user.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onSelect();
      router.push(`/dm/${result.data!.conversationId}`);
    });
  };

  return (
    <button
      disabled={isPending}
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left w-full disabled:opacity-50"
    >
      <div className="relative shrink-0">
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? ""} />
          <AvatarFallback className="text-xs font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 size-2 rounded-full border border-white dark:border-zinc-900 ${statusColor[user.status]}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {user.name}
        </p>
        <p className="text-xs text-zinc-400 capitalize">{user.status}</p>
      </div>

      {isPending && (
        <Loader2 className="size-3.5 animate-spin text-zinc-400 shrink-0" />
      )}
    </button>
  );
}
