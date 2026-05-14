"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { statusOptions } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SidebarFooterSection() {
  const { state } = useSidebar();
  const { data: session } = authClient.useSession();

  const isCollapsed = state === "collapsed";

  const user = session?.user;
  const statusValue = user?.status || "online";

  const [currentStatusValue, setCurrentStatusValue] = useState(statusValue);

  useEffect(() => {
    if (user?.status) setCurrentStatusValue(user.status);
  }, [user?.status]);

  const currentStatus = useMemo(
    () =>
      statusOptions.find((s) => s.value === currentStatusValue) ||
      statusOptions[0],
    [currentStatusValue],
  );

  const handleStatusChange = async (value: string) => {
    setCurrentStatusValue(value);

    await fetch("/api/users/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
  };

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex w-full items-center gap-2.5 p-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={user?.image || undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-zinc-800 text-[10px] font-medium text-zinc-100 dark:bg-zinc-800 dark:text-zinc-100">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white dark:border-[#09090b] ${currentStatus?.color}`}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-44">
                <DropdownMenuLabel className="text-xs text-zinc-500 font-normal">
                  Set status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={`size-2 rounded-full shrink-0 ${opt.color}`}
                    />
                    <span className="text-sm">{opt.label}</span>
                    {currentStatusValue === opt.value && (
                      <span className="ml-auto text-xs text-zinc-400">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isCollapsed && (
              <>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-normal text-zinc-900 dark:text-zinc-50">
                    {user?.name || "Loading..."}
                  </span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {currentStatus?.label}
                  </span>
                </div>

                <Link
                  href="/settings"
                  className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-50"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </SidebarMenuItem>

        {isCollapsed && (
          <SidebarMenuItem className="mt-2">
            <SidebarTrigger className="w-full" />
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarFooter>
  );
}
