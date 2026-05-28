"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteWorkspace(
  workspaceId: string,
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Unauthorized" };

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) return { success: false, error: "Workspace not found" };
    if (workspace.ownerId !== session.user.id)
      return {
        success: false,
        error: "Only the owner can delete the workspace.",
      };

    if (workspace.imageKey) {
      try {
        await utapi.deleteFiles(workspace.imageKey);
      } catch (error) {
        console.error("Failed to delete workspace icon during deletion", error);
      }
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[deleteWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
