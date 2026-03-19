import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
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

  // Teachers/admins can view any student; students can only view their own
  const role = session.user.role as string;
  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  if (!isTeacherOrAdmin && session.user.id !== id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Join submissions with scenario to get scenario title
  const submissions = await db
    .select({
      id: schema.submission.id,
      studentId: schema.submission.studentId,
      scenarioId: schema.submission.scenarioId,
      responseText: schema.submission.responseText,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      feedbackJson: schema.submission.feedbackJson,
      grammarFlagsJson: schema.submission.grammarFlagsJson,
      modelAnswer: schema.submission.modelAnswer,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
      aiEvaluatedAt: schema.submission.aiEvaluatedAt,
      scenarioTitle: schema.scenario.title,
    })
    .from(schema.submission)
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, id))
    .orderBy(desc(schema.submission.submittedAt));

  return Response.json(submissions);
}
