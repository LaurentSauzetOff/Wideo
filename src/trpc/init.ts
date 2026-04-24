import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from "superjson";
import { ratelimit } from '@/lib/ratelimit';

export const createTRPCContext = cache(async () => {
  const { userId } = await auth();

  return { clerkUserId: userId };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts;

  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.clerkUserId))
    .limit(1);

  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(ctx.clerkUserId).catch(() => null);

    if (!clerkUser) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      clerkUser.primaryEmailAddress?.emailAddress ||
      "Unknown User";

    const [upsertedUser] = await db
      .insert(users)
      .values({
        clerkId: ctx.clerkUserId,
        name,
        imageUrl: clerkUser.imageUrl || "",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          name,
          imageUrl: clerkUser.imageUrl || "",
          updatedAt: new Date(),
        },
      })
      .returning();

    user = upsertedUser;
  }

  const { success } = await ratelimit.limit(user.id);

  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user,
    },
  });
});