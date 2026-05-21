import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DmView } from "@/features/dm/components/dm-view";
import { getDmMessages } from "@/features/dm/queries/get-dm-messages";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { getInitials } from "@/lib/utils";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ highlight?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const session = await serverCompReqAuth();

  const { conversationId } = await params;
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
      },
    }),
    getDmMessages(conversationId),
  ]);

  if (!conversation) redirect("/dashboard");

  const otherUser =
    conversation.memberOneId === session.user.id
      ? conversation.memberTwo
      : conversation.memberOne;

  return (
    <SidebarInset>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
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
      </header>

      <DmView
        conversationId={conversationId}
        otherUser={otherUser}
        initialMessages={initialMessages}
        highlightMessageId={highlight}
      />
    </SidebarInset>
  );
}
