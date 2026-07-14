import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const THREAD_REPLIES_LIMIT = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = THREAD_REPLIES_LIMIT;

  // Since we want the latest replies first (to load older ones when scrolling up),
  // we sort by createdAt DESC and query messages where createdAt < cursor
  const replies = await prisma.message.findMany({
    where: {
      threadParentId: id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
      messageReactions: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      replyTo: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          threadReplies: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let hasMore = false;
  if (replies.length === limit) {
    const oldestReply = replies[replies.length - 1];
    const count = await prisma.message.count({
      where: {
        threadParentId: id,
        createdAt: { lt: oldestReply.createdAt },
      },
    });
    hasMore = count > 0;
  }

  const nextCursor = hasMore
    ? replies[replies.length - 1].createdAt.toISOString()
    : null;

  // We return them to the client reversed (i.e. oldest first, sorted ASC by createdAt)
  const ordered = [...replies].reverse();

  return Response.json({ replies: ordered, nextCursor });
}
