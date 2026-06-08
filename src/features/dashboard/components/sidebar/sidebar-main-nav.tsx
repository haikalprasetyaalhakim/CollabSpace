"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSearch } from "@/hooks/use-search";
import { LayoutDashboard, MessageSquare, Search, Video } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function SidebarMainNav() {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { setOpen } = useSearch();

  const navItems = [
    {
      label: "Dashboard",
      href: `/workspaces/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Threads",
      href: `/workspaces/${workspaceId}/threads`,
      icon: MessageSquare,
    },
    {
      label: "Meetings",
      href: `/workspaces/${workspaceId}/meetings`,
      icon: Video,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search (Ctrl+K)"
              onClick={() => setOpen(true)}
            >
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                isActive={pathname === item.href}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
