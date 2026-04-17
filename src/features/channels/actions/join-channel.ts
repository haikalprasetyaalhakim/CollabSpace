"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function joinChannel(
  channelId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated." };

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) return { success: false, error: "Channel not found" };

    const existing = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        },
      },
    });

    if (existing) return { success: true };

    await prisma.channelMember.create({
      data: {
        userId: session.user.id,
        channelId,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[joinChannel]", error);
    return { success: false, error: "Something went wrong." };
  }
}
