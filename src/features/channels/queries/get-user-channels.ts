import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserChannels(workspaceId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const isWorkspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });
  if (!isWorkspaceMember) return [];

  const channels = await prisma.channel.findMany({
    where: { workspaceId },
    select: { id: true, name: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  return channels;
}
