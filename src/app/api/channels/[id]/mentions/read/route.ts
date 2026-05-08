import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: channelId } = await params;

  await prisma.mention.updateMany({
    where: {
      userId: session.user.id,
      channelId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return Response.json({ success: true });
}
