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
    <SidebarInset>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-full" />
        <Hash className="size-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {channel.name}
        </span>
        <span className="text-xs text-zinc-400 ml-1">
          {channel._count.channelMembers} members
        </span>

        <div className="ml-auto">
          <LeaveChannelButton
            channelId={channel.id}
            channelName={channel.name}
            isOwner={channel.ownerId === session.user.id || !channel.ownerId}
            channelDescription={channel.description}
          />
        </div>
      </header>

      <div className="flex overflow-hidden">
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
