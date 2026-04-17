"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function updateUserAvatar(
  imageUrl: string,
  imageKey: string,
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Not authenticated." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { imageKey: true },
    });

    if (user?.imageKey) {
      await utapi.deleteFiles(user.imageKey);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl, imageKey },
    });

    return { success: true };
  } catch (error) {
    console.error("[updateUserAvatar]", error);

    return { success: false, error: "Failed to update avatar." };
  }
}
