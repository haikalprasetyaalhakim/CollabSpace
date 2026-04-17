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
  channels: Channel[];
  conversations: ConversationWithUser[];
};

export default function AppSidebar({ channels, conversations }: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarWorkspaceHeader />

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
