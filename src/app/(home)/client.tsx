"use client";

import { trpc } from "@/trpc/client";

export const PageClient = () => {
  const [data] = trpc.hello.useQuery({ text: "Coucou" });

  return <div>Page client says : {data?.greeting}</div>;
};
