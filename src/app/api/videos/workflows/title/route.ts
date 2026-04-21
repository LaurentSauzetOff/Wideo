import { db } from "@/db";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { videos } from "@/db/schema";

interface InputType {
  userId: string;
  videoId: string;
}

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { userId, videoId } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo[0]) {
      throw new Error("Video not found");
    }

    return existingVideo[0];
  });

  console.log("existingVideo", video);

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({ title: "updated from back" })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });

});


