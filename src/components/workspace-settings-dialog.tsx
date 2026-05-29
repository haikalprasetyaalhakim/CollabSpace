"use client";

import AvatarUpload from "@/features/settings/components/avatar-upload";
import { updateWorkspace } from "@/features/workspaces/actions/update-workspace";
import { getInitials } from "@/lib/utils";
import { AlertTriangle, LogOut, Search, Trash2, UserMinus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { deleteWorkspace } from "@/features/workspaces/actions/delete-workspace";
import { useRouter } from "next/navigation";
import { leaveWorkspace } from "@/features/workspaces/actions/leave-workspace";
import {
  getWorkspaceMembers,
  WorkspaceMemberDetail,
} from "@/features/workspaces/queries/get-workspace-members";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { authClient } from "@/lib/auth-client";
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
import { removeWorkspaceMember } from "@/features/workspaces/actions/remove-workspace-member";

interface WorksapceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  workspaceImage: string | null;
  workspaceImageKey: string | null;
}

export function WorksapceSettingsDialog({
  open,
  onOpenChange,
  workspaceName,
  workspaceImage,
  workspaceId,
  workspaceImageKey,
}: WorksapceSettingsDialogProps) {
  const [name, setName] = useState(workspaceName);
  const [imageUrl, setImageUrl] = useState(workspaceImage);
  const [imageKey, setImageKey] = useState(workspaceImageKey);
  const [isDeleting, setIsDeleting] = useState(false);
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
        const res = await getWorkspaceMembers(workspaceId);
        if (!res.success) {
          toast.error(res.error || "Failed to load members");
        } else if (res.success && res.data) {
          setMembers(res.data);
        }
        setLoadingMembers(false);
      })();
    }
  }, [open, workspaceId]);

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
      const res = await updateWorkspace(workspaceId, {
        name,
        imageUrl: imageUrl ?? undefined,
        imageKey: imageKey ?? undefined,
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
      const res = await removeWorkspaceMember(workspaceId, targetUserId);
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
        <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col overflow-hidden">
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
            <TabsList className="grid grid-cols-3 w-full shrink-0">
              <TabsTrigger value="general">Overview</TabsTrigger>
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
                "{workspaceName}"
              </span>{" "}
              below:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={workspaceName}
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
              disabled={deleteConfirm !== workspaceName || isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await deleteWorkspace(workspaceId);
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
