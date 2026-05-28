"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function leaveWorkspace(
  workspaceId: string,
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

    if (workspace.ownerId === session.user.id) {
      return {
        success: false,
        error: "Owners cannot leave the workspace. Delete it instead.",
      };
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    await prisma.channelMember.deleteMany({
      where: {
        userId: session.user.id,
        channel: {
          workspaceId,
        },
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[leaveWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
