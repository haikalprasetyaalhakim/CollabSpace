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
      <PopoverContent side={side} className="w-56 p-0 overflow-hidden">
        <div className="bg-zinc-100 dark:bg-zinc-800 px-4 pt-4 pb-6">
          <Avatar className="size-14">
            <AvatarImage src={image ?? ""} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="px-4 pt-3 pb-4 flex flex-col gap-4">
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
              {name}
            </p>
            {username && <p className="text-xs text-zinc-400">@{username}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`size-1.5 rounded-full ${statusColor[displayStatus]}`}
              />
              <span className="text-xs text-zinc-400 capitalize">
                {displayStatus === "busy" ? "Do not disturb" : displayStatus}
              </span>
            </div>
          </div>
          {!isCurrentUser && (
            <Button
              size="sm"
              className="w-full text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
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
