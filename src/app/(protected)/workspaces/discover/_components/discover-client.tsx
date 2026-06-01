"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Compass, Search, Sparkles } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { joinPublicWorkspace } from "@/features/workspaces/actions/join-workspace-public";

type PublicWorkspace = {
  id: string;
  name: string;
  image: string | null;
  banner: string | null;
  description: string | null;
  traits: string[];
  membersCount: number;
};

type Props = {
  workspaces: PublicWorkspace[];
  joinedWorkspaceIds: string[];
  allUniqueTags: string[];
  initialSearchQuery: string;
  initialSelectedTag: string;
};

export default function DiscoverClient({
  workspaces,
  joinedWorkspaceIds,
  allUniqueTags,
  initialSearchQuery,
  initialSelectedTag,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedTag, setSelectedTag] = useState(initialSelectedTag);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (searchQuery) {
        params.set("query", searchQuery);
      } else {
        params.delete("query");
      }
      router.replace(`/workspaces/discover?${params.toString()}`);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router]);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    const params = new URLSearchParams(window.location.search);
    if (tag && tag !== "All") {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.replace(`/workspaces/discover?${params.toString()}`);
  };

  const handleJoin = (workspaceId: string, workspaceName: string) => {
    startTransition(async () => {
      const res = await joinPublicWorkspace(workspaceId);
      if (!res.success) {
        toast.error(res.error || "Failed to join workspace");
        return;
      }
      toast.success(`Welcome to ${workspaceName}!`);
      router.push(`/workspaces/${workspaceId}`);
    });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center overflow-y-auto no-scrollbar pb-12">
      <div className="w-full max-w-5xl px-4 pt-6 shrink-0">
        <div className="w-full h-64 rounded-xl relative overflow-hidden flex flex-col justify-center px-8 md:px-12 space-y-3 border border-zinc-200 dark:border-zinc-800/50 shadow-md bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
          <div className="absolute right-[-10%] top-[-20%] w-[350px] h-[350px] rounded-full bg-zinc-900/5 dark:bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute left-[-5%] bottom-[-20%] w-[250px] h-[250px] rounded-full bg-zinc-950/10 dark:bg-black/40 blur-2xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white text-xs font-semibold w-fit tracking-wide border border-zinc-900/10 dark:border-white/10 backdrop-blur-md">
            <Compass
              className="size-3.5 animate-spin"
              style={{ animationDuration: "6s" }}
            />
            Discover Communities
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-wider text-zinc-900 dark:text-white uppercase drop-shadow-sm">
            Find your community on CollabSpace
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 max-w-xl text-sm leading-relaxed drop-shadow-xs">
            From coding, to gaming, to study, there's a place for you. Discover
            public servers and start collaborating instantly!
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl px-4 pt-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar -mb-[13px] h-10 shrink-0">
            {allUniqueTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className={`text-sm font-semibold tracking-wide cursor-pointer transition-all pb-3 relative whitespace-nowrap ${
                    isActive
                      ? "text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {workspaces.map((w) => {
          const isJoined = joinedWorkspaceIds.includes(w.id);

          return (
            <div
              key={w.id}
              className="rounded-lg overflow-hidden bg-card text-card-foreground border border-zinc-200 dark:border-zinc-800/80 flex flex-col shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div
                className="h-36 w-full relative shrink-0 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-950"
                style={
                  w.banner && !w.banner.startsWith("linear-gradient")
                    ? {
                        backgroundImage: `url(${w.banner})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                      }
                    : w.banner?.startsWith("linear-gradient")
                      ? {
                          background: w.banner,
                        }
                      : undefined
                }
              >
                <div className="absolute -bottom-6 left-4 size-16 rounded-2xl border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-md">
                  {w.image ? (
                    <img
                      src={w.image}
                      alt={w.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-xl text-zinc-800 dark:text-zinc-200">
                      {getInitials(w.name).slice(0, 2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 pt-8 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate max-w-[85%]">
                      {w.name}
                    </h3>
                    <BadgeCheck className="size-4 text-zinc-900 dark:text-zinc-100 shrink-0 fill-zinc-900/10 dark:fill-white/10" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {w.description ||
                      "Welcome! No description available for this community server."}
                  </p>
                </div>

                <div className="pt-4 space-y-4 shrink-0">
                  <div className="flex flex-wrap gap-1">
                    {w.traits.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 min-w-0">
                      <span className="inline-block size-2 rounded-full bg-emerald-500" />
                      {w.membersCount}{" "}
                      {w.membersCount > 1 ? "Members" : "Member"}
                    </p>

                    {isJoined ? (
                      <Button
                        variant="outline"
                        className="text-xs font-bold h-8 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        onClick={() => router.push(`/workspaces/${w.id}`)}
                      >
                        Open
                      </Button>
                    ) : (
                      <Button
                        disabled={isPending}
                        className="text-xs font-bold h-8 px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-none border-0"
                        onClick={() => handleJoin(w.id, w.name)}
                      >
                        {isPending ? "Joining..." : "Join"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-24 space-y-2 shrink-0">
          <Sparkles className="size-10 text-zinc-400 dark:text-zinc-700 mx-auto animate-pulse" />
          <h3 className="text-zinc-900 dark:text-white font-bold text-lg">
            No communities found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Try searching for other tags or keywords.
          </p>
        </div>
      )}
    </div>
  );
}
