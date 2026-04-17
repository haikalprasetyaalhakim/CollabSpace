import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getAllChannels() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return [];

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { channelMembers: true } },
      channelMembers: {
        where: { userId: session.user.id },
        select: { userId: true },
      },
    },
    take: 200,
  });

  return channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description,
    memberCount: channel._count.channelMembers,
    isJoined: channel.channelMembers.length > 0,
  }));
}

export type ChannelWithStatus = Awaited<
  ReturnType<typeof getAllChannels>
>[number];
