import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch submissions joined with scenario to get titles
  const submissions = await db
    .select({
      id: schema.submission.id,
      scenarioId: schema.submission.scenarioId,
      scenarioTitle: schema.scenario.title,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .innerJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, userId))
    .orderBy(desc(schema.submission.submittedAt));

  // Fetch badges joined with badge definitions
  const badges = await db
    .select({
      id: schema.studentBadge.id,
      badgeId: schema.studentBadge.badgeId,
      name: schema.badge.name,
      description: schema.badge.description,
      iconName: schema.badge.iconName,
      awardedAt: schema.studentBadge.awardedAt,
    })
    .from(schema.studentBadge)
    .innerJoin(schema.badge, eq(schema.studentBadge.badgeId, schema.badge.id))
    .where(eq(schema.studentBadge.studentId, userId));

  // Fetch user points
  const [userRow] = await db
    .select({ points: schema.user.points })
    .from(schema.user)
    .where(eq(schema.user.id, userId));

  return Response.json({
    points: userRow?.points ?? 0,
    submissions,
    badges,
  });
}
