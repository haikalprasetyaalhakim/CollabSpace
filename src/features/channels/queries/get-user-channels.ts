import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserChannels() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const memberships = await prisma.channelMember.findMany({
    where: { userId: session.user.id },
    include: {
      channel: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => m.channel);
}
