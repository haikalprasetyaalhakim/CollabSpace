import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { statusColor } from "@/constants";
import { getUserChannels } from "@/features/channels/queries/get-user-channels";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { getInitials } from "@/lib/utils";
import { Hash, MessageSquare, Volume2, Users, ArrowRight, Sparkles, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import NewChannelButton from "../../dashboard/_components/new-channel-button";
import InviteButton from "../../dashboard/_components/invite-button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type Props = {
  params: Promise<{ workspaceId: string }>;
};

export default async function Page({ params }: Props) {
  const session = await serverCompReqAuth();
  const { workspaceId } = await params;

  const [workspace, channels, onlineUsers] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, inviteCode: true, description: true, image: true },
    }),
    getUserChannels(workspaceId),
    prisma.user.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true, image: true, status: true },
      take: 8,
    }),
  ]);

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Workspace not found</p>
      </div>
    );
  }

  const recentMessages =
    channels.length > 0
      ? await prisma.message.findMany({
          where: { channelId: { in: channels.map((c) => c.id) } },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
            channel: { select: { id: true, name: true } },
          },
        })
      : [];

  const textChannelsCount = channels.filter((c) => c.type === "TEXT").length;
  const voiceChannelsCount = channels.filter((c) => c.type === "VOICE").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Dashboard
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-6 md:p-8 shadow-sm">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -mb-16 size-48 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative size-16 rounded-2xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                {workspace.image ? (
                  <Image
                    src={workspace.image}
                    alt={workspace.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {getInitials(workspace.name)}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  {getGreeting()}, {session.user.name.split(" ")[0]} <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Welcome to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{workspace.name}</span>. {workspace.description || "Here's what's happening today."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <InviteButton inviteCode={workspace.inviteCode} />
              <NewChannelButton />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-4 shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Hash className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-400 font-medium">Text Channels</p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{textChannelsCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-4 shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Volume2 className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-400 font-medium">Voice Channels</p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{voiceChannelsCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-4 shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-400 font-medium">Members Online</p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{onlineUsers.length}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-500" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Quick Channel Browser
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded-full">
                {channels.length} total
              </span>
            </div>
            <div className="divide-y divide-zinc-150/60 dark:divide-zinc-800/40 overflow-y-auto max-h-[300px]">
              {channels.slice(0, 6).map((channel) => (
                <Link
                  key={channel.id}
                  href={`/workspaces/${workspaceId}/channels/${channel.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/30">
                      {channel.type === "TEXT" ? (
                        <Hash className="size-4 text-zinc-500" />
                      ) : (
                        <Volume2 className="size-4 text-zinc-500" />
                      )}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">
                      {channel.name}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
              {channels.length === 0 && (
                <p className="px-5 py-8 text-sm text-zinc-400 text-center">
                  No channels inside this workspace. Create one above!
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <MessageSquare className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Messages
              </span>
            </div>
            <div className="divide-y divide-zinc-150/60 dark:divide-zinc-800/40 overflow-y-auto max-h-[300px]">
              {recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href={`/workspaces/${workspaceId}/channels/${msg.channelId}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors group"
                >
                  <Avatar className="size-7 shrink-0 mt-0.5">
                    <AvatarImage src={msg.user.image ?? ""} />
                    <AvatarFallback className="text-[9px] font-bold">
                      {getInitials(msg.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {msg.user.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 shrink-0">in</span>
                        <span className="text-[10px] font-medium text-zinc-500 truncate">
                          #{msg.channel?.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Clock className="size-3" /> Jump to channel
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-normal">
                      {msg.content}
                    </p>
                  </div>
                </Link>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-sm text-zinc-400 text-center px-5 py-8">
                  No messages recorded in channels yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 shadow-sm overflow-hidden md:col-span-2">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Online Members
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {onlineUsers.length} active
              </span>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-5">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback className="text-[8px] font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-white dark:border-zinc-950 ${statusColor[user.status]}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {user.name}
                  </span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p className="text-sm text-zinc-400">No members are online.</p>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
