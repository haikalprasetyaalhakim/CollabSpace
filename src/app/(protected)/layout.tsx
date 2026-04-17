import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUserChannels } from "@/features/channels/queries/get-user-channels";
import AppSidebar from "@/features/dashboard/components/app-sidebar";
import { getUserConversations } from "@/features/dm/queries/get-user-conversations";
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
  const [channels, conversations] = await Promise.all([
    getUserChannels(),
    getUserConversations(),
  ]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar channels={channels} conversations={conversations} />
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
