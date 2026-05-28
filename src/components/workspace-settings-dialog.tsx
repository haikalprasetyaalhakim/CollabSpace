"use client";

import AvatarUpload from "@/features/settings/components/avatar-upload";
import { updateWorkspace } from "@/features/workspaces/actions/update-workspace";
import { getInitials } from "@/lib/utils";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  return (
    <>
      <Dialog open={open && !isDeleting} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>
              Customize your workspace details or delete it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 py-4">
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

            <DialogFooter className="flex justify-between items-center gap-2 pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleting(true)}
                className="mr-auto gap-1.5"
                disabled={isPending || isUploading}
              >
                <Trash2 className="size-4" />
                Delete Workspace
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending || isUploading}
              >
                Cancel
              </Button>
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
            </DialogFooter>
          </form>
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
