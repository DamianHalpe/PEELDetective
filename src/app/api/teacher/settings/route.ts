import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * PATCH /api/teacher/settings
 * Allows teachers/admins to update their own settings.
 * Body: { leaderboardEnabled: boolean }
 */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { leaderboardEnabled?: boolean };
  if (typeof body.leaderboardEnabled !== "boolean") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  await db
    .update(schema.user)
    .set({ leaderboardEnabled: body.leaderboardEnabled })
    .where(eq(schema.user.id, session.user.id));

  return Response.json({ ok: true, leaderboardEnabled: body.leaderboardEnabled });
}

/**
 * GET /api/teacher/settings
 * Returns the current settings for the logged-in teacher.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [teacher] = await db
    .select({ leaderboardEnabled: schema.user.leaderboardEnabled })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id));

  return Response.json({ leaderboardEnabled: teacher?.leaderboardEnabled ?? true });
}
