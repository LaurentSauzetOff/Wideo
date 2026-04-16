import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../init";
import { auth } from "@clerk/nextjs/server";
export const appRouter = createTRPCRouter({
  hello: protectedProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      console.log({ dbUser: opts.ctx.user });
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
