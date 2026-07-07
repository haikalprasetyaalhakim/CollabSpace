import { SidebarInset } from "@/components/ui/sidebar";
import { ChannelView } from "@/features/channels/components/channel-view";
import VoiceChannelView from "@/features/channels/components/voice-channel-view";
import { getChannelMessages } from "@/features/channels/queries/get-channel-messages";
import { getPinnedMessageIds } from "@/features/channels/queries/get-pinned-messages";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceId: string; channelId: string }>;
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

  const { channelId, workspaceId } = await params;
  const { highlight } = await searchParams;

  const [channel, membership] = await Promise.all([
    prisma.channel.findFirst({
      where: { id: channelId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        ownerId: true,
        _count: { select: { channelMembers: true } },
      },
    }),
    prisma.channelMember.findUnique({
      where: { userId_channelId: { userId: session.user.id, channelId } },
    }),
  ]);

  if (!channel) notFound();

  if (!membership) {
    const isWorkspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!isWorkspaceMember) return redirect(`/workspaces/${workspaceId}`);

    await prisma.channelMember.create({
      data: {
        userId: session.user.id,
        channelId,
      },
    });
  }

  if (channel.type === "VOICE") {
    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, name: true, image: true, status: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return (
      <SidebarInset className="h-svh overflow-hidden">
        <VoiceChannelView
          channelId={channel.id}
          channelName={channel.name}
          members={members.map((d) => d.user)}
          currentUserId={session.user.id}
        />
      </SidebarInset>
    );
  }

  const [initialMessages, members, initialPinnedIds] = await Promise.all([
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
    getPinnedMessageIds(channelId),
  ]);

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
