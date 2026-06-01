"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function joinPublicWorkspace(
  workspaceId: string,
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        isPrivate: false,
      },
      include: {
        channels: true,
      },
    });
    if (!workspace)
      return { success: false, error: "Public workspace not found" };

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: session.user.id,
        role: "member",
      },
    });

    const generalChannel = workspace.channels.find((c) => c.name === "general");
    if (generalChannel) {
      const isChannelMember = await prisma.channelMember.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId: generalChannel.id,
          },
        },
      });

      if (!isChannelMember) {
        await prisma.channelMember.create({
          data: {
            channelId: generalChannel.id,
            userId: session.user.id,
          },
        });
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[joinPublicWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
