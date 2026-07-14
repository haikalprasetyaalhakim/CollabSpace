"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getOrCreateConversation } from "@/features/dm/actions/get-or-create-conversation";
import { UserStatus } from "@/generated/prisma/enums";
import { getInitials } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { usePresence } from "@/hooks/use-presence";

type Member = {
  id: string;
  name: string;
  image: string | null;
  status: UserStatus;
};

type Props = {
  members: Member[];
  currentUserId: string;
};

const statusColor: Record<UserStatus, string> = {
  online: "bg-emerald-500",
  away: "bg-yellow-400",
  busy: "bg-red-500",
  offline: "bg-zinc-400",
};

export default function ChannelMemberPanel({ members, currentUserId }: Props) {
  const { onlineUserIds, userStatuses } = usePresence();

  const mappedMembers = members.map((m) => {
    const isOnline = onlineUserIds.has(m.id);
    const status = isOnline ? ((userStatuses.get(m.id) as UserStatus) ?? "online") : "offline";
    return { ...m, status };
  });

  const online = mappedMembers.filter((m) => m.status !== "offline");
  const offline = mappedMembers.filter((m) => m.status === "offline");

  return (
    <aside className="w-56 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10 backdrop-blur-xs flex flex-col overflow-y-auto overflow-x-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Members — {members.length}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-3 select-none">
        {online.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500/80 uppercase tracking-widest px-2 mb-1.5">
              Online — {online.length}
            </p>
            {online.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        )}

        {offline.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500/80 uppercase tracking-widest px-2 mb-1.5">
              Offline — {offline.length}
            </p>
            {offline.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

type MemberRowProps = {
  member: Member;
  isCurrentUser: boolean;
};

function MemberRow({ member, isCurrentUser }: MemberRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const handleMessage = () => {
    startTransition(async () => {
      if (!workspaceId) {
        toast.error("Workspace ID not found");
        return;
      }
      const result = await getOrCreateConversation(member.id, workspaceId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      router.push(`/dm/${result.data?.conversationId}`);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-all cursor-pointer group active:scale-[0.98]">
          <div className="relative shrink-0">
            <Avatar className="size-7 border border-zinc-200/50 dark:border-zinc-800/50">
              <AvatarImage src={member.image ?? ""} />
              <AvatarFallback className="text-[9px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 size-2 rounded-full border border-white dark:border-zinc-900 ${statusColor[member.status]} ${member.status === "online" ? "animate-pulse" : ""}`}
            />
          </div>

          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 truncate transition-colors flex items-center gap-1.5">
            {member.name}
            {isCurrentUser && (
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">you</span>
            )}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent side="left" className="w-56 p-0 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl bg-white dark:bg-zinc-950 backdrop-blur-md">
        <div className="relative">
          <div className="h-16 w-full bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 dark:from-indigo-600/20 dark:to-violet-600/20 border-b border-zinc-200/20 dark:border-zinc-850/20" />
          
          <div className="absolute -bottom-7 left-4">
            <Avatar className="size-14 border-4 border-white dark:border-zinc-950 shadow-md">
              <AvatarImage src={member.image ?? ""} />
              <AvatarFallback className="text-lg font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-4 pt-9 pb-4 flex flex-col gap-4">
          <div>
            <p className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
              {member.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 w-fit px-2 py-0.5 rounded-full border border-zinc-250/30 dark:border-zinc-800/20">
              <span
                className={`size-1.5 rounded-full ${statusColor[member.status]} ${member.status === "online" ? "animate-pulse" : ""}`}
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize font-bold">
                {member.status}
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
