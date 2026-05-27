import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await serverCompReqAuth();

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  if (!membership) redirect("/workspaces/onboarding");

  redirect(`/workspaces/${membership.workspaceId}`);
}
