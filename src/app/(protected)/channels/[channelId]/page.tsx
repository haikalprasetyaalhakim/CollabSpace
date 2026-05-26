import { SidebarInset } from "@/components/ui/sidebar";
import { ChannelView } from "@/features/channels/components/channel-view";
import { getChannelMessages } from "@/features/channels/queries/get-channel-messages";
import { getPinnedMessageIds } from "@/features/channels/queries/get-pinned-messages";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
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
      <ChannelView
        channelId={channelId}
        channelName={channel.name}
        channelDescription={channel.description}
        ownerId={channel.ownerId}
        initialMessages={initialMessages}
        initialPinnedIds={initialPinnedIds}
        members={members.map((m) => m.user)}
        highlightMessageId={highlight}
        memberCount={channel._count.channelMembers}
        currentUserId={session.user.id}
      />
    </SidebarInset>
  );
}
