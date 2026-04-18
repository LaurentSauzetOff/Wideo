/* import { DEFAULT_LIMIT } from "@/constants"; */
import { HydrateClient, trpc } from "@/trpc/server";

import { StudioView } from "@/modules/studio/ui/views/studio-view";
import { DEFAULT_LIMIT } from "@/constants";

export const dynamic = "force-dynamic";

const Page = async () => {
  try {
    await trpc.studio.getMany.prefetchInfinite({
      limit: DEFAULT_LIMIT,
    });
  } catch {
    // Avoid dehydrating a pending query that later rejects on the client.
  }

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default Page;
