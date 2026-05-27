import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getChannelUnreadCounts(
  workspaceId: string,
): Promise<Record<string, number>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return {};

  const userId = session.user.id;

  const memberships = await prisma.channelMember.findMany({
    where: {
      userId,
      channel: {
        workspaceId,
      },
    },
    select: { channelId: true },
  });

  const readRecords = await prisma.channelRead.findMany({
    where: {
      userId,
      channelId: { in: memberships.map((m) => m.channelId) },
    },
    select: { channelId: true, lastReadAt: true },
  });

  const readMap = new Map(readRecords.map((r) => [r.channelId, r.lastReadAt]));

  const counts = await Promise.all(
    memberships.map(async ({ channelId }) => {
      const lastReadAt = readMap.get(channelId);
      const count = await prisma.message.count({
        where: {
          channelId,
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      return [channelId, count] as const;
    }),
  );

  return Object.fromEntries(counts);
}
