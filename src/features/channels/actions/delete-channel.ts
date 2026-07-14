"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { broadcastToChannel } from "@/lib/sse";

export async function deleteChannel(channelId: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated" };

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) return { success: false, error: "Channel not found" };

    if (channel.ownerId && channel.ownerId !== session.user.id)
      return {
        success: false,
        error: "Only the channel owner can delete this channel.",
      };

    broadcastToChannel(channelId, { type: "channel-deleted" });

    await prisma.channel.delete({
      where: { id: channelId },
    });

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[deleteChannel]", error);
    return { success: false, error: "Something went wrong" };
  }
}
