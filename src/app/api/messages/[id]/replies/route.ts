import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const replies = await prisma.message.findMany({
    where: {
      threadParentId: id,
    },
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
      createdAt: "asc",
    },
  });

  return Response.json(replies);
}
