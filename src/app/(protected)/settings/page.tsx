import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsAppearanceTab from "@/features/settings/components/settings-apperance-tab";
import SettingsNotificationsTab from "@/features/settings/components/settings-notifications-tab";
import SettingsProfileTab from "@/features/settings/components/settings-profile-tab";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { User } from "@/types/user";
import { Bell, Paintbrush, UserRound } from "lucide-react";

export default async function SettingsPage() {
  const session = await serverCompReqAuth();

  return (
    <SidebarInset>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Settings
        </span>
      </header>

      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800/60 h-9 p-1 mb-6">
            <TabsTrigger
              value="profile"
              className="text-xs gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm"
            >
              <UserRound className="size-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm"
            >
              <Bell className="size-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="text-xs gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm"
            >
              <Paintbrush className="size-3.5" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <SettingsProfileTab userData={session.user as User} />
          </TabsContent>
          <TabsContent value="notifications">
            <SettingsNotificationsTab />
          </TabsContent>
          <TabsContent value="appearance">
            <SettingsAppearanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
