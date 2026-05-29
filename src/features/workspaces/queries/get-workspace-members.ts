"use server";

import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { ActionResult } from "@/types/action";

export type WorkspaceMemberDetail = {
  userId: string;
  role: string;
  joinedAt: Date;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<ActionResult<WorkspaceMemberDetail[]>> {
  const session = await serverCompReqAuth();

  const isMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });
  if (!isMember) return { success: false, error: "Forbidden" };

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },

    orderBy: {
      role: "asc",
    },
  });

  return { success: true, data: members };
}
