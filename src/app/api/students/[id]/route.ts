import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Cannot ban yourself
  if (session.user.id === id) {
    return Response.json(
      { error: "You cannot deactivate your own account" },
      { status: 403 }
    );
  }

  // Look up the target user
  const [targetUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id));

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Cannot ban a teacher or admin
  if (targetUser.role === "teacher" || targetUser.role === "admin") {
    return Response.json(
      { error: "Cannot deactivate a teacher or admin account" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { banned?: boolean; subscribed?: boolean };

  if (typeof body.banned === "boolean") {
    await db
      .update(schema.user)
      .set({ banned: body.banned })
      .where(eq(schema.user.id, id));
    return Response.json({ success: true, banned: body.banned });
  }

  if (typeof body.subscribed === "boolean") {
    const now = new Date();
    const periodEnd = body.subscribed
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
    await db
      .update(schema.user)
      .set({
        subscribed: body.subscribed,
        subscribedAt: body.subscribed ? now : null,
        subscriptionPeriodEnd: periodEnd,
      })
      .where(eq(schema.user.id, id));

    await db.insert(schema.subscriptionHistory).values({
      id: crypto.randomUUID(),
      userId: id,
      action: body.subscribed ? "activated" : "revoked",
      changedById: session.user.id,
      changedByRole: role,
      amount: 0, // manual activation — no charge
      periodEnd: periodEnd ?? undefined,
      createdAt: now,
    });

    return Response.json({ success: true, subscribed: body.subscribed });
  }

  return Response.json(
    { error: "Request body must include a boolean 'banned' or 'subscribed' field" },
    { status: 400 }
  );
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Cannot delete yourself
  if (session.user.id === id) {
    return Response.json(
      { error: "You cannot delete your own account" },
      { status: 403 }
    );
  }

  // Look up the target user
  const [targetUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id));

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Cannot delete a teacher or admin
  if (targetUser.role === "teacher" || targetUser.role === "admin") {
    return Response.json(
      { error: "Cannot delete a teacher or admin account" },
      { status: 403 }
    );
  }

  await db.delete(schema.user).where(eq(schema.user.id, id));

  return Response.json({ success: true });
}
