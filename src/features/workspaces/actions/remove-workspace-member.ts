"use server";

import { auth } from "@/lib/auth";
import { sendTargetEvent } from "@/lib/presence";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function removeWorkspaceMember(
  workspaceId: string,
  targetUserId: string,
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Unauthorized" };

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });
    if (!workspace) return { success: false, error: "Workspace not found" };

    if (workspace.ownerId !== session.user.id) {
      return { success: false, error: "Only the owner can remove members." };
    }

    if (targetUserId === session.user.id) {
      return {
        success: false,
        error: "You cannot remove yourself from the workspace.",
      };
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    await prisma.channelMember.deleteMany({
      where: {
        userId: targetUserId,
        channel: {
          workspaceId,
        },
      },
    });

    sendTargetEvent(targetUserId, { type: "kick", workspaceId });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[removeWorkspaceMember]", error);
    return { success: false, error: "Something went wrong" };
  }
}
