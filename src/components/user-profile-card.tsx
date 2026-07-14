"use client";

import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { statusColor } from "@/constants";
import { usePresence } from "@/hooks/use-presence";
import { useParams, useRouter } from "next/navigation";
import { UserStatus } from "@/generated/prisma/enums";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";
import { useTransition } from "react";
import { getOrCreateConversation } from "@/features/dm/actions/get-or-create-conversation";
import { toast } from "sonner";

type Props = {
  userId: string;
  name: string;
  image: string | null;
  username?: string;
  isCurrentUser?: boolean;
  side?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
};

export default function UserProfileCard({
  userId,
  image,
  children,
  name,
  isCurrentUser,
  side = "right",
  username,
}: Props) {
  const { onlineUserIds, userStatuses } = usePresence();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const isOnline = onlineUserIds.has(userId);
  const status = (userStatuses.get(userId) ?? "offline") as UserStatus;
  const displayStatus = isOnline ? status : "offline";

  const handleMessage = () => {
    startTransition(async () => {
      if (!workspaceId) {
        toast.error("Workspace ID not found");
        return;
      }
      const result = await getOrCreateConversation(userId, workspaceId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/dm/${result.data?.conversationId}`);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} className="w-56 p-0 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl bg-white dark:bg-zinc-950 backdrop-blur-md">
        <div className="relative">
          <div className="h-16 w-full bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 dark:from-indigo-600/20 dark:to-violet-600/20 border-b border-zinc-200/20 dark:border-zinc-850/20" />
          
          <div className="absolute -bottom-7 left-4">
            <Avatar className="size-14 border-4 border-white dark:border-zinc-950 shadow-md">
              <AvatarImage src={image ?? ""} />
              <AvatarFallback className="text-lg font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-4 pt-9 pb-4 flex flex-col gap-4">
          <div>
            <p className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
              {name}
            </p>
            {username && (
              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
                @{username}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 w-fit px-2 py-0.5 rounded-full border border-zinc-250/30 dark:border-zinc-800/20">
              <span
                className={`size-1.5 rounded-full ${statusColor[displayStatus]} ${displayStatus === "online" ? "animate-pulse" : ""}`}
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize font-bold">
                {displayStatus === "busy" ? "Do not disturb" : displayStatus}
              </span>
            </div>
          </div>

          {!isCurrentUser && (
            <Button
              size="sm"
              className="w-full text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0 font-bold rounded-lg"
              disabled={isPending}
              onClick={handleMessage}
            >
              <MessageSquare className="size-3.5" />
              {isPending ? "Opening..." : "Message"}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
