import { z } from "zod";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const studioRouter = createTRPCRouter({});