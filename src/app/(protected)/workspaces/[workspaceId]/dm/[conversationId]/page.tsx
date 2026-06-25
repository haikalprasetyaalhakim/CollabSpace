import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import CallButtons from "@/features/calls/components/call-buttons";
import { DmView } from "@/features/dm/components/dm-view";
import { getDmMessages } from "@/features/dm/queries/get-dm-messages";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { getInitials } from "@/lib/utils";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceId: string; conversationId: string }>;
  searchParams: Promise<{ highlight?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const session = await serverCompReqAuth();

  const { workspaceId, conversationId } = await params;
  const { highlight } = await searchParams;

  const [conversation, initialMessages] = await Promise.all([
    prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { memberOneId: session.user.id },
          { memberTwoId: session.user.id },
        ],
      },
      include: {
        memberOne: { select: { id: true, name: true, image: true } },
        memberTwo: { select: { id: true, name: true, image: true } },
        conversationReads: true,
      },
    }),
    getDmMessages(conversationId),
  ]);

  if (!conversation) redirect(`/workspaces/${workspaceId}`);

  const otherUser =
    conversation.memberOneId === session.user.id
      ? conversation.memberTwo
      : conversation.memberOne;

  const otherRead = conversation.conversationReads.find(
    (cr) => cr.userId === otherUser.id,
  );
  const initialOtherLastRead = otherRead
    ? otherRead.lastReadAt.toISOString()
    : null;

  return (
    <SidebarInset className="h-svh overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Avatar className="size-5">
          <AvatarImage src={otherUser.image ?? ""} />
          <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {getInitials(otherUser.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {otherUser.name}
        </span>

        <CallButtons
          otherUserId={otherUser.id}
          otherUserName={otherUser.name}
          conversationId={conversationId}
        />
      </header>

      <div className="flex overflow-hidden flex-1 min-w-0">
        <div className="flex-1">
          <DmView
            conversationId={conversationId}
            otherUser={otherUser}
            initialMessages={initialMessages}
            highlightMessageId={highlight}
            initialOtherLastReadAt={initialOtherLastRead}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
