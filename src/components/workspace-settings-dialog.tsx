"use client";

import { BANNER_COLORS } from "@/constants";
import AvatarUpload from "@/features/settings/components/avatar-upload";
import { deleteWorkspace } from "@/features/workspaces/actions/delete-workspace";
import { leaveWorkspace } from "@/features/workspaces/actions/leave-workspace";
import { removeWorkspaceMember } from "@/features/workspaces/actions/remove-workspace-member";
import { updateWorkspace } from "@/features/workspaces/actions/update-workspace";
import {
  getWorkspaceMembers,
  WorkspaceMemberDetail,
} from "@/features/workspaces/queries/get-workspace-members";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import { AlertTriangle, LogOut, Search, Trash2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface WorksapceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: {
    id: string;
    name: string;
    image: string | null;
    imageKey: string | null;
    banner: string | null;
    bannerKey: string | null;
    description: string | null;
    isPrivate: boolean;
    traits: string[];
  };
}

export function WorksapceSettingsDialog({
  open,
  onOpenChange,
  workspace,
}: WorksapceSettingsDialogProps) {
  const [name, setName] = useState(workspace.name);
  const [imageUrl, setImageUrl] = useState(workspace.image);
  const [imageKey, setImageKey] = useState(workspace.imageKey);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(workspace.banner);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [isPrivate, setIsPrivate] = useState(workspace.isPrivate);
  const [traits, setTraits] = useState<string[]>(workspace.traits);
  const [newTrait, setNewTrait] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMemberDetail[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerMember = members.find((m) => m.role === "owner");
  const isCurrentUserOwner = ownerMember?.userId === session?.user.id;

  useEffect(() => {
    if (open) {
      (async () => {
        setLoadingMembers(true);
        const res = await getWorkspaceMembers(workspace.id);
        if (!res.success) {
          toast.error(res.error || "Failed to load members");
        } else if (res.success && res.data) {
          setMembers(res.data);
        }
        setLoadingMembers(false);
      })();
    }
  }, [open, workspace.id]);

  const filteredMembers = members.filter((member) => {
    return (
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSave = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const res = await updateWorkspace(workspace.id, {
        name,
        imageUrl: imageUrl ?? undefined,
        imageKey: imageKey ?? undefined,
        banner: bannerUrl,
        description,
        isPrivate,
        traits,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success("Workspace updated successfully!");
      onOpenChange(false);
    });
  };

  const handleAvatarUpload = (url: string, key: string) => {
    setImageUrl(url);
    setImageKey(key);
  };

  const handleRemoveMember = (targetUserId: string, targetuserName: string) => {
    startTransition(async () => {
      const res = await removeWorkspaceMember(workspace.id, targetUserId);
      if (!res.success) {
        toast.error(res.error || "Failed to remove member");
        return;
      }

      toast.success(`${targetuserName} has been removed`);
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      setMemberToRemove(null);
    });
  };

  return (
    <>
      <Dialog open={open && !isDeleting} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[780px] h-[560px] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>
              Manage your workspace icon, name, and members.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="general"
            className="flex-1 flex flex-col min-h-0 mt-2"
          >
            <TabsList className="grid grid-cols-4 w-full shrink-0">
              <TabsTrigger value="general">Overview</TabsTrigger>
              <TabsTrigger value="profile">Server Profile</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent
              value="general"
              className="flex-1 overflow-y-auto pt-4 pb-2 space-y-4"
            >
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <Label className="text-xs text-zinc-500 font-semibold self-start font-sans">
                    Workspace Icon
                  </Label>
                  <AvatarUpload
                    currentImage={imageUrl}
                    fallback={getInitials(name)}
                    onUploadComplete={handleAvatarUpload}
                    onUploadingChange={setIsUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Workspace Name</Label>
                  <Input
                    id="ws-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending || isUploading}
                    required
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isPending || !name.trim() || isUploading}
                  >
                    {isPending
                      ? "Saving..."
                      : isUploading
                        ? "Uploading Icon..."
                        : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent
              value="profile"
              className="flex-1 overflow-y-auto pt-4 pb-2 min-h-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full items-start">
                <form onSubmit={handleSave} className="md:col-span-3 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Banner Background
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {BANNER_COLORS.map((grad, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer active:scale-95 transition-all shadow-inner"
                          style={{ background: grad }}
                          onClick={() => setBannerUrl(grad)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ws-desc"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      About / Description
                    </Label>
                    <textarea
                      id="ws-desc"
                      rows={2}
                      maxLength={120}
                      placeholder="Tell people what this workspace is about..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full text-sm p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent resize-none outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                    />
                    <div className="text-[10px] text-zinc-400 text-right">
                      {description.length}/120 characters
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Server Traits (Max 5)
                    </Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {traits.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() =>
                              setTraits((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="hover:text-red-500 font-bold text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {traits.length < 5 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Coding 💻 (Press Enter)"
                          value={newTrait}
                          onChange={(e) => setNewTrait(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = newTrait.trim();
                              if (trimmed && !traits.includes(trimmed)) {
                                setTraits((prev) => [...prev, trimmed]);
                                setNewTrait("");
                              }
                            }
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-xs">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Private Workspace
                        </Label>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          Only users with an invite code can join this
                          workspace.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="size-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isPending || !name.trim() || isUploading}
                    >
                      {isPending
                        ? "Saving..."
                        : isUploading
                          ? "Uploading Icon..."
                          : "Save Changes"}
                    </Button>
                  </div>
                </form>

                <div className="md:col-span-2 flex justify-center py-2">
                  <div className="w-[240px] h-[330px] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 text-white flex flex-col shadow-xl select-none">
                    <div
                      className="h-20 w-full shrink-0 relative"
                      style={{
                        background: bannerUrl?.startsWith("linear-gradient")
                          ? bannerUrl
                          : `linear-gradient(135deg, #18181b 0%, #09090b 100%)`,
                      }}
                    >
                      <div className="absolute -bottom-6 left-4 size-14 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-900 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="preview icon"
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-lg text-white">
                            {getInitials(name).slice(0, 2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-4 pt-8 flex flex-col min-h-0 text-left">
                      <h4 className="font-bold text-sm text-zinc-100 truncate">
                        {name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5 font-medium shrink-0">
                        <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                        1 Online <span className="text-zinc-600">•</span> 1
                        Member
                      </p>
                      <div className="w-full h-px bg-zinc-800 my-2.5 shrink-0" />
                      <div className="flex-1 min-h-0 flex flex-col justify-between">
                        <p className="text-[10px] text-zinc-300 italic leading-relaxed line-clamp-3">
                          {description ?? "No description provided yet."}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3 overflow-hidden max-h-[48px]">
                          {traits.length === 0 ? (
                            <span className="text-[9px] text-zinc-500 italic">
                              No traits added
                            </span>
                          ) : (
                            traits.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[8px] bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded-md text-zinc-300 truncate max-w-[80px]"
                              >
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="members"
              className="flex-1 flex flex-col min-h-0 pt-4"
            >
              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto border boder-zinc-200 dark:border-zinc-800 rounded-md p-1 divide-y divide-zinc-100 dark:divide-zinc-900">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
                    Loading members...
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8">
                          <AvatarImage src={member.user.image ?? ""} />
                          <AvatarFallback className="text-xs font-semibold">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight min-w-0">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                            {member.user.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate">
                            {member.user.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.role === "owner" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                            Owner
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                              Member
                            </span>
                            {isCurrentUserOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Remove member"
                                onClick={() =>
                                  setMemberToRemove({
                                    id: member.userId,
                                    name: member.user.name,
                                  })
                                }
                              >
                                <UserMinus className="size-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {!loadingMembers && filteredMembers.length === 0 && (
                  <div className="text-center py-8 text-sm text-zinc-400">
                    No members found.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="danger" className="flex-1 pt-6 space-y-4">
              <div className="rounded-lg border border-red-200/50 dark:border-red-950/30 bg-red-50/20 dark:bg-red-950/5 p-4 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Delete Workspace
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Once deleted, all data will be permanently removed. This
                    cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleting(true)}
                  disabled={isPending || isUploading}
                  className="w-fit gap-1.5 self-start"
                >
                  <Trash2 className="size-4" />
                  Delete Workspace
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-[400px] border-red-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="size-5" />
              Delete Workspace
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              This action is permanent. All channels and messages will be lost.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-xs text-zinc-400">
              To confirm, type{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                "{workspace.name}"
              </span>{" "}
              below:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={workspace.name}
              className="border-red-500/30 focus-visible:ring-red-500"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleting(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirm !== workspace.name || isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await deleteWorkspace(workspace.id);
                  if (!res.success) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Workspace deleted successfully.");
                  setIsDeleting(false);
                  onOpenChange(false);
                  setDeleteConfirm("");
                  router.push("/dashboard");
                });
              }}
            >
              {isPending ? "Deleting..." : "Delete Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Workspace Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {memberToRemove?.name}
              </span>{" "}
              from this workspace? They will lose access to all channels and
              conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (memberToRemove) {
                  handleRemoveMember(memberToRemove.id, memberToRemove.name);
                }
              }}
            >
              {isPending ? "Removing" : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface LeaveWorkspaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}

export function LeaveWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: LeaveWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLeave = () => {
    startTransition(async () => {
      const res = await leaveWorkspace(workspaceId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Left ${workspaceName} successfully.`);
      onOpenChange(false);
      router.push("/dashboard");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <LogOut className="size-5" />
            Leave Workspace
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to leave{" "}
            <span className="font-semibold">{workspaceName}</span>? You will
            lose access to this workspace.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLeave}
            disabled={isPending}
          >
            {isPending ? "Leaving..." : "Leave Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
