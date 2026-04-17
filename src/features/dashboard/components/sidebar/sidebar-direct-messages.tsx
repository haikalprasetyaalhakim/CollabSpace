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
import NewDmDialog from "@/features/dm/components/new-dm-dialog";
import { ConversationWithUser } from "@/features/dm/queries/get-user-conversations";
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
            {conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={conv.otherUser.name}
                  isActive={pathname === `/dm/${conv.id}`}
                >
                  <Link href={`/dm/${conv.id}`}>
                    <Avatar className="size-7">
                      <AvatarImage src={conv.otherUser.image ?? ""} />
                      <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        {getInitials(conv.otherUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{conv.otherUser.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

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
