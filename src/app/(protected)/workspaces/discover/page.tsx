import { serverCompReqAuth } from "@/lib/server-comp-req-auth";
import DiscoverClient from "./_components/discover-client";
import prisma from "@/lib/prisma";

type SearchParams = Promise<{ query?: string; tag?: string }>;

type Props = {
  searchParams: SearchParams;
};

export default async function Page({ searchParams }: Props) {
  const session = await serverCompReqAuth();
  const resolvedParams = await searchParams;
  const query = resolvedParams.query ?? "";
  const tag = resolvedParams.tag ?? "All";

  const allWorkspaces = await prisma.workspace.findMany({
    where: { isPrivate: false },
    select: { traits: true },
  });
  const allUniqueTags = [
    "All",
    ...Array.from(new Set(allWorkspaces.flatMap((w) => w.traits))),
  ];

  const publicWorkspaces = await prisma.workspace.findMany({
    where: {
      isPrivate: false,
      AND: [
        tag && tag !== "All"
          ? {
              traits: {
                has: tag,
              },
            }
          : {},
        query
          ? {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {},
      ],
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      members: {
        _count: "desc",
      },
    },
    take: 12,
  });

  const formattedWorkspaces = publicWorkspaces.map((w) => ({
    id: w.id,
    name: w.name,
    image: w.image,
    banner: w.banner,
    description: w.description,
    traits: w.traits,
    membersCount: w.members.length,
  }));

  const joinedWorkspaceIds = publicWorkspaces
    .filter((w) => w.members.some((m) => m.userId === session.user.id))
    .map((w) => w.id);

  return (
    <DiscoverClient
      workspaces={formattedWorkspaces}
      joinedWorkspaceIds={joinedWorkspaceIds}
      allUniqueTags={allUniqueTags}
      initialSearchQuery={query}
      initialSelectedTag={tag}
    />
  );
}
