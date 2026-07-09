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

  const { id: conversationId } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  if (!cursor)
    return Response.json({ error: "cursor is required" }, { status: 400 });

  const cursorMessage = await prisma.directMessage.findUnique({
    where: { id: cursor },
    select: { createdAt: true },
  });

  if (!cursorMessage)
    return Response.json({ error: "Cursor not found" }, { status: 404 });

  const messages = await prisma.directMessage.findMany({
    where: {
      conversationId,
      createdAt: { lt: cursorMessage.createdAt },
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      directMessageReactions: {
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
          images: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGINATION_LIMIT,
  });

  return Response.json({
    messages: messages.reverse(),
    hasMore: messages.length === PAGINATION_LIMIT,
  });
}
