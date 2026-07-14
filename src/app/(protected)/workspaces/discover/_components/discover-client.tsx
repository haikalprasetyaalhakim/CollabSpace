"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BadgeCheck, Compass, Search, Sparkles } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { joinPublicWorkspace } from "@/features/workspaces/actions/join-workspace-public";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center overflow-y-auto no-scrollbar pb-16">
      <div className="w-full max-w-5xl px-4 pt-8 shrink-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-bold uppercase tracking-wider transition-colors mb-6 group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Workspace
        </Link>
        <div className="w-full h-72 rounded-3xl relative overflow-hidden flex flex-col justify-center px-8 md:px-12 space-y-4 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xl bg-gradient-to-br from-zinc-50 via-zinc-100/50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950">
          <div className="absolute right-[-10%] top-[-20%] w-[380px] h-[380px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none animate-pulse duration-4000" />
          <div className="absolute left-[-5%] bottom-[-20%] w-[280px] h-[280px] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/5 blur-3xl pointer-events-none animate-pulse duration-6000" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/5 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 text-xs font-semibold w-fit tracking-wider border border-zinc-900/10 dark:border-white/10 backdrop-blur-md shadow-xs">
            <Compass
              className="size-3.5 animate-spin text-indigo-500"
              style={{ animationDuration: "12s" }}
            />
            Discover Communities
          </span>
          <h1 className="text-3xl md:text-5.5xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
            Find your community <br />
            on <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">CollabSpace</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl text-sm leading-relaxed font-medium">
            From coding, to gaming, to study, there's a place for you. Discover
            public servers and start collaborating instantly!
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl px-4 pt-10 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 py-1">
            {allUniqueTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer transition-all duration-200 whitespace-nowrap active:scale-95",
                    isActive
                      ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-md shadow-zinc-900/10 dark:shadow-none"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
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
              className="pl-9 h-10 text-xs rounded-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {workspaces.map((w) => {
          const isJoined = joinedWorkspaceIds.includes(w.id);

          return (
            <div
              key={w.id}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/30 dark:backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/40 flex flex-col shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all duration-300 ease-out"
            >
              <div className="h-36 w-full relative shrink-0">
                <div
                  className="absolute inset-0 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden transition-transform duration-500 ease-out group-hover:scale-102"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute -bottom-6 left-4 size-16 rounded-2xl border-4 border-white dark:border-zinc-950 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-102 z-10">
                  {w.image ? (
                    <Image
                      src={w.image}
                      alt={w.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-xl text-zinc-800 dark:text-zinc-200">
                      {getInitials(w.name).slice(0, 2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 pt-8 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate max-w-[85%]">
                      {w.name}
                    </h3>
                    <BadgeCheck className="size-4.5 text-sky-500 fill-sky-500/10 shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-medium">
                    {w.description ||
                      "Welcome! No description available for this community server."}
                  </p>
                </div>

                <div className="pt-5 space-y-4 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {w.traits.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-200/20 dark:border-zinc-850"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/60" />

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                      <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                      {w.membersCount}{" "}
                      {w.membersCount > 1 ? "Members" : "Member"}
                    </p>

                    {isJoined ? (
                      <Button
                        variant="outline"
                        className="text-xs font-bold h-8 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg transition-transform hover:-translate-y-0.5 duration-200 active:scale-95"
                        onClick={() => router.push(`/workspaces/${w.id}`)}
                      >
                        Open
                      </Button>
                    ) : (
                      <Button
                        disabled={isPending}
                        className="text-xs font-bold h-8 px-4 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 duration-200 active:scale-95 border-0"
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
        <div className="text-center py-28 space-y-3 shrink-0">
          <Sparkles className="size-12 text-zinc-400 dark:text-zinc-700 mx-auto animate-pulse" />
          <h3 className="text-zinc-950 dark:text-white font-extrabold text-xl tracking-tight">
            No communities found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed font-medium">
            Try searching for other tags or keywords.
          </p>
        </div>
      )}
    </div>
  );
}

