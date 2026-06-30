import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserChannels(workspaceId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const memberships = await prisma.channelMember.findMany({
    where: {
      userId: session.user.id,
      channel: {
        workspaceId: workspaceId,
      },
    },
    include: {
      channel: {
        select: { id: true, name: true, type: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => m.channel);
}
