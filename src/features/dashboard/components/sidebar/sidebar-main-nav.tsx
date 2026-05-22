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
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Threads",
    href: "/threads",
    icon: MessageSquare,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: Video,
  },
];

export default function SidebarMainNav() {
  const pathname = usePathname();
  const { setOpen } = useSearch();

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
