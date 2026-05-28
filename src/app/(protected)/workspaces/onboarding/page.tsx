import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import WorkspaceOnboardingForm from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const session = await serverCompReqAuth();

  const memberWorkspace = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <WorkspaceOnboardingForm
          hasWorkspace={!!memberWorkspace}
          defaultWorkspaceId={memberWorkspace?.workspaceId}
        />
      </div>
    </div>
  );
}
