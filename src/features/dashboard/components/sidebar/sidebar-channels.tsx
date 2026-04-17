"use client";

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import BrowserChannelsDialog from "@/features/channels/components/browser-channels-dialog";
import CreateChannelDialog from "@/features/channels/components/create-channel-dialog";
import { Hash, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Channel = { id: string; name: string };

export default function SidebarChannels({ channels }: { channels: Channel[] }) {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Channels</SidebarGroupLabel>
        <SidebarGroupAction
          title="Add channel"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-3.5" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {channels.map((channel) => (
              <SidebarMenuItem key={channel.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={`#${channel.name}`}
                  isActive={pathname === `/channels/${channel.id}`}
                >
                  <Link href={`/channels/${channel.id}`}>
                    <Hash />
                    <span>{channel.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {channels.length === 0 && (
              <p className="text-xs text-zinc-400 px-2 py-1">No channels yet</p>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
        <div className="px-2 mt-1">
          <button
            onClick={() => setBrowseOpen(true)}
            className="w-full text-left text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            + Browse channels
          </button>
        </div>
      </SidebarGroup>

      <CreateChannelDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BrowserChannelsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
    </>
  );
}
