"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { headers } from "next/headers";

export async function joinWorkspace(
  inviteCode: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const workspace = await prisma.workspace.findUnique({
      where: { inviteCode: cleanCode },
      include: {
        members: true,
        channels: true,
      },
    });

    if (!workspace) {
      return { success: false, error: "Invalid invite code" };
    }

    const isMember = workspace.members.some(
      (m) => m.userId === session.user.id,
    );
    if (isMember) {
      return { success: true, data: { workspaceId: workspace.id } };
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
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

    return { success: true, data: { workspaceId: workspace.id } };
  } catch (error) {
    console.error("[joinWorkspace]", error);
    return { success: false, error: "Something went wrong" };
  }
}
