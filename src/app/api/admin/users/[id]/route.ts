import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { isAdminOrSuperAdmin } from "@/lib/session";

const VALID_ROLES = ["student", "teacher", "admin", "super-admin"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const viewerRole = session.user.role as string;
  if (!isAdminOrSuperAdmin(viewerRole)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch target user's current role
  const [targetUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Admins cannot edit other admins or super-admins — only super-admins can
  if (
    (targetUser.role === "admin" || targetUser.role === "super-admin") &&
    viewerRole !== "super-admin"
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, role, banned } = body as Record<string, unknown>;
  const updates: Partial<{ name: string; role: string; banned: boolean }> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role as string)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }
    // Only super-admins can assign admin or super-admin roles
    if ((role === "admin" || role === "super-admin") && viewerRole !== "super-admin") {
      return Response.json({ error: "Only super-admins can assign elevated roles" }, { status: 403 });
    }
    if (id === session.user.id && role !== viewerRole) {
      return Response.json({ error: "You cannot change your own role" }, { status: 400 });
    }
    updates.role = role as string;
  }

  if (banned !== undefined) {
    if (typeof banned !== "boolean") {
      return Response.json({ error: "banned must be a boolean" }, { status: 400 });
    }
    if (id === session.user.id && banned === true) {
      return Response.json({ error: "You cannot suspend your own account" }, { status: 400 });
    }
    updates.banned = banned;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided" }, { status: 400 });
  }

  await db.update(user).set(updates).where(eq(user.id, id));

  return Response.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const viewerRole = session.user.role as string;
  if (!isAdminOrSuperAdmin(viewerRole)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return Response.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  // Fetch target user's current role
  const [targetUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Admins cannot delete other admins or super-admins
  if (
    (targetUser.role === "admin" || targetUser.role === "super-admin") &&
    viewerRole !== "super-admin"
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(user).where(eq(user.id, id));

  return Response.json({ success: true });
}
