import GlobalSearch from "@/components/global-search";
import Image from "next/image";
import PushNotificationManager from "@/components/push-notification-manager";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CallProvider } from "@/features/calls/context/call-context";
import { getChannelUnreadCounts } from "@/features/channels/queries/get-channel-unread-counts";
import { getUnreadMentions } from "@/features/channels/queries/get-unread-mentions";
import { getUserChannels } from "@/features/channels/queries/get-user-channels";
import AppSidebar from "@/features/dashboard/components/app-sidebar";
import { getConversationUnreadCounts } from "@/features/dm/queries/get-conversation-unread-counts";
import { getUserConversations } from "@/features/dm/queries/get-user-conversations";
import { PresenceProvider } from "@/hooks/use-presence";
import { SearchProvider } from "@/hooks/use-search";
import { UnreadProvider } from "@/hooks/use-unread";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cn, getInitials } from "@/lib/utils";
import { Compass, Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) redirect("/dashboard");

  const activeWorkspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      ownerId: true,
      image: true,
      imageKey: true,
      banner: true,
      bannerKey: true,
      description: true,
      isPrivate: true,
      traits: true,
    },
  });

  if (!activeWorkspace) redirect("/dashboard");

  const userWorkspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const [
    channels,
    conversations,
    channelUnread,
    conversationUnread,
    initialMentions,
  ] = await Promise.all([
    getUserChannels(workspaceId),
    getUserConversations(workspaceId),
    getChannelUnreadCounts(workspaceId),
    getConversationUnreadCounts(workspaceId),
    getUnreadMentions(workspaceId),
  ]);

  return (
    <SidebarProvider>
      <PresenceProvider>
        <CallProvider>
          <UnreadProvider
            initialChannelUnread={channelUnread}
            initialConversationUnread={conversationUnread}
            initialMentions={initialMentions}
            initialConversationIds={conversations.map((c) => c.id)}
          >
            <SearchProvider>
              <div className="flex h-screen w-screen overflow-hidden">
                <aside className="w-[72px] h-full bg-zinc-950 flex flex-col items-center py-4 gap-3 shrink-0 border-r border-zinc-900">
                  <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar">
                    {userWorkspaces.map((w) => {
                      const isActive = w.id === workspaceId;

                      return (
                        <Link
                          key={w.id}
                          href={`/workspaces/${w.id}`}
                          className={cn(
                            `flex items-center justify-center relative size-12 rounded-[20px] hover:rounded-[12px] transition-all overflow-hidden font-semibold text-sm`,
                            isActive
                              ? "rounded-[12px] bg-white text-zinc-950"
                              : "bg-zinc-900 text-zinc-400 hover:bg-white hover:text-zinc-950",
                          )}
                        >
                          {w.image ? (
                            <Image
                              src={w.image}
                              alt={w.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            getInitials(w.name)
                          )}
                        </Link>
                      );
                    })}

                    <Link
                      href="/workspaces/onboarding"
                      className="flex items-center justify-center size-12 rounded-[20px] hover:rounded-[12px] bg-zinc-900 text-zinc-400 hover:bg-emerald-600 hover:text-white transition-all mt-1"
                      title="Add or Join Workspace"
                    >
                      <Plus className="size-5" />
                    </Link>

                    <Link
                      href="/workspaces/discover"
                      className="flex items-center justify-center size-12 rounded-[20px] hover:rounded-[12px] bg-zinc-900 text-zinc-400 hover:bg-indigo-600 hover:text-white transition-all mt-1"
                      title="Discover Public Workspaces"
                    >
                      <Compass className="size-5" />
                    </Link>
                  </div>
                </aside>

                <div className="flex flex-1 overflow-hidden">
                  <AppSidebar
                    activeWorkspace={activeWorkspace}
                    channels={channels}
                    conversations={conversations}
                  />
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-zinc-950">
                    {children}
                  </div>
                </div>
              </div>
              <GlobalSearch />
              <PushNotificationManager />
            </SearchProvider>
          </UnreadProvider>
        </CallProvider>
      </PresenceProvider>
    </SidebarProvider>
  );
}
