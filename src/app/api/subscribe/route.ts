import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

const SUBSCRIPTION_PRICE_CENTS = 1000; // $10.00

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "student") {
    return Response.json({ error: "Only students can subscribe via this endpoint" }, { status: 403 });
  }

  const alreadySubscribed = (session.user as { subscribed?: boolean }).subscribed;
  if (alreadySubscribed) {
    return Response.json({ success: true, subscribed: true });
  }

  const now = new Date();
  const periodEnd = addDays(now, 30);

  await db
    .update(schema.user)
    .set({ subscribed: true, subscribedAt: now, subscriptionPeriodEnd: periodEnd })
    .where(eq(schema.user.id, session.user.id));

  await db.insert(schema.subscriptionHistory).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "activated",
    changedById: session.user.id,
    changedByRole: "student",
    amount: SUBSCRIPTION_PRICE_CENTS,
    periodEnd,
    createdAt: now,
  });

  return Response.json({ success: true, subscribed: true });
}
