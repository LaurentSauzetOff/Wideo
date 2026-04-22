import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { serve } from "@upstash/workflow/nextjs";

import { db } from "@/db";
import { videos } from "@/db/schema";

interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}

const getThumbnailGenerationError = (message?: string) => {
  if (!message) {
    return "Failed to generate thumbnail";
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("billing hard limit has been reached")) {
    return "AI thumbnail generation is unavailable: OpenAI billing hard limit reached. Please update your OpenAI billing settings.";
  }

  if (normalizedMessage.includes("insufficient_quota")) {
    return "AI thumbnail generation is unavailable: OpenAI quota exceeded. Please check your usage and billing limits.";
  }

  return message;
};

export const { POST } = serve(async (context) => {
  const utapi = new UTApi();
  const input = context.requestPayload as InputType;
  const { videoId, userId, prompt } = input;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo) {
      throw new Error("Not found");
    }

    return existingVideo;
  });

  const { body } = await context.call<{
    data?: Array<{ url?: string }>;
    error?: { message?: string };
  }>(
    "generate-thumbnail",
    {
      url: "https://api.openai.com/v1/images/generations",
      method: "POST",
      body: {
        prompt,
        n: 1,
        model: "dall-e-3",
        size: "1792x1024",
      },
      headers: {
        authorization: `Bearer ${openAiApiKey}`,
      },
    },
  );

  const tempThumbnailUrl = body.data?.[0]?.url;

  if (!tempThumbnailUrl) {
    throw new Error(getThumbnailGenerationError(body.error?.message));
  }

  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
      await db
        .update(videos)
        .set({ thumbnailKey: null, thumbnailUrl: null })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    }
  });

  const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
    const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

    if (!data) {
      throw new Error("Bad request");
    }

    return data;
  });

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.url,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
