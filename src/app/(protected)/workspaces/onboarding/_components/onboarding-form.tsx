"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createWorkspace } from "@/features/workspaces/actions/create-workspace";
import { joinWorkspace } from "@/features/workspaces/actions/join-workspace";
import { PlusCircle, Sparkles, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  hasWorkspace?: boolean;
  defaultWorkspaceId?: string | undefined;
};

export default function WorkspaceOnboardingForm({
  hasWorkspace,
  defaultWorkspaceId,
}: Props) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    startTransition(async () => {
      const result = await createWorkspace(workspaceName);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/workspaces/${result.data?.workspaceId}`);
    });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    startTransition(async () => {
      const result = await joinWorkspace(inviteCode);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/workspaces/${result.data?.workspaceId}`);
    });
  };

  return (
    <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl overflow-hidden p-6 transition-all duration-300">
      {hasWorkspace && defaultWorkspaceId && (
        <button
          type="button"
          onClick={() => router.push(`/workspaces/${defaultWorkspaceId}`)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Back to workspace"
        >
          <X className="size-4" />
        </button>
      )}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center size-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 mb-3 shadow-md">
          <Sparkles className="size-5 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Welcome to CollabSpace
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Create a new workspace or join an existing one to collaborate.
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 w-full">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Create Workspace
          </TabsTrigger>
          <TabsTrigger value="join" className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Join Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Workspace Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. John Club, Team UI/UX"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={isLoading}
                required
                className="h-10 bg-transparent"
              />
              <p className="text-[11px] text-zinc-400">
                Choose a clear name. You can change this later in settings.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !workspaceName.trim()}
              className="w-full h-10 mt-2 bg-zinc-950 dark:bg-zinc-50 hover:opacity-90 transition-all font-semibold"
            >
              {isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="join">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Invite Code
              </label>
              <Input
                type="text"
                placeholder="e.g. ABCD12"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={isLoading}
                required
                maxLength={10}
                className="h-10 bg-transparent tracking-widest uppercase text-center font-mono text-base"
              />
              <p className="text-[11px] text-zinc-400 text-center">
                Ask the owner of the workspace for their invite code.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !inviteCode.trim()}
              className="w-full h-10 mt-2 bg-zinc-950 dark:bg-zinc-50 hover:opacity-90 transition-all font-semibold"
            >
              {isLoading ? "Joining..." : "Join Workspace"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
