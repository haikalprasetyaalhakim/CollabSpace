import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ChannelMemberPanel from "@/features/channels/components/channel-member-panel";
import { ChannelView } from "@/features/channels/components/channel-view";
import { LeaveChannelButton } from "@/features/channels/components/channel-settings-button";
import { getChannelMessages } from "@/features/channels/queries/get-channel-messages";
import { getPinnedMessageIds } from "@/features/channels/queries/get-pinned-messages";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { Hash } from "lucide-react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ highlight?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channelId } = await params;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { name: true },
  });

  return {
    title: channel ? `#${channel.name}` : "Channel",
  };
}

export default async function Page({ params, searchParams }: Props) {
  const session = await serverCompReqAuth();

  const { channelId } = await params;
  const { highlight } = await searchParams;

  const [channel, initialMessages, members, membership, initialPinnedIds] =
    await Promise.all([
      prisma.channel.findFirst({
        where: { id: channelId },
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          _count: { select: { channelMembers: true } },
        },
      }),
      getChannelMessages(channelId),
      prisma.channelMember.findMany({
        where: { channelId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              status: true,
              username: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      }),
      prisma.channelMember.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId,
          },
        },
      }),
      getPinnedMessageIds(channelId),
    ]);

  if (!channel) notFound();
  if (!membership) redirect("/dashboard");

  return (
    <SidebarInset className="h-svh overflow-hidden">
      <header className="flex items-center gap-3 px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <Hash className="size-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {channel.name}
            </span>
            <span className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full shrink-0">
              {channel._count.channelMembers} member
              {channel._count.channelMembers > 1 ? "s" : ""}
            </span>
          </div>
          {channel.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 max-w-[500px]">
              {channel.description}
            </p>
          )}
        </div>

        <div className="ml-auto">
          <LeaveChannelButton
            channelId={channel.id}
            channelName={channel.name}
            isOwner={channel.ownerId === session.user.id || !channel.ownerId}
            channelDescription={channel.description}
          />
        </div>
      </header>

      <div className="flex overflow-hidden flex-1 min-h-0">
        <div className="flex-1">
          <ChannelView
            channelId={channelId}
            channelName={channel.name}
            initialMessages={initialMessages}
            initialPinnedIds={initialPinnedIds}
            members={members.map((m) => m.user)}
            highlightMessageId={highlight}
          />
        </div>
        <ChannelMemberPanel
          members={members.map((m) => m.user)}
          currentUserId={session.user.id}
        />
      </div>
    </SidebarInset>
  );
}
