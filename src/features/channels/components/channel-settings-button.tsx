"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { leaveChannel } from "../actions/leave-channel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateChannel } from "../actions/update-channel";
import { deleteChannel } from "../actions/delete-channel";

type Props = {
  channelId: string;
  channelName: string;
  channelDescription: string | null;
  isOwner: boolean;
};

export function LeaveChannelButton({
  channelId,
  channelName,
  channelDescription,
  isOwner,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [name, setName] = useState(channelName);
  const [description, setDescription] = useState(channelDescription ?? "");

  if (!isOwner) return null;

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveChannel(channelId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`You left #${channelName}`);
      router.push("/dashboard");
    });
  };

  const handleUpdate = () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateChannel(channelId, {
        name,
        description: description || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Channel updated successfully");
      setShowEditDialog(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteChannel(channelId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Channel #${channelName} has been deleted`);
      router.push("/dashboard");
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {isOwner ? (
            <>
              <DropdownMenuItem
                onClick={() => {
                  setName(channelName);
                  setDescription(channelDescription ?? "");
                  setShowEditDialog(true);
                }}
                className="gap-2 cursor-pointer"
              >
                <Pencil className="size-3.5" />
                Edit Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Delete Channel
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={handleLeave}
              disabled={isPending}
              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2"
            >
              <LogOut className="size-3.5" />
              {isPending ? "Leaving..." : "Leave Channel"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel Settings</DialogTitle>
            <DialogDescription>
              Update this channel's name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. general"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this channel is about"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the **#{channelName}** channel and
              remove all messages, pinned items, and members. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? "Deleting..." : "Delete Channel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
