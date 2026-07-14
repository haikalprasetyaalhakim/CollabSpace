import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { notFound } from "next/navigation";
import MeetingsClientView from "@/features/meetings/components/meetings-client-view";

type Props = {
  params: Promise<{ workspaceId: string }>;
};

export default async function MeetingsPage({ params }: Props) {
  const session = await serverCompReqAuth();
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  if (!workspace) notFound();

  const voiceChannels = await prisma.channel.findMany({
    where: { workspaceId, type: "VOICE" },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <MeetingsClientView
      voiceChannels={voiceChannels}
      workspaceId={workspaceId}
      currentUserId={session.user.id}
    />
  );
}
