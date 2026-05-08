import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";

export async function getUnreadMentions() {
  const session = await serverCompReqAuth();

  return prisma.mention.findMany({
    where: { userId: session.user.id, read: false },
    select: { channelId: true, messageId: true },
  });
}
