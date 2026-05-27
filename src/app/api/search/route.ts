import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId)
    return Response.json({ error: "workspaceId is required" }, { status: 400 });

  if (!q || q.length < 2)
    return Response.json({ channels: [], messages: [], dms: [] });

  const userId = session.user.id;

  const [channels, messages, dms] = await Promise.all([
    prisma.channel.findMany({
      where: {
        workspaceId,
        name: { contains: q, mode: "insensitive" },
        channelMembers: { some: { userId } },
      },
      select: { id: true, name: true },
      take: 5,
    }),

    prisma.message.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
        channel: {
          workspaceId,
          channelMembers: { some: { userId } },
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        channelId: true,
        channel: { select: { name: true } },
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    prisma.directMessage.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
        conversation: {
          workspaceId,
          OR: [{ memberOneId: userId }, { memberTwoId: userId }],
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return Response.json({ channels, messages, dms });
}
