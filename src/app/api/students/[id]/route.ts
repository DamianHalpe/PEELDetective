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

  const body = (await request.json()) as { banned?: boolean };
  if (typeof body.banned !== "boolean") {
    return Response.json(
      { error: "Request body must include a boolean 'banned' field" },
      { status: 400 }
    );
  }

  await db
    .update(schema.user)
    .set({ banned: body.banned })
    .where(eq(schema.user.id, id));

  return Response.json({ success: true, banned: body.banned });
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
