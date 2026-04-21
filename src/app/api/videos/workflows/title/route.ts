import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (context) => {
  await context.run("initial-step", () => {
    console.log("le premier step marche");
  });

  await context.run("second-step", () => {
    console.log("le second step marche");
  });
});
