"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function updateChannel(
  channelId: string,
  data: {
    name: string;
    description: string | undefined;
  },
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated" };

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) return { success: false, error: "Channel not found" };

    if (channel.ownerId && channel.ownerId !== session.user.id) {
      return {
        success: false,
        error: "Only the channel owner can edit settings.",
      };
    }

    const name = data.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return { success: false, error: "Channel name is required" };
    if (name.length > 80) return { success: false, error: "Name too long" };

    const existing = await prisma.channel.findFirst({
      where: {
        name,
        NOT: { id: channelId },
      },
    });
    if (existing) return { success: false, error: `#${name} already exists.` };

    await prisma.channel.update({
      where: { id: channelId },
      data: {
        name,
        description: data.description?.trim() ?? null,
      },
    });

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[updateChannel]", error);
    return { success: false, error: "Something went wrong" };
  }
}
