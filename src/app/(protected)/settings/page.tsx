import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsAppearanceTab from "@/features/settings/components/settings-apperance-tab";
import SettingsNotificationsTab from "@/features/settings/components/settings-notifications-tab";
import SettingsProfileTab from "@/features/settings/components/settings-profile-tab";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { User } from "@/types/user";
import { ArrowLeft, Bell, Paintbrush, UserRound, X } from "lucide-react";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await serverCompReqAuth();
  const { workspaceId } = await searchParams;

  const backUrl = workspaceId ? `/workspaces/${workspaceId}` : "/dashboard";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-250/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Settings
          </span>
        </div>
        <Link
          href={backUrl}
          className="flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all hover:rotate-90 duration-200"
          title="Close Settings"
        >
          <X className="size-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
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
    </div>
  );
}
