"use client";

import { ImageGrid } from "@/components/image-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MAX_IMAGE_PER_MESSAGE } from "@/constants";
import { useUploadThing } from "@/hooks/use-avatar-upload";
import { useChannelSSE } from "@/hooks/use-channel-sse";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import { PendingImage } from "@/types/message";
import { Hash, ImageIcon, Pencil, Send, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageWithUser } from "../queries/get-channel-messages";

type Props = {
  channelId: string;
  channelName: string;
  initialMessages: MessageWithUser[];
};

function MessageItem({
  message,
  currentUserId,
  onEdit,
  onDelete,
}: {
  message: MessageWithUser;
  currentUserId: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group dark:hover:bg-zinc-800/50 hover:bg-zinc-50">
      <Avatar className="size-8">
        <AvatarImage src={message.user.image ?? ""} />
        <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          {getInitials(message.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {message.user.name}
          </span>
          <span className="text-xs text-zinc-400" suppressHydrationWarning>
            {time}
          </span>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              ref={editRef}
              defaultValue={message.content ?? ""}
              rows={1}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsEditing(false);
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const content = editRef.current?.value.trim();
                  if (content) {
                    onEdit(message.id, content);
                    setIsEditing(false);
                  }
                }
              }}
              className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2 resize-none outline-none w-full focus:ring-2 focus:ring-zinc-400/50 dark:focus:ring-zinc-500/50 transition-shadow"
              style={{ fieldSizing: "content" }}
            />
            <div className="flex items-center gap-2">
              <button
                className="text-xs font-medium px-3 py-1 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                onClick={() => {
                  const content = editRef.current?.value.trim();
                  if (content) {
                    onEdit(message.id, content);
                    setIsEditing(false);
                  }
                }}
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-medium px-3 py-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
            <span className="text-[11px] text-zinc-400">
              Press Enter to save · Esc to cancel
            </span>
          </div>
        ) : (
          message.content && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 break-all leading-relaxed">
              {message.content}
            </p>
          )
        )}

        {message.images.length > 0 && <ImageGrid images={message.images} />}
      </div>

      {message.userId === currentUserId && !isEditing && (
        <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-all flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-md">
          {message.content && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete message?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The message will be permanently
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(message.id)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function EmptyState({ channelName }: { channelName: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 h-full">
      <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Hash className="size-5 text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to #{channelName}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          No messages yet. Be the first to say something!
        </p>
      </div>
    </div>
  );
}

export function ChannelView({
  channelId,
  channelName,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const { data: session } = authClient.useSession();

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const revokeAllRef = useRef<() => void>(() => {});

  useEffect(() => {
    revokeAllRef.current = () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.localUrl));
      deleteUploadedFiles(pendingImages);
    };
  }, [pendingImages]);

  const { startUpload } = useUploadThing("messageImageUploader", {
    onUploadBegin: () => setIsUploadingImages(true),
    onClientUploadComplete: (res) => {
      setPendingImages((prev) =>
        prev.map((item) => {
          if (item.remoteUrl) return item;
          const match = res.find((r) => r.name === item.name);
          if (match)
            return { ...item, remoteUrl: match.ufsUrl, key: match.key };
          return item;
        }),
      );
      setIsUploadingImages(false);
    },
    onUploadError: (err) => {
      setIsUploadingImages(false);
      toast.error(`Image upload failed: ${err.message}`);
    },
  });

  const deleteUploadedFiles = async (images: PendingImage[]) => {
    const keys = images
      .filter((img) => img.key !== null)
      .map((img) => img.key!);

    if (keys.length === 0) return;

    await fetch("/api/uploadthing/delete-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    }).catch((err) => {
      console.error("[deleteUploadedFiles] Failed:", err);
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = useCallback(
    (message: MessageWithUser, clientId?: string) => {
      setMessages((prev) => {
        if (clientId && prev.some((m) => m.id === clientId)) {
          return prev.map((m) => (m.id === clientId ? message : m));
        }

        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [],
  );

  const handleMessageUpdated = useCallback((message: MessageWithUser) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  useChannelSSE<MessageWithUser>(
    channelId,
    handleNewMessage,
    undefined,
    handleMessageUpdated,
    handleMessageDeleted,
  );

  useEffect(() => {
    return () => revokeAllRef.current();
  }, []);

  const handleSend = async () => {
    const allUploaded = pendingImages.every((img) => img.remoteUrl !== null);
    if (
      (!input.trim() && pendingImages.length === 0) ||
      !allUploaded ||
      isSending
    )
      return;

    setIsSending(true);

    const tempId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: input.trim(),
        images: pendingImages.map((img) => img.remoteUrl ?? img.localUrl),
        channelId,
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
        },
        createdAt: new Date(),
        userId: session?.user.id!,
      },
    ]);
    setInput("");
    setPendingImages([]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          content: input.trim() || undefined,
          images:
            pendingImages.length > 0
              ? pendingImages.map((img) => img.remoteUrl!)
              : undefined,
          clientId: tempId,
        }),
      });

      if (!response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const error = await response.json();
        toast.error(error.error ?? "Failed to send message");
      } else {
        pendingImages.forEach((img) => URL.revokeObjectURL(img.localUrl));
        setPendingImages([]);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Network error.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (pendingImages.length + files.length > MAX_IMAGE_PER_MESSAGE) {
      toast.error("Maximum 4 images per message");
      return;
    }

    const newPending: PendingImage[] = files.map((file) => ({
      localUrl: URL.createObjectURL(file),
      remoteUrl: null,
      name: file.name,
      key: null,
    }));

    setPendingImages((prev) => [...prev, ...newPending]);
    startUpload(files);
    e.target.value = "";
  };

  const handleEditMessage = useCallback(async (id: string, content: string) => {
    let previousContent: string | null | undefined;

    setMessages((prev) => {
      previousContent = prev.find((m) => m.id === id)?.content;
      return prev.map((m) => (m.id === id ? { ...m, content } : m));
    });

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: previousContent! } : m,
          ),
        );

        toast.error("Failed to edit message");
      }
    } catch (error) {
      toast.error("Network error");
    }
  }, []);

  const handleDeleteMessage = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) toast.error("Failed to delete message");
    } catch (error) {
      toast.error("Network error");
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100svh-49px)]">
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <EmptyState channelName={channelName} />
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                currentUserId={session?.user.id!}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 pb-2">
          {pendingImages.map((img, i) => (
            <div key={img.localUrl} className="relative group">
              <img
                src={img.localUrl}
                alt=""
                className={`size-16 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 transition-opacity ${img.remoteUrl ? "opacity-100" : "opacity-60"}`}
              />
              {!img.remoteUrl && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {img.remoteUrl && (
                <button
                  onClick={() => {
                    URL.revokeObjectURL(img.localUrl);
                    if (img.key) {
                      deleteUploadedFiles([img]);
                    }
                    setPendingImages((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    );
                  }}
                  className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-end gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-400/10 transition-all">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 transition-colors"
            onClick={() => imageInputRef.current?.click()}
            disabled={
              pendingImages.length >= MAX_IMAGE_PER_MESSAGE || isUploadingImages
            }
          >
            <ImageIcon className="size-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelName}`}
            disabled={isSending}
            className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-none min-h-[24px] max-h-[120px]"
            style={{ fieldSizing: "content" }}
          />
          <button
            onClick={handleSend}
            disabled={
              (!input.trim() && pendingImages.length === 0) ||
              !pendingImages.every((img) => img.remoteUrl !== null) ||
              isUploadingImages
            }
            className="size-7 rounded-md flex items-center justify-center bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
