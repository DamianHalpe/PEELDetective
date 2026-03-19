import { eq, and, sql, countDistinct, count } from "drizzle-orm";
import * as schema from "./schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

const defaultBadges = [
  {
    id: "first-case",
    name: "First Case Closed",
    description: "Submit your first response",
    iconName: "Badge",
    triggerCondition: "submission_count >= 1",
  },
  {
    id: "sharp-eye",
    name: "Sharp Eye",
    description: "Score 18 or above",
    iconName: "Eye",
    triggerCondition: "total_score >= 18",
  },
  {
    id: "veteran",
    name: "Veteran Detective",
    description: "Complete 5 scenarios",
    iconName: "Shield",
    triggerCondition: "scenario_count >= 5",
  },
  {
    id: "perfect",
    name: "Perfect Case",
    description: "Score 20/20",
    iconName: "Trophy",
    triggerCondition: "total_score == 20",
  },
];

/**
 * Seeds the badge table with default badge definitions if it is empty.
 * This is idempotent -- calling it multiple times is safe.
 */
export async function seedBadgesIfNeeded(
  db: PostgresJsDatabase<typeof schema>,
) {
  const existing = await db
    .select({ total: count() })
    .from(schema.badge);

  if ((existing[0]?.total ?? 0) > 0) return;

  await db.insert(schema.badge).values(defaultBadges);
}

/**
 * Checks badge trigger conditions and awards any newly earned badges
 * to the student. Skips badges already awarded to avoid duplicates.
 */
export async function awardBadges(
  db: PostgresJsDatabase<typeof schema>,
  userId: string,
  submissionData: { totalScore: number },
) {
  // Gather student statistics needed for badge evaluation
  const [submissionStats] = await db
    .select({ submissionCount: count() })
    .from(schema.submission)
    .where(
      and(
        eq(schema.submission.studentId, userId),
        eq(schema.submission.status, "evaluated"),
      ),
    );

  const [scenarioStats] = await db
    .select({ scenarioCount: countDistinct(schema.submission.scenarioId) })
    .from(schema.submission)
    .where(
      and(
        eq(schema.submission.studentId, userId),
        eq(schema.submission.status, "evaluated"),
      ),
    );

  const submissionCount = submissionStats?.submissionCount ?? 0;
  const scenarioCount = scenarioStats?.scenarioCount ?? 0;
  const { totalScore } = submissionData;

  // Determine which badge IDs should be awarded based on triggers
  const earnedBadgeIds: string[] = [];

  if (submissionCount >= 1) {
    earnedBadgeIds.push("first-case");
  }
  if (totalScore >= 18) {
    earnedBadgeIds.push("sharp-eye");
  }
  if (scenarioCount >= 5) {
    earnedBadgeIds.push("veteran");
  }
  if (totalScore === 20) {
    earnedBadgeIds.push("perfect");
  }

  if (earnedBadgeIds.length === 0) return [];

  // Find which of these the student already has to avoid duplicates
  const alreadyAwarded = await db
    .select({ badgeId: schema.studentBadge.badgeId })
    .from(schema.studentBadge)
    .where(eq(schema.studentBadge.studentId, userId));

  const alreadyAwardedIds = new Set(alreadyAwarded.map((r) => r.badgeId));
  const newBadgeIds = earnedBadgeIds.filter((id) => !alreadyAwardedIds.has(id));

  if (newBadgeIds.length === 0) return [];

  // Insert new badge awards
  await db.insert(schema.studentBadge).values(
    newBadgeIds.map((badgeId) => ({
      id: crypto.randomUUID(),
      studentId: userId,
      badgeId,
      awardedAt: new Date(),
    })),
  );

  // Return the names of newly awarded badges for potential display
  const newBadges = await db
    .select({ name: schema.badge.name })
    .from(schema.badge)
    .where(
      sql`${schema.badge.id} IN ${newBadgeIds}`,
    );

  return newBadges.map((b) => b.name);
}
