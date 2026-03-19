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

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Verify the scenario exists
  const [scenarioRecord] = await db
    .select()
    .from(schema.scenario)
    .where(eq(schema.scenario.id, id));

  if (!scenarioRecord) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Join submissions with user to get student name and email
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
      studentName: schema.user.name,
      studentEmail: schema.user.email,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .where(eq(schema.submission.scenarioId, id))
    .orderBy(desc(schema.submission.submittedAt));

  return Response.json(submissions);
}
