"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function createChannel(
  data: {
    name: string;
    description?: string;
    type?: "TEXT" | "VOICE";
  },
  workspaceId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated" };

    const isVoice = data.type === "VOICE";
    const name = isVoice
      ? data.name.trim()
      : data.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return { success: false, error: "Channel name is required" };
    if (name.length > 80) return { success: false, error: "Name too long." };

    const existing = await prisma.channel.findFirst({
      where: { name, workspaceId },
    });
    if (existing) return { success: false, error: `#${name} already exists.` };

    const channel = await prisma.$transaction(async (tx) => {
      const newChannel = await tx.channel.create({
        data: {
          name,
          description: data.description?.trim() || null,
          type: data.type ?? "TEXT",
          ownerId: session.user.id,
          workspaceId,
        },
      });

      await tx.channelMember.create({
        data: {
          userId: session.user.id,
          channelId: newChannel.id,
        },
      });

      return newChannel;
    });

    revalidatePath("/", "layout");

    return { success: true, data: { id: channel.id } };
  } catch (error) {
    console.error("[createChannel]", error);
    return { success: false, error: "Something went wrong" };
  }
}
