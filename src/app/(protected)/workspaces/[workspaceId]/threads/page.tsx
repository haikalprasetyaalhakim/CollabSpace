import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarInset } from "@/components/ui/sidebar";
import prisma from "@/lib/prisma";
import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import { getInitials, getAttachmentMeta } from "@/lib/utils";
import { ArrowRight, Hash, ImageIcon, MessageSquare, FileUp } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { ImageGrid } from "@/components/image-grid";

type Props = {
  params: Promise<{ workspaceId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workspaceId } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  return {
    title: workspace ? `${workspace.name} Threads` : "Threads",
  };
}

export default async function Page({ params }: Props) {
  const session = await serverCompReqAuth();
  const { workspaceId } = await params;

  const threads = await prisma.message.findMany({
    where: {
      channel: {
        workspaceId,
      },
      threadParentId: null,
      AND: [
        {
          OR: [
            { userId: session.user.id },
            {
              threadReplies: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        },
        {
          threadReplies: {
            some: {},
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
        },
      },
      threadReplies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <SidebarInset className="h-svh overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <MessageSquare className="size-5 text-zinc-500" />
            Threads
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Threads you participated in or started in this workspace
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        {threads.length === 0 ? (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 h-full select-none">
            <div className="size-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
              <MessageSquare className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
                No threads yet
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Threads you start or participate in will appear here. Hover over any message in a channel and click the reply icon to start a thread.
              </p>
            </div>
            
            <Link
              href={`/workspaces/${workspaceId}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md group text-left max-w-xs w-full"
            >
              <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200 text-zinc-500 dark:text-zinc-400 shrink-0">
                <ArrowRight className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 transition-colors duration-200">
                  Go to Workspace
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Return to your channels to browse conversations
                </p>
              </div>
            </Link>
          </div>
        ) : (
          threads.map((thread) => {
            const repliesCount = thread.threadReplies.length;
            const lastReply = thread.threadReplies[repliesCount - 1];

            const participantMap = new Map<
              string,
              { name: string; image: string | null }
            >();
            participantMap.set(thread.user.id, {
              name: thread.user.name,
              image: thread.user.image,
            });
            thread.threadReplies.forEach((r) => {
              participantMap.set(r.user.id, {
                name: r.user.name,
                image: r.user.image,
              });
            });

            const participants = Array.from(participantMap.values()).slice(
              0,
              4,
            );

            return (
              <div
                key={thread.id}
                className="group relative flex flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    <Hash className="size-3 text-zinc-400" />
                    {thread.channel?.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Started {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3 mb-4">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={thread.user.image ?? ""} />
                    <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {getInitials(thread.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {thread.user.name}
                    </span>
                    {thread.content ? (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {thread.content}
                      </p>
                    ) : thread.images.length > 0 ? (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-1 flex items-center gap-1.5 font-medium">
                        <ImageIcon className="size-3.5" />
                        Sent {thread.images.length === 1 ? "an image" : `${thread.images.length} images`}
                      </p>
                    ) : null}

                    {(() => {
                      const parsed = thread.images.map(getAttachmentMeta);
                      const threadImages = parsed.filter((a) => a.isImg).map((a) => a.downloadUrl);
                      const threadVideos = parsed.filter((a) => a.isVid);
                      const threadFiles = parsed.filter((a) => !a.isImg && !a.isVid);

                      return (
                        <div className="mt-2 space-y-2">
                          {threadImages.length > 0 && (
                            <div className="max-w-xs rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                              <ImageGrid images={threadImages} />
                            </div>
                          )}
                          {threadVideos.length > 0 && (
                            <div className="space-y-1.5">
                              {threadVideos.map((vid) => (
                                <div
                                  key={vid.downloadUrl}
                                  className="relative rounded-lg overflow-hidden border border-zinc-250 dark:border-zinc-700 bg-black/10 dark:bg-black/40"
                                >
                                  <video
                                    src={vid.downloadUrl}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="w-full max-h-40 block object-contain"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {threadFiles.length > 0 && (
                            <div className="space-y-1.5">
                              {threadFiles.map((file) => (
                                <div
                                  key={file.downloadUrl}
                                  className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/80 transition-colors"
                                >
                                  <FileUp className="size-4 text-zinc-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </p>
                                    <a
                                      href={file.downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={file.name}
                                      className="text-[9px] text-blue-500 hover:underline mt-0.5 block font-medium"
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
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {participants.map((p, idx) => (
                        <Avatar
                          key={idx}
                          className="size-6 border-2 border-white dark:border-zinc-900 ring-0 shrink-0"
                        >
                          <AvatarImage src={p.image ?? ""} />
                          <AvatarFallback className="text-[9px] font-bold">
                            {getInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>

                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {repliesCount} repl{repliesCount === 1 ? "y" : "ies"}
                    </span>

                    {lastReply && (
                      <span className="text-[11px] text-zinc-400 hidden sm:inline">
                        Last reply by {lastReply.user.name}{" "}
                        {new Date(lastReply.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/workspaces/${workspaceId}/channels/${thread.channelId}?highlight=${thread.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    View Thread
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SidebarInset>
  );
}
