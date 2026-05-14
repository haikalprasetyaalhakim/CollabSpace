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
import { ALLOWED_EMOJIS, MAX_IMAGE_PER_MESSAGE } from "@/constants";
import { useUploadThing } from "@/hooks/use-avatar-upload";
import { useChannelSSE } from "@/hooks/use-channel-sse";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import { PendingImage } from "@/types/message";
import {
  Hash,
  ImageIcon,
  Pencil,
  Pin,
  Reply,
  Send,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageWithUser } from "../queries/get-channel-messages";
import { useUnread } from "@/hooks/use-unread";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDateLabel(date: Date): string {
  const now = new Date();
  const d = new Date(date);

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterDay =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterDay) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function renderContent(content: string) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-blue-500 dark:text-blue-400 font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function MessageItem({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onReaction,
  onReply,
  onPin,
  isPinned,
}: {
  message: MessageWithUser;
  currentUserId: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: MessageWithUser) => void;
  onPin: (messageId: string) => void;
  isPinned: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editRef = useRef<HTMLTextAreaElement>(null);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      id={`message-${message.id}`}
      className="relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group dark:hover:bg-zinc-800/50 hover:bg-zinc-50"
    >
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
          {isPinned && <Pin className="size-3 text-zinc-400 fill-zinc-400" />}
        </div>

        {message.replyTo && (
          <div className="flex items-center gap-1.5 border-l-2 border-zinc-300 dark:border-zinc-600 pl-2 py-0.5 mb-0.5 rounded-sm">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
              {message.replyTo.user.name}
            </span>
            <span className="text-xs text-zinc-400 truncate">
              {message.replyTo.content ?? "📷 Image"}
            </span>
          </div>
        )}

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
              {renderContent(message.content)}
            </p>
          )
        )}

        {message.images.length > 0 && <ImageGrid images={message.images} />}

        {message.messageReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.messageReactions.reduce(
                (acc, r) => {
                  if (!acc[r.emoji])
                    acc[r.emoji] = { count: 0, hasReacted: false, users: [] };
                  acc[r.emoji].count++;
                  if (r.userId === currentUserId)
                    acc[r.emoji].hasReacted = true;
                  acc[r.emoji].users.push(r.user.name);
                  return acc;
                },
                {} as Record<
                  string,
                  { count: number; hasReacted: boolean; users: string[] }
                >,
              ),
            ).map(([emoji, { count, hasReacted, users }]) => (
              <Tooltip key={emoji}>
                <TooltipTrigger asChild>
                  <button
                    key={emoji}
                    onClick={() => onReaction(message.id, emoji)}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      hasReacted
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 font-medium"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {count}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-xs max-w-[200px] text-center"
                >
                  {users.length < 3
                    ? users.join(", ")
                    : `${users.slice(0, 2).join(", ")} and ${users.length - 2} other${users.length - 2 > 1 ? "s" : ""}`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-all flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-md">
          <div className="relative">
            <button
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              onClick={() => setShowEmojiPicker((v) => !v)}
            >
              <SmilePlus className="size-3.5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-full mt-1 flex gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 shadow-xl z-10">
                {ALLOWED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:scale-125 transition-transform p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            onClick={() => onReply(message)}
          >
            <Reply className="size-3.5" />
          </button>

          <button
            className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isPinned ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            onClick={() => onPin(message.id)}
          >
            <Pin className={`size-3.5 ${isPinned ? "fill-current" : ""}`} />
          </button>

          {message.userId === currentUserId && (
            <>
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
                      This action cannot be undone. The message will be
                      permanently deleted.
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
            </>
          )}
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

type Props = {
  channelId: string;
  channelName: string;
  initialMessages: MessageWithUser[];
  initialPinnedIds: string[];
  members: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  }[];
  highlightMessageId: string | undefined;
};

export function ChannelView({
  channelId,
  channelName,
  initialMessages,
  initialPinnedIds,
  members,
  highlightMessageId,
}: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUser | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(initialPinnedIds),
  );
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<
    Array<{
      id: string;
      content: string;
      images: string[];
      createdAt: Date;
      user: { id: string; name: string; image: string | null };
    }>
  >([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const { data: session } = authClient.useSession();

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const revokeAllRef = useRef<() => void>(() => {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(!highlightMessageId);

  const { markChannelRead, clearChannelMentions } = useUnread();

  useEffect(() => {
    if (!highlightMessageId) return;
    clearChannelMentions(channelId);

    const tryScroll = () => {
      const el = document.getElementById(`message-${highlightMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("message-flash");
        setTimeout(() => el.classList.remove("message-flash"), 1800);
      }
    };

    const raf = requestAnimationFrame(() => setTimeout(tryScroll, 100));
    return () => cancelAnimationFrame(raf);
  }, [highlightMessageId, channelId, clearChannelMentions]);

  useEffect(() => {
    revokeAllRef.current = () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.localUrl));
      deleteUploadedFiles(pendingImages);
    };
  }, [pendingImages]);

  useEffect(() => {
    if (!showPinnedPanel) return;

    fetch(`/api/channels/${channelId}/pinned`)
      .then((res) => res.json())
      .then((data) => setPinnedMessages(data));
  }, [showPinnedPanel, channelId]);

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
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
  }, []);

  useEffect(() => {
    markChannelRead(channelId);
  }, [markChannelRead, channelId]);

  const handleNewMessage = useCallback(
    (message: MessageWithUser, clientId?: string) => {
      setMessages((prev) => {
        if (clientId && prev.some((m) => m.id === clientId)) {
          return prev.map((m) => (m.id === clientId ? message : m));
        }

        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      markChannelRead(channelId);
    },
    [markChannelRead, channelId],
  );

  const handleMessageUpdated = useCallback((message: MessageWithUser) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleReactionUpdated = useCallback(
    (payload: {
      messageId: string;
      reactions: Array<{
        id: string;
        emoji: string;
        userId: string;
        user: { name: string };
      }>;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, messageReactions: payload.reactions }
            : m,
        ),
      );
    },
    [],
  );

  const handlePinUpdated = useCallback(
    ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (isPinned) next.add(messageId);
        else next.delete(messageId);
        return next;
      });
    },
    [],
  );

  const handleTogglePin = useCallback(async (messageId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });

    await fetch(`/api/messages/${messageId}/pin`, { method: "POST" });
  }, []);

  useChannelSSE<MessageWithUser>(
    channelId,
    handleNewMessage,
    undefined,
    handleMessageUpdated,
    handleMessageDeleted,
    handleReactionUpdated,
    handlePinUpdated,
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
        messageReactions: [],
        replyToId: replyingTo?.id ?? null,
        replyTo: replyingTo ?? null,
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
          username: session?.user.username ?? null,
        },
        createdAt: new Date(),
        userId: session?.user.id!,
      },
    ]);
    setInput("");
    setPendingImages([]);
    setReplyingTo(null);

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
          replyToId: replyingTo?.id,
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

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.messageReactions.find(
            (r) => r.userId === session?.user.id && r.emoji === emoji,
          );
          const newReactions = existing
            ? m.messageReactions.filter((r) => r.id !== existing.id)
            : [
                ...m.messageReactions,
                {
                  id: crypto.randomUUID(),
                  emoji,
                  userId: session?.user.id!,
                  user: { name: session?.user.name! },
                },
              ];
          return { ...m, messageReactions: newReactions };
        }),
      );

      await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    },
    [session?.user.id],
  );

  const handleReply = useCallback((message: MessageWithUser) => {
    setReplyingTo(message);
  }, []);

  const handleMentionSelect = useCallback(
    (member: { id: string; name: string; username: string | null }) => {
      const cursor = textareaRef.current?.selectionStart ?? input.length;
      const textBeforeCursor = input.slice(0, cursor);
      const match = textBeforeCursor.match(/@(\w*)$/);
      if (!match) return;

      const atStart = cursor - match[0].length;
      const newText =
        input.slice(0, atStart) + `@${member.username} ` + input.slice(cursor);

      setInput(newText);
      setMentionQuery(null);

      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursor =
          atStart +
          (member.username?.length ?? 0) +
          2 +
          input.slice(cursor).length;
        textareaRef.current?.setSelectionRange(newCursor, newCursor);
      }, 0);
    },
    [input],
  );

  const filteredMembers = mentionQuery
    ? members
        .filter(
          (m) =>
            m.username &&
            m.username.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  return (
    <div className="flex h-[calc(100svh-49px)]">
      <div className="flex flex-col flex-1 min-w-0">
        {pinnedIds.size > 0 && (
          <button
            onClick={() => setShowPinnedPanel((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-xs text-zinc-500 shrink-0"
          >
            <Pin className="size-3 fill-zinc-400 text-zinc-400" />
            <span>
              {pinnedIds.size} pinned message{pinnedIds.size > 1 ? "s" : ""}
            </span>
          </button>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-4"
        >
          {messages.length === 0 ? (
            <EmptyState channelName={channelName} />
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => {
                const prev = messages[index - 1];
                const showDateSeparator =
                  !prev ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(prev.createdAt).toDateString();

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-3 px-4 py-2">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-xs text-zinc-400 font-medium shrink-0">
                          {formatDateLabel(new Date(msg.createdAt))}
                        </span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    )}
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      currentUserId={session?.user.id!}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      onReaction={handleToggleReaction}
                      onReply={handleReply}
                      onPin={handleTogglePin}
                      isPinned={pinnedIds.has(msg.id)}
                    />
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
              {showScrollBtn && (
                <button
                  onClick={() => {
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                    setShowScrollBtn(false);
                  }}
                  className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-medium shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors z-10"
                >
                  {" "}
                  ↓ Scroll to bottom
                </button>
              )}
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

        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="size-3 text-zinc-400 shrink-0" />
              <span className="text-zinc-500">Replying to</span>
              <span className="text-zinc-400 truncate">
                {replyingTo.content ?? "📷 Image"}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="shrink-0 ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 relative">
          {mentionQuery && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 mx-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-20">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMentionSelect(member)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-left"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={member.image ?? ""} />
                    <AvatarFallback className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>{" "}
                  <span className="font-medium text-blue-500 dark:text-blue-400">
                    @{member.username}{" "}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          )}
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
                pendingImages.length >= MAX_IMAGE_PER_MESSAGE ||
                isUploadingImages
              }
            >
              <ImageIcon className="size-4" />
            </button>
            <textarea
              value={input}
              ref={textareaRef}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);

                const cursor = e.target.selectionStart ?? val.length;
                const textBeforeCursor = val.slice(0, cursor);
                const match = textBeforeCursor.match(/@(\w*)$/);

                if (match) {
                  setMentionQuery(match[1]);
                } else {
                  setMentionQuery(null);
                }
              }}
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
      {showPinnedPanel && (
        <div className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Pin className="size-4 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Pinned Messages
              </span>
            </div>
            <button
              onClick={() => setShowPinnedPanel(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {pinnedMessages.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8">
                Loading...
              </p>
            ) : (
              pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700"
                >
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {msg.user.name}
                  </span>
                  {msg.content && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 break-all">
                      {msg.content}
                    </p>
                  )}
                  {msg.images.length > 0 && (
                    <span className="text-xs text-zinc-400">
                      📷 {msg.images.length} image(s)
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
