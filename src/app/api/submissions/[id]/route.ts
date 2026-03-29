import { headers } from "next/headers";
import { and, asc, eq, max, sql } from "drizzle-orm";
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

  // Compute attempt number and total attempts for this student+scenario
  const allAttempts = await db
    .select({ id: schema.submission.id })
    .from(schema.submission)
    .where(
      and(
        eq(schema.submission.studentId, found.studentId),
        eq(schema.submission.scenarioId, found.scenarioId)
      )
    )
    .orderBy(asc(schema.submission.submittedAt));

  const totalAttempts = allAttempts.length;
  const attemptNumber = allAttempts.findIndex((a) => a.id === found.id) + 1;

  return Response.json({ ...found, attemptNumber, totalAttempts });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin" && role !== "super-admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(schema.submission)
    .where(eq(schema.submission.id, id))
    .returning();

  if (!deleted) {
    return Response.json({ error: "Submission not found" }, { status: 404 });
  }

  // Reclaim points earned by this submission.
  // Points are only awarded for evaluated submissions, and only for improvements
  // over the student's previous best on a given scenario. The scenario's total
  // contribution to user.points equals the highest score ever achieved on it,
  // so removing a submission may lower that ceiling.
  if (deleted.status === "evaluated" && (deleted.totalScore ?? 0) > 0) {
    const [newBest] = await db
      .select({ best: max(schema.submission.totalScore) })
      .from(schema.submission)
      .where(
        and(
          eq(schema.submission.studentId, deleted.studentId),
          eq(schema.submission.scenarioId, deleted.scenarioId),
          eq(schema.submission.status, "evaluated"),
        ),
      );

    const pointsToRemove = (deleted.totalScore ?? 0) - (newBest?.best ?? 0);
    if (pointsToRemove > 0) {
      await db
        .update(schema.user)
        .set({ points: sql`GREATEST(0, ${schema.user.points} - ${pointsToRemove})` })
        .where(eq(schema.user.id, deleted.studentId));
    }
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin" && role !== "super-admin") {
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
