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
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

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
  const online = members.filter((m) => m.status !== "offline");
  const offline = members.filter((m) => m.status === "offline");

  return (
    <aside className="w-56 shrink-0 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-y-auto overflow-x-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Members - {members.length}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-3">
        {online.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide px-2 mb-1">
              Online - {online.length}
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
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide px-2 mb-1">
              Offline - {offline.length}
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

  const handleMessage = () => {
    startTransition(async () => {
      const result = await getOrCreateConversation(member.id);
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
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group">
          <div className="relative shrink-0">
            <Avatar className="size-7">
              <AvatarImage src={member.image ?? ""} />
              <AvatarFallback className="text-[10px] font-semibold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 size-2 rounded-full border border-white dark:border-zinc-900 ${statusColor[member.status]} ${member.status === "online" ? "animate-status-pulse" : ""}`}
            />
          </div>

          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {member.name}
            {isCurrentUser && (
              <span className="text-zinc-400 font-normal">(you)</span>
            )}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent side="left" className="w-56 p-0 overflow-hidden">
        <div className="bg-zinc-100 dark:bg-zinc-800 px-4 pt-4 pb-6">
          <Avatar className="size-14">
            <AvatarImage src={member.image ?? ""} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="px-4 pt-3 pb-4 flex flex-col gap-4">
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
              {member.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`size-1.5 rounded-full ${statusColor[member.status]}`}
              />
              <span className="text-xs text-zinc-400 capitalize">
                {member.status}
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
