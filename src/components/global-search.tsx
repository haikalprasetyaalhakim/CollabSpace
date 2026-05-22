"use client";

import { useSearch } from "@/hooks/use-search";
import { getInitials } from "@/lib/utils";
import { Hash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

const MOCK_CHANNELS = [
  { id: "1", name: "general" },
  { id: "2", name: "random" },
  { id: "3", name: "development" },
];

const MOCK_MESSAGES = [
  {
    id: "msg-1",
    channelId: "1",
    channelName: "general",
    content: "Kita akan mulai deploying collabspace sore ini guys!",
    createdAt: "2026-05-21T10:00:00Z",
    user: { name: "Alice Walker", image: "" },
  },
  {
    id: "msg-2",
    channelId: "3",
    channelName: "development",
    content: "Pastikan untuk running bunx prisma db push terlebih dahulu.",
    createdAt: "2026-05-21T09:30:00Z",
    user: { name: "Bob Smith", image: "" },
  },
];
const MOCK_DMS = [
  {
    id: "dm-1",
    conversationId: "conv-123",
    content: "Halo, progress perbaikan SSE heartbeat sudah dideploy ya.",
    createdAt: "2026-05-21T08:15:00Z",
    user: { name: "Charlie Brown", image: "" },
  },
];

export default function GlobalSearch() {
  const { open, setOpen } = useSearch();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    channels: { id: string; name: string }[];
    messages: {
      id: string;
      content: string | null;
      createdAt: string;
      channelId: string | null;
      channel: { name: string } | null;
      user: { name: string; image: string | null };
    }[];
    dms: {
      id: string;
      content: string | null;
      createdAt: string;
      conversationId: string;
      user: { name: string; image: string | null };
    }[];
  }>({
    channels: [],
    messages: [],
    dms: [],
  });

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ channels: [], messages: [], dms: [] });
      return;
    }
    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          channels: data.channels ?? [],
          messages: data.messages ?? [],
          dms: data.dms ?? [],
        });
      } catch {
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  const hasResults =
    results.channels.length > 0 ||
    results.messages.length > 0 ||
    results.dms.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search channels, messages, and DMs... (Min. 2 chars)"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 text-zinc-400 gap-2">
              <Loader2 className="size-4 animate-spin text-zinc-500" />
              <span className="text-sm">Searching...</span>
            </div>
          )}
          {!loading && query.trim().length >= 2 && !hasResults && (
            <CommandEmpty>
              No results found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="p-4 text-xs text-zinc-400 flex flex-col gap-2">
              <div className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                Search Tips
              </div>
              <p>
                Type{" "}
                <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border">
                  2 or more characters
                </kbd>{" "}
                to search across channels, messages, and DMs.
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <>
              {results.channels.length > 0 && (
                <CommandGroup heading="Channels">
                  {results.channels.map((channel) => (
                    <CommandItem
                      key={channel.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg"
                      onSelect={() => handleSelect(`/channels/${channel.id}`)}
                    >
                      <Hash className="size-4 text-zinc-500 shrink-0" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {channel.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.messages.length > 0 && (
                <CommandGroup heading="Messages in Channels">
                  {results.messages.map((message) => (
                    <CommandItem
                      key={message.id}
                      onSelect={() => {
                        handleSelect(
                          `/channels/${message.channelId}?highlight=${message.id}`,
                        );
                      }}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg"
                    >
                      <Avatar className="size-6 shrink-0 mt-0.5">
                        <AvatarImage src={message.user.image ?? ""} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {getInitials(message.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {message.user.name}
                          </span>
                          <span>
                            #{message.channel?.name} ·{" "}
                            {(() => {
                              const date = new Date(message.createdAt);
                              const isToday =
                                date.toDateString() ===
                                new Date().toDateString();

                              return isToday
                                ? date.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : date.toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  }) +
                                    " · " +
                                    date.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1 break-all">
                          {message.content}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.dms.length > 0 && (
                <CommandGroup heading="Direct Messages">
                  {results.dms.map((dm) => (
                    <CommandItem
                      key={dm.id}
                      onSelect={() => {
                        handleSelect(
                          `/dm/${dm.conversationId}?highlight=${dm.id}`,
                        );
                      }}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg"
                    >
                      <Avatar className="size-6 shrink-0 mt-0.5">
                        <AvatarImage src={dm.user.image ?? ""} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {getInitials(dm.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {dm.user.name}
                          </span>
                          <span>
                            Direct Message ·{" "}
                            {(() => {
                              const date = new Date(dm.createdAt);
                              const isToday =
                                date.toDateString() ===
                                new Date().toDateString();

                              return isToday
                                ? date.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : date.toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  }) +
                                    " · " +
                                    date.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1 break-all">
                          {dm.content}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
