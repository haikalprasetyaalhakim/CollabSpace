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
import CreateChannelDialog from "@/features/channels/components/create-channel-dialog";
import { ChannelType } from "@/generated/prisma/enums";
import { usePresence } from "@/hooks/use-presence";
import { useUnread } from "@/hooks/use-unread";
import { getInitials } from "@/lib/utils";
import { Hash, MicOff, Plus, Video, Volume2 } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

type Channel = { id: string; name: string; type: ChannelType };

export default function SidebarChannels({ channels }: { channels: Channel[] }) {
  const pathname = usePathname();
  const params = useParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"TEXT" | "VOICE">("TEXT");

  const { channelUnread, mentionedChannels } = useUnread();
  const { voiceParticipants } = usePresence();

  const workspaceId = params.workspaceId as string;

  const textChannels = channels.filter((c) => c.type === "TEXT");
  const voiceChannels = channels.filter((c) => c.type === "VOICE");



  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Text Channels</SidebarGroupLabel>
        <SidebarGroupAction
          title="Add channel"
          onClick={() => {
            setDialogType("TEXT");
            setDialogOpen(true);
          }}
        >
          <Plus className="size-3.5" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {textChannels.map((channel) => {
              const firstMentionId = mentionedChannels.get(channel.id)
                ? [...mentionedChannels.get(channel.id)!][0]
                : null;

              return (
                <SidebarMenuItem key={channel.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={`#${channel.name}`}
                    isActive={
                      pathname ===
                      `/workspaces/${workspaceId}/channels/${channel.id}`
                    }
                  >
                    <Link
                      href={
                        firstMentionId
                          ? `/workspaces/${workspaceId}/channels/${channel.id}?highlight=${firstMentionId}`
                          : `/workspaces/${workspaceId}/channels/${channel.id}`
                      }
                      className="flex items-center justify-between w-full gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash className="shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </div>
                      {!!channelUnread[channel.id] && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[10px] font-semibold flex items-center justify-center px-1 ">
                          {channelUnread[channel.id] > 99
                            ? "99+"
                            : channelUnread[channel.id]}
                        </span>
                      )}
                      {mentionedChannels.has(channel.id) && (
                        <span className="shrink-0 h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                          @
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {textChannels.length === 0 && (
              <p className="text-xs text-zinc-400 px-2 py-1">No channels yet</p>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Voice Channels</SidebarGroupLabel>
        <SidebarGroupAction
          title="Add voice channel"
          onClick={() => {
            setDialogType("VOICE");
            setDialogOpen(true);
          }}
        >
          <Plus className="size-3.5" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {voiceChannels.map((channel) => {
              const participants = Array.from(
                voiceParticipants.values(),
              ).filter((p) => p.channelId === channel.id);

              return (
                <SidebarMenuItem key={channel.id}>
                  <SidebarMenuButton
                    asChild
                    tooltip={channel.name}
                    isActive={
                      pathname ===
                      `/workspaces/${workspaceId}/channels/${channel.id}`
                    }
                  >
                    <Link
                      href={`/workspaces/${workspaceId}/channels/${channel.id}`}
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="shrink-0" />
                      <span className="truncate">{channel.name}</span>
                    </Link>
                  </SidebarMenuButton>

                  {participants.length > 0 && (
                    <div className="pl-6 pr-2 py-1 flex flex-col gap-1.5 mt-0.5 select-none">
                      {participants.map((user) => {
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between group/member px-2 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`relative rounded-full p-0.5 transition-all ${
                                  user.isSpeaking
                                    ? "ring-2 ring-emerald-500/80 bg-emerald-500/10"
                                    : ""
                                }`}
                              >
                                <Avatar className="size-4.5">
                                  <AvatarImage src={user.image ?? ""} />
                                  <AvatarFallback className="text-[8px] bg-zinc-800 text-zinc-300 font-bold">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>

                              <span
                                className={`text-[11px] truncate transition-colors ${
                                  user.isSpeaking
                                    ? "text-emerald-400 font-medium animate-pulse"
                                    : "text-zinc-400 group-hover/member:text-zinc-200"
                                }`}
                              >
                                {user.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-70 group-hover/member:opacity-100 transition-opacity shrink-0">
                              {user.isMuted && (
                                <MicOff className="size-3 text-red-500" />
                              )}
                              {!user.isCameraOff && (
                                <Video className="size-3 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              );
            })}
            {voiceChannels.length === 0 && (
              <p className="text-xs text-zinc-400 px-2 py-1">
                No voice channels
              </p>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <CreateChannelDialog
        key={dialogType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
      />
    </>
  );
}
