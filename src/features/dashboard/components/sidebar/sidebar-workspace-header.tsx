"use client";

import {
  SidebarHeader,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export default function SidebarWorkspaceHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 py-0.5">
          {isCollapsed ? (
            <div className="flex justify-center w-full">
              <div className="size-7 rounded-md bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center shrink-0">
                <span className="text-white dark:text-zinc-900 font-bold text-xs">
                  C
                </span>
              </div>
            </div>
          ) : (
            <>
              <SidebarMenuButton size="lg" asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="size-7 rounded-md bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center shrink-0">
                    <span className="text-white dark:text-zinc-900 font-bold text-xs">
                      C
                    </span>
                  </div>
                  <span className="font-semibold text-sm truncate">
                    CollabSpace
                  </span>
                </div>
              </SidebarMenuButton>
              <SidebarTrigger className="shrink-0" />
            </>
          )}
        </div>
      </SidebarHeader>

      {!isCollapsed && <SidebarSeparator />}
    </>
  );
}
