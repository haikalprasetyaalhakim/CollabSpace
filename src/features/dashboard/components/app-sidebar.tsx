import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import SidebarMainNav from "./sidebar/sidebar-main-nav";
import SidebarWorkspaceHeader from "./sidebar/sidebar-workspace-header";
import SidebarChannels from "./sidebar/sidebar-channels";
import SidebarDirectMessages from "./sidebar/sidebar-direct-messages";
import SidebarFooterSection from "./sidebar/sidebar-footer-section";
import { ConversationWithUser } from "@/features/dm/queries/get-user-conversations";

type Channel = { id: string; name: string };

type Props = {
  activeWorkspace: { id: string; name: string; inviteCode: string } | null;
  channels: Channel[];
  conversations: ConversationWithUser[];
};

export default function AppSidebar({
  activeWorkspace,
  channels,
  conversations,
}: Props) {
  return (
    <Sidebar
      collapsible="icon"
      className="md:left-[72px]! border-l border-zinc-200/50 dark:border-zinc-800/50"
    >
      <SidebarWorkspaceHeader activeWorkspace={activeWorkspace} />

      <SidebarContent>
        <SidebarMainNav />
        <SidebarSeparator />
        <SidebarChannels channels={channels} />
        <SidebarSeparator />
        <SidebarDirectMessages conversations={conversations} />
      </SidebarContent>

      <SidebarFooterSection />
      <SidebarRail />
    </Sidebar>
  );
}
