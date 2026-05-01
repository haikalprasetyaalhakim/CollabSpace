import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: channelId } = await params;

  const pinned = await prisma.pinnedMessage.findMany({
    where: { channelId },
    include: {
      message: {
        select: {
          id: true,
          content: true,
          images: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { pinnedAt: "asc" },
  });

  return Response.json(pinned.map((p) => p.message));
}
