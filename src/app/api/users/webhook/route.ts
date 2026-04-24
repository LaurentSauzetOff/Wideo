import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add CLERK_SIGNING_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const body = await req.text();
  console.log("Webhook body:", body);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified successfully");
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  // Do something with payload
  // For this guide, log payload to console
  const eventType = evt.type;
  console.log("Received webhook event:", eventType);

  if (eventType === "user.created") {
    const { data } = evt;
    console.log("User created data:", data);

    if (!data.id) {
      return new Response("Missing user id", { status: 400 });
    }

    try {
      await db.insert(users).values({
        clerkId: data.id,
        name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username || data.email_addresses?.[0]?.email_address || "Unknown User",
        imageUrl: data.image_url || "",
      });
    } catch (error) {
      console.error("Error inserting user:", error);
      return new Response("Error inserting user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { data } = evt;

    if (!data.id) {
      return new Response("Missing user id", { status: 400 });
    }

    try {
      await db.delete(users).where(eq(users.clerkId, data.id));
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { data } = evt;

    if (!data.id) {
      return new Response("Missing user id", { status: 400 });
    }

    try {
      await db
        .update(users)
        .set({
          name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username || data.email_addresses?.[0]?.email_address || "Unknown User",
          imageUrl: data.image_url || "",
        })
        .where(eq(users.clerkId, data.id));
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
