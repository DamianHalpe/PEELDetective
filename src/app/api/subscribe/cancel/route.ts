import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "student") {
    return Response.json(
      { error: "Only students can cancel via this endpoint" },
      { status: 403 }
    );
  }

  const alreadySubscribed = (session.user as { subscribed?: boolean }).subscribed;
  if (!alreadySubscribed) {
    return Response.json({ success: true, subscribed: false });
  }

  const now = new Date();

  await db
    .update(schema.user)
    .set({ subscribed: false, subscriptionPeriodEnd: now })
    .where(eq(schema.user.id, session.user.id));

  await db.insert(schema.subscriptionHistory).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "revoked",
    changedById: session.user.id,
    changedByRole: "student",
    amount: 0,
    periodEnd: now,
    createdAt: now,
  });

  return Response.json({ success: true, subscribed: false });
}
