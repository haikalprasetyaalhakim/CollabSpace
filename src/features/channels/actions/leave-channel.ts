"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function leaveChannel(
  channelId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated." };

    const membership = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: {
          channelId,
          userId: session.user.id,
        },
      },
    });
    if (!membership) {
      return { success: false, error: "You are not a member of this channel" };
    }

    await prisma.channelMember.delete({
      where: {
        userId_channelId: {
          channelId,
          userId: session.user.id,
        },
      },
    });

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[leaveChannel]", error);
    return { success: false, error: "Something went wrong." };
  }
}
