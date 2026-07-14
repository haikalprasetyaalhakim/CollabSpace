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
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <WorkspaceOnboardingForm
          hasWorkspace={!!memberWorkspace}
          defaultWorkspaceId={memberWorkspace?.workspaceId}
        />
      </div>
    </div>
  );
}
