import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [found] = await db
    .select()
    .from(schema.submission)
    .where(eq(schema.submission.id, id));

  if (!found) {
    return Response.json({ error: "Submission not found" }, { status: 404 });
  }

  // Students can only view their own submissions
  const role = session.user.role as string;
  if (role === "student" && found.studentId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Unsubscribed students may read their own past submissions (read-only access after cancellation)
  // but the ownership check above already ensures they can only see their own records

  return Response.json(found);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as {
    teacherOverrideScore?: number;
    teacherOverrideNote?: string;
  };

  if (data.teacherOverrideScore === undefined) {
    return Response.json(
      { error: "teacherOverrideScore is required" },
      { status: 400 }
    );
  }

  const updateFields: Record<string, unknown> = {
    teacherOverrideScore: data.teacherOverrideScore,
  };

  if (data.teacherOverrideNote !== undefined) {
    updateFields.teacherOverrideNote = data.teacherOverrideNote;
  }

  const [updated] = await db
    .update(schema.submission)
    .set(updateFields)
    .where(eq(schema.submission.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Submission not found" }, { status: 404 });
  }

  return Response.json(updated);
}
