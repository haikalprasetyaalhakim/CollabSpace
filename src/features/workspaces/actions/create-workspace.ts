"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { headers } from "next/headers";

export async function createWorkspace(
  name: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const workspace = await prisma.workspace.create({
      data: {
        name,
        inviteCode,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
        channels: {
          create: {
            name: "general",
            ownerId: session.user.id,
          },
        },
      },
    });

    const generalChannel = await prisma.channel.findFirst({
      where: { workspaceId: workspace.id, name: "general" },
    });

    if (generalChannel) {
      await prisma.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId: session.user.id,
        },
      });
    }

    return { success: true, data: { workspaceId: workspace.id } };
  } catch (error) {
    console.error("[createWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
