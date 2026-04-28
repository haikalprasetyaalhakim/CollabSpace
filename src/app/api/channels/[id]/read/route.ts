import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: channelId } = await params;

  await prisma.channelRead.upsert({
    where: {
      userId_channelId: {
        userId: session.user.id,
        channelId,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      userId: session.user.id,
      channelId,
      lastReadAt: new Date(),
    },
  });

  return new Response(null, { status: 204 });
}
