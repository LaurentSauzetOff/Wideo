"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";

export const VideosSection = () => {
  const infiniteQueryOptions: Parameters<
    typeof trpc.studio.getMany.useSuspenseInfiniteQuery
  >[1] = {
    getNextPageParam: (lastPage: {
      nextCursor: { id: string; updatedAt: Date } | null;
    }) => lastPage.nextCursor,
  };

  const [data] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
    },
    infiniteQueryOptions,
  );
  return <div>{JSON.stringify(data)}</div>;
};
