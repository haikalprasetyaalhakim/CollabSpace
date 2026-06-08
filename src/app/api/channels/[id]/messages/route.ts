import { PAGINATION_LIMIT } from "@/constants";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: channelId } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");

  if (!cursor) {
    return Response.json({ error: "cursor is required" }, { status: 400 });
  }

  const cursorMessage = await prisma.message.findUnique({
    where: { id: cursor },
    select: { createdAt: true },
  });

  if (!cursorMessage) {
    return Response.json(
      { error: "Cursor message not found" },
      { status: 404 },
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      threadParentId: null,
      createdAt: { lt: cursorMessage.createdAt },
    },
    include: {
      user: { select: { id: true, name: true, image: true, username: true } },
      messageReactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
          user: { select: { name: true } },
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          threadReplies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGINATION_LIMIT,
  });

  const ordered = messages.reverse();

  return Response.json({
    messages: ordered,
    hasMore: messages.length === PAGINATION_LIMIT,
  });
}
