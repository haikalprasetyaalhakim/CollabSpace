"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarHeader,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";
import { ChevronDown, Copy, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SidebarWorkspaceHeaderProps {
  activeWorkspace: {
    id: string;
    name: string;
    inviteCode: string;
  } | null;
}

export default function SidebarWorkspaceHeader({
  activeWorkspace,
}: SidebarWorkspaceHeaderProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const workspaceName = activeWorkspace?.name ?? "CollabSpace";
  const workspaceInitials = getInitials(workspaceName);

  const handleCopyInviteCode = () => {
    if (!activeWorkspace?.inviteCode) return;
    navigator.clipboard.writeText(activeWorkspace.inviteCode);
    toast.success(`Invite code copied: ${activeWorkspace.inviteCode}`);
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 py-0.5">
          {isCollapsed ? (
            <div className="flex justify-center w-full">
              <div className="size-7 rounded-md bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 flex items-center justify-center shrink-0">
                <span className="font-bold text-xs">
                  {workspaceInitials.slice(0, 2)}
                </span>
              </div>
            </div>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="w-full">
                    <div className="flex items-center gap-2 cursor-pointer w-full text-left min-w-0">
                      <div className="size-7 rounded-md bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 flex items-center justify-center shrink-0">
                        <span className="font-bold text-xs">
                          {workspaceInitials.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 leading-tight">
                        <span className="font-semibold text-sm truncate">
                          {workspaceName}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          Active Workspace
                        </span>
                      </div>
                      <ChevronDown className="size-3.5 text-zinc-400 shrink-0 ml-auto" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 mt-1">
                  <DropdownMenuLabel className="text-xs text-zinc-400">
                    Workspace Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleCopyInviteCode}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="size-4" />
                    Copy Invite Code:{" "}
                    <span className="font-mono font-bold text-emerald-600">
                      {activeWorkspace?.inviteCode}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/workspaces/onboarding"
                      className="flex items-center gap-2 cursor-pointer w-full"
                    >
                      <Plus className="size-4" />
                      Add new Workspace
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <SidebarTrigger className="shrink-0" />
            </>
          )}
        </div>
      </SidebarHeader>

      {!isCollapsed && <SidebarSeparator />}
    </>
  );
}
