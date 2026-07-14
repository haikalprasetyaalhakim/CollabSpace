import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page/landing-page";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    if (!session.user.username) {
      redirect("/onboarding");
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    if (membership) {
      redirect(`/workspaces/${membership.workspaceId}`);
    } else {
      redirect("/workspaces/onboarding");
    }
  }

  return <LandingPage />;
}
