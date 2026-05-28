"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function updateWorkspace(
  workspaceId: string,
  data: {
    name?: string;
    imageUrl?: string | undefined;
    imageKey?: string | undefined;
  },
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Unauthorized" };

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, imageKey: true },
    });
    if (!workspace) return { success: false, error: "Workspace not found" };
    if (workspace.ownerId !== session.user.id)
      return { success: false, error: "Only the owner can udpate settings." };

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.imageUrl !== undefined) {
      updateData.image = data.imageUrl;
      updateData.imageKey = data.imageKey;

      if (workspace.imageKey && workspace.imageKey !== data.imageKey) {
        try {
          await utapi.deleteFiles(workspace.imageKey);
        } catch (error) {
          console.error("Failed to delete old workspace icon:", error);
        }
      }
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[updateWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
