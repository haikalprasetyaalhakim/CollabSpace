import prisma from "@/lib/prisma";

export async function getPinnedMessageIds(
  channelId: string,
): Promise<string[]> {
  const pinned = await prisma.pinnedMessage.findMany({
    where: { channelId },
    select: { messageId: true },
  });

  return pinned.map((p) => p.messageId);
}
