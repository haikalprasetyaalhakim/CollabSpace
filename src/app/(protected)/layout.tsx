import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getChannelUnreadCounts } from "@/features/channels/queries/get-channel-unread-counts";
import { getUserChannels } from "@/features/channels/queries/get-user-channels";
import AppSidebar from "@/features/dashboard/components/app-sidebar";
import { getConversationUnreadCounts } from "@/features/dm/queries/get-conversation-unread-counts";
import { getUserConversations } from "@/features/dm/queries/get-user-conversations";
import { PresenceProvider } from "@/hooks/use-presence";
import { UnreadProvider } from "@/hooks/use-unread";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [channels, conversations, channelUnread, conversationUnread] =
    await Promise.all([
      getUserChannels(),
      getUserConversations(),
      getChannelUnreadCounts(),
      getConversationUnreadCounts(),
    ]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <PresenceProvider>
          <UnreadProvider
            initialChannelUnread={channelUnread}
            initialConversationUnread={conversationUnread}
          >
            <AppSidebar channels={channels} conversations={conversations} />
            {children}
          </UnreadProvider>
        </PresenceProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
