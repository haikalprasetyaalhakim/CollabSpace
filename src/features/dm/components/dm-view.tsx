"use client";

import { ImageGrid } from "@/components/image-grid";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UserProfileCard from "@/components/user-profile-card";
import {
  ALLOWED_EMOJIS,
  MAX_IMAGE_PER_MESSAGE,
  PAGINATION_LIMIT,
} from "@/constants";
import { useCall } from "@/features/calls/context/call-context";
import { useUploadThing } from "@/hooks/use-avatar-upload";
import { useChannelSSE } from "@/hooks/use-channel-sse";
import { useUnread } from "@/hooks/use-unread";
import { authClient } from "@/lib/auth-client";
import {
  formatDateLabel,
  getAttachmentMeta,
  getInitials,
  getMessageFallbackText,
} from "@/lib/utils";
import { PendingImage } from "@/types/message";
import {
  FileUp,
  ImageIcon,
  Pencil,
  PhoneMissed,
  Reply,
  Send,
  SmilePlus,
  Trash2,
  X,
  Plus,
  Film,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DmMessageWithUser } from "../queries/get-dm-messages";

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

const jumpToMessage = (messageId: string) => {
  const el = document.getElementById(`message-${messageId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("message-flash");
    setTimeout(() => {
      el.classList.remove("message-flash");
    }, 1800);
  } else {
    toast.info("Message is older. Try scrolling up to load more messages.");
  }
};

type OtherUser = {
  id: string;
  name: string;
  image: string | null;
};

type Props = {
  conversationId: string;
  otherUser: OtherUser;
  initialMessages: DmMessageWithUser[];
  highlightMessageId: string | undefined;
  initialOtherLastReadAt: string | null;
};

export function DmView({
  conversationId,
  initialMessages,
  otherUser,
  highlightMessageId,
  initialOtherLastReadAt,
}: Props) {
  const { markConversationRead, clearConversationMentions } = useUnread();

  const { callState, incomingMessages } = useCall();

  const [messages, setMessages] =
    useState<DmMessageWithUser[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DmMessageWithUser | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialMessages.length === PAGINATION_LIMIT,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(
    initialMessages[0]?.id ?? null,
  );
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(
    initialOtherLastReadAt,
  );

  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const revokeAllRef = useRef<() => void>(() => {});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(!highlightMessageId);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const { data: session } = authClient.useSession();

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
      setPendingImages((prev) => prev.filter((img) => img.remoteUrl !== null));
      toast.error(`Upload failed: ${err.message}`);
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
    if (!incomingMessages.has(conversationId)) return;

    const msgs = incomingMessages.get(conversationId) ?? [];
    const lastMessage = msgs[msgs.length - 1];
    if (!lastMessage || lastMessage.type !== "MISSED_CALL") return;

    setMessages((prev) => {
      if (prev.some((m) => m.id === lastMessage.id)) return prev;
      return [...prev, lastMessage];
    });
  }, [conversationId, incomingMessages]);

  useEffect(() => {
    if (callState !== "unanswered") return;

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        type: "MISSED_CALL",
        content: null,
        conversationId,
        userId: session?.user.id!,
        createdAt: new Date(),
        directMessageReactions: [],
        replyToId: null,
        replyTo: null,
        images: [],
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
        },
      },
    ]);
  }, [callState]);

  useEffect(() => {
    revokeAllRef.current = () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.localUrl));
      deleteUploadedFiles(pendingImages);
    };
  }, [pendingImages]);

  useEffect(() => {
    return () => revokeAllRef.current();
  }, []);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [markConversationRead, conversationId]);

  useEffect(() => {
    clearConversationMentions(conversationId);
  }, [clearConversationMentions, conversationId]);

  useEffect(() => {
    if (!highlightMessageId) return;

    const tryScroll = () => {
      const el = document.getElementById(`message-${highlightMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("message-flash");
        setTimeout(() => {
          el.classList.remove("message-flash");
        }, 1000);
      }
    };

    const raf = requestAnimationFrame(() => setTimeout(tryScroll, 100));
    return () => cancelAnimationFrame(raf);
  }, [highlightMessageId]);

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

  const handleLoadMore = useCallback(async () => {
    if (!cursor || isLoadingMore) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsLoadingMore(true);
    const prevScrollHeight = container.scrollHeight;

    try {
      const res = await fetch(
        `/api/dm/conversations/${conversationId}/messages?cursor=${cursor}`,
      );
      const data = (await res.json()) as {
        messages: DmMessageWithUser[];
        hasMore: boolean;
      };

      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setCursor(data.messages[0]?.id ?? null);

      requestAnimationFrame(() => {
        container.scrollTop += container.scrollHeight - prevScrollHeight;
      });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore, conversationId]);

  const handleNewMessage = useCallback(
    (message: DmMessageWithUser, clientId?: string) => {
      if (clientId) {
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(clientId);
          return next;
        });
      }
      setMessages((prev) => {
        if (clientId && prev.some((d) => d.id === clientId)) {
          return prev.map((d) => (d.id === clientId ? message : d));
        }

        if (prev.some((d) => d.id === message.id)) return prev;
        return [...prev, message];
      });

      markConversationRead(conversationId);
    },
    [markConversationRead, conversationId],
  );

  const handleTyping = useCallback(
    (payload: { userId: string; isTyping: boolean }) => {
      if (payload.userId === otherUser.id) {
        setIsOtherTyping(payload.isTyping);
      }
    },
    [otherUser.id],
  );

  const handleMessageUpdated = useCallback((message: DmMessageWithUser) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
    );
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleEditMessage = useCallback(async (id: string, content: string) => {
    let previousContent: string | null | undefined;

    setMessages((prev) => {
      previousContent = prev.find((m) => m.id === id)?.content;
      return prev.map((m) => (m.id === id ? { ...m, content } : m));
    });

    try {
      const res = await fetch(`/api/dm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: previousContent ?? null } : m,
          ),
        );
        toast.error("Failed to edit message");
      }
    } catch {
      toast.error("Network error");
    }
  }, []);

  const handleDeleteMessage = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/dm/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Failed to delete message");
    } catch {
      toast.error("Network error");
    }
  }, []);

  const handleReply = useCallback((message: DmMessageWithUser) => {
    setReplyingTo(message);
  }, []);

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.directMessageReactions.find(
            (r) => r.userId === session?.user.id && r.emoji === emoji,
          );
          const newReactions = existing
            ? m.directMessageReactions.filter((r) => r.id !== existing.id)
            : [
                ...m.directMessageReactions,
                {
                  id: crypto.randomUUID(),
                  emoji,
                  userId: session?.user.id!,
                  user: { name: session?.user.name! },
                },
              ];

          return { ...m, directMessageReactions: newReactions };
        }),
      );
      await fetch(`/api/dm/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    },
    [session?.user.id],
  );

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
            ? { ...m, directMessageReactions: payload.reactions }
            : m,
        ),
      );
    },
    [],
  );

  const handleConversationRead = useCallback(
    (payload: { userId: string; lastReadAt: string }) => {
      if (payload.userId === otherUser.id) {
        setOtherLastReadAt(payload.lastReadAt);
      }
    },
    [otherUser.id],
  );

  useChannelSSE<DmMessageWithUser>(
    `dm-${conversationId}`,
    handleNewMessage,
    handleTyping,
    handleMessageUpdated,
    handleMessageDeleted,
    handleReactionUpdated,
    undefined,
    handleConversationRead,
  );

  const handleSend = async () => {
    const allUploaded = pendingImages.every((img) => img.remoteUrl !== null);
    if ((!input.trim() && pendingImages.length === 0) || !allUploaded) return;

    const tempId = crypto.randomUUID();
    setSendingIds((prev) => {
      const next = new Set(prev);
      next.add(tempId);
      return next;
    });

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        type: "TEXT",
        content: input.trim() ?? null,
        conversationId,
        userId: session?.user.id!,
        createdAt: new Date(),
        directMessageReactions: [],
        replyToId: replyingTo?.id ?? null,
        replyTo: replyingTo ?? null,
        images: pendingImages.map((img) => img.remoteUrl ?? img.localUrl) ?? [],
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
        },
      },
    ]);
    setInput("");
    pendingImages.forEach((img) => URL.revokeObjectURL(img.localUrl));
    setPendingImages([]);
    setReplyingTo(null);

    try {
      const response = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
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
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        const error = await response.json();
        toast.error(error.error ?? "Failed to send message.");
      } else {
        const newMessage: DmMessageWithUser = await response.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? newMessage : m)),
        );
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Network error.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendTypingEvent = useCallback(
    (isTyping: boolean) => {
      if (isTypingRef.current === isTyping) return;
      isTypingRef.current = isTyping;

      fetch("/api/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      }).catch(() => {});
    },
    [conversationId],
  );

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    sendTypingEvent(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingEvent(false);
    };
  }, [sendTypingEvent]);

  const lastSeenMessageId = [...messages]
    .reverse()
    .find(
      (m) =>
        m.userId === session?.user.id &&
        otherLastReadAt &&
        new Date(otherLastReadAt) >= new Date(m.createdAt),
    )?.id;

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Avatar className="size-16 mb-3">
              <AvatarImage src={otherUser.image ?? ""} />
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {otherUser.name}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              This is the beginning of your conversation with {otherUser.name}
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-4">
            {hasMore && <div ref={topSentinelRef} className="h-1" />}
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <span className="size-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

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
                    message={msg}
                    currentUserId={session?.user.id ?? ""}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReaction={handleToggleReaction}
                    onReply={handleReply}
                    isSending={sendingIds.has(msg.id)}
                  />
                  {lastSeenMessageId === msg.id && (
                    <div className="flex justify-end mr-4 -mt-1 mb-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="size-4 ring-1 ring-white dark:ring-zinc-950">
                            <AvatarImage src={otherUser.image ?? ""} />
                            <AvatarFallback className="text-[8px] font-medium bg-zinc-100 dark:bg-zinc-800">
                              {getInitials(otherUser.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="text-[10px]">
                            Seen by {otherUser.name}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
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
                ↓ Scroll to bottom
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className={`px-6 transition-all duration-200 ${
          isOtherTyping ? "h-6 opacity-100" : "h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">
            {otherUser.name} is typing
          </span>
          <span className="inline-flex items-end gap-0.5 pb-0.5">
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>

      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 pb-2">
          {pendingImages.map((img, i) => (
            <div key={img.localUrl} className="relative group">
              <img
                src={img.localUrl}
                alt=""
                className={`size-16 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 transition-opacity ${
                  img.remoteUrl ? "opacity-100" : "opacity-60"
                }`}
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
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
              {replyingTo.user.name}
            </span>
            <span className="text-zinc-400 truncate">
              {getMessageFallbackText(replyingTo)}
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

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2.5 focus-within:border-indigo-500/50 dark:focus-within:border-indigo-400/50 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/5 transition-all shadow-xs">
          <input
            ref={imageInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <Popover open={attachOpen} onOpenChange={setAttachOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="shrink-0 size-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="w-48 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
            >
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setAttachOpen(false);
                }}
                disabled={
                  pendingImages.length >= MAX_IMAGE_PER_MESSAGE ||
                  isUploadingImages
                }
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <ImageIcon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span>Upload a File</span>
              </button>
            </PopoverContent>
          </Popover>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder={`Message ${otherUser.name}`}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-none min-h-[24px] max-h-[120px]"
            style={{ fieldSizing: "content" }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={
              (!input.trim() && pendingImages.length === 0) ||
              !pendingImages.every((img) => img.remoteUrl !== null)
            }
            className="size-7 rounded-lg flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-550 dark:hover:bg-indigo-400 disabled:opacity-35 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 transition-all shadow-md shrink-0 active:scale-95"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onReaction,
  onReply,
  isSending = false,
}: {
  message: DmMessageWithUser;
  currentUserId: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: DmMessageWithUser) => void;
  isSending?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editRef = useRef<HTMLTextAreaElement>(null);

  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.type === "MISSED_CALL") {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg px-3 py-2">
          <PhoneMissed className="size-4 text-red-400 shrink-0" />
          <span>Missed Call</span>
          <span className="text-xs ml-1" suppressHydrationWarning>
            {time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`relative flex flex-col px-4 rounded-lg transition-colors group dark:hover:bg-zinc-800/50 hover:bg-zinc-50 ${isSending ? "opacity-60 select-none pointer-events-none" : ""} ${
        message.replyTo ? "mt-3.5 pt-1.5 pb-1.5" : "mt-2.5 py-1.5"
      }`}
    >
      {message.replyTo && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pl-[34px] pb-1 min-w-0">
          <div className="absolute left-[32px] top-[14px] w-3 h-3 border-l-2 border-t-2 border-zinc-200 dark:border-zinc-800 rounded-tl-[6px] pointer-events-none" />

          <Avatar className="size-4 shrink-0">
            <AvatarImage src={message.replyTo.user.image ?? ""} />
            <AvatarFallback className="text-[6px] font-semibold text-zinc-700 dark:text-zinc-200">
              {getInitials(message.replyTo.user.name)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => jumpToMessage(message.replyTo!.id)}
            className="flex items-center gap-1 text-left min-w-0 transition-colors cursor-pointer group/reply-btn text-zinc-450 dark:text-zinc-450"
          >
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">
              @{message.replyTo.user.name}
            </span>
            <span className="truncate hover:text-zinc-700 dark:hover:text-zinc-350 font-medium">
              {getMessageFallbackText(message.replyTo)}
            </span>
          </button>
        </div>
      )}

      <div className="flex items-start gap-3 w-full">
        <UserProfileCard
          userId={message.user.id}
          name={message.user.name}
          image={message.user.image}
          isCurrentUser={message.user.id === currentUserId}
          side="right"
        >
          <button className="shrink-0 cursor-pointer rounded-full outline-none">
            <Avatar className="size-8">
              <AvatarImage src={message.user.image ?? ""} />
              <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {getInitials(message.user.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </UserProfileCard>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
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
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const content = editRef.current?.value.trim();
                    if (content) {
                      onEdit(message.id, content);
                      setIsEditing(false);
                    }
                  }}
                  className="text-xs font-medium px-3 py-1 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
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

          {message.images.length > 0 &&
            (() => {
              const parsedAttachments = message.images.map(getAttachmentMeta);
              const images = parsedAttachments
                .filter((a) => a.isImg)
                .map((a) => a.downloadUrl);
              const videos = parsedAttachments.filter((a) => a.isVid);
              const files = parsedAttachments.filter(
                (a) => !a.isImg && !a.isVid,
              );

              return (
                <div className="flex flex-col gap-2 mt-1">
                  {images.length > 0 && <ImageGrid images={images} />}

                  {videos.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {videos.map((vid) => (
                        <div
                          key={vid.downloadUrl}
                          className="relative max-w-md rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-855 bg-black/10 dark:bg-black/40 shadow-sm"
                        >
                          <video
                            src={vid.downloadUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="max-w-full max-h-[300px] w-auto h-auto block object-contain mx-auto"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {files.map((file) => (
                        <div
                          key={file.downloadUrl}
                          className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 max-w-sm group/file hover:bg-zinc-100/40 dark:hover:bg-zinc-900/50 transition-all duration-200"
                        >
                          <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                            <FileUp className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <a
                              href={file.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              className="text-[10px] text-blue-500 hover:underline mt-0.5 block font-medium"
                            >
                              Download File
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          {message.directMessageReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(
                message.directMessageReactions.reduce(
                  (acc, r) => {
                    if (!acc[r.emoji]) {
                      acc[r.emoji] = { count: 0, hasReacted: false, users: [] };
                    }
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
      </div>

      {!isEditing && !isSending && (
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
            onClick={() => onReply(message)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <Reply className="size-3.5" />
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
