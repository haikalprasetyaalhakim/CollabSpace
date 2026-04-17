import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { statusColor } from "@/constants";
import { getUserChannels } from "@/features/channels/queries/get-user-channels";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { getInitials } from "@/lib/utils";
import { Hash, MessageSquare } from "lucide-react";
import Link from "next/link";
import NewChannelButton from "./_components/new-channel-button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function Page() {
  const session = await serverCompReqAuth();

  const [channels, onlineUsers] = await Promise.all([
    getUserChannels(),
    prisma.user.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true, image: true, status: true },
      take: 8,
    }),
  ]);

  const recentMessages =
    channels.length > 0
      ? await prisma.message.findMany({
          where: { channelId: { in: channels.map((c) => c.id) } },
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
            channel: { select: { id: true, name: true } },
          },
        })
      : [];

  return (
    <SidebarInset>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <SidebarTrigger />
        <Separator orientation="vertical" />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Dashboard
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {getGreeting()},{session.user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Here&apos;s what&apos;s happening in your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <NewChannelButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="size-3.5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Your channels
                </span>
              </div>
              <span className="text-xs text-zinc-400">{channels.length}</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {channels.slice(0, 6).map((channel) => (
                <Link
                  key={channel.id}
                  href={`/channels/${channel.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="size-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Hash className="size-3.5 text-zinc-500" />
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    {channel.name}
                  </span>
                </Link>
              ))}
              {channels.length === 0 && (
                <p className="px-4 py-6 text-sm text-zinc-400 text-center">
                  You haven&apos; joined any channels yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <MessageSquare className="size-3.5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Recent Messages
              </span>
            </div>
            <div className="divide-y  divide-zinc-100 dark:divide-zinc-800/60">
              {recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href={`/channels/${msg.channelId}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <Avatar className="size-6 shrink-0 mt-0.5">
                    <AvatarImage src={msg.user.image ?? ""} />
                    <AvatarFallback className="text-[9px] font-semibold">
                      {getInitials(msg.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 shrink-0">
                        {msg.user.name}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0">in</span>
                      <span className="text-xs text-zinc-500 truncate">
                        #{msg.channel?.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {msg.content}
                    </p>
                  </div>
                </Link>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-sm text-zinc-400 text-center px-4 py-6">
                  No recent messages.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden md:col-span-2">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Online Now
              </span>
              <span className="text-xs text-zinc-400">
                {onlineUsers.length} online
              </span>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-5">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback className="text-[8px] font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full border border-white dark:border-zinc-800 ${statusColor[user.status]}`}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {user.name}
                  </span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p className="text-sm text-zinc-400">No one is online.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
