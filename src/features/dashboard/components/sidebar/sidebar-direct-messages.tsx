"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { statusColor } from "@/constants";
import NewDmDialog from "@/features/dm/components/new-dm-dialog";
import { ConversationWithUser } from "@/features/dm/queries/get-user-conversations";
import { usePresence } from "@/hooks/use-presence";
import { useUnread } from "@/hooks/use-unread";
import { getInitials } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  conversations: ConversationWithUser[];
};

export default function SidebarDirectMessages({ conversations }: Props) {
  const pathname = usePathname();
  const { onlineUserIds, userStatuses } = usePresence();
  const { conversationUnread, mentionedConversations } = useUnread();

  const [newDmOpen, setNewDmOpen] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
        <SidebarGroupAction
          title="New direct message"
          onClick={() => setNewDmOpen(true)}
        >
          <Plus className="size-3.5" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {conversations.map((conv) => {
              const firstMentionId = mentionedConversations.get(conv.id)
                ? [...mentionedConversations.get(conv.id)!][0]
                : null;

              return (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={conv.otherUser.name}
                    isActive={pathname === `/dm/${conv.id}`}
                  >
                    <Link
                      href={
                        firstMentionId
                          ? `/dm/${conv.id}?highlight=${firstMentionId}`
                          : `/dm/${conv.id}`
                      }
                      className="flex items-center justify-between w-full gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="size-7">
                            <AvatarImage src={conv.otherUser.image ?? ""} />
                            <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                              {getInitials(conv.otherUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          {onlineUserIds.has(conv.otherUser.id) && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-white dark:border-[#09090b] ${statusColor[(userStatuses.get(conv.otherUser.id) ?? "online") as keyof typeof statusColor]}`}
                            />
                          )}
                        </div>
                        <span className="truncate">{conv.otherUser.name}</span>
                      </div>
                      {!!conversationUnread[conv.id] && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[10px] font-semibold flex items-center justify-center px-1">
                          {conversationUnread[conv.id] > 99
                            ? "99+"
                            : conversationUnread[conv.id]}
                        </span>
                      )}
                      {mentionedConversations.has(conv.id) && (
                        <span className="shrink-0 h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                          @
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {conversations.length === 0 && (
              <p className="text-xs text-zinc-400 px-2 py-1">
                No direct message yet
              </p>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <NewDmDialog open={newDmOpen} onOpenChange={setNewDmOpen} />
    </>
  );
}
