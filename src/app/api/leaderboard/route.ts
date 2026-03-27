import { headers } from "next/headers";
import { and, desc, eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/leaderboard
 * Returns the top 10 students ranked by points, including their
 * total evaluated submission count.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch top 10 students by points along with their evaluated submission count
  const topStudents = await db
    .select({
      name: schema.user.name,
      nickname: schema.user.nickname,
      points: schema.user.points,
      totalSubmissions: count(schema.submission.id),
    })
    .from(schema.user)
    .leftJoin(
      schema.submission,
      and(
        eq(schema.user.id, schema.submission.studentId),
        eq(schema.submission.status, "evaluated"),
      ),
    )
    .where(eq(schema.user.role, "student"))
    .groupBy(schema.user.id, schema.user.name, schema.user.nickname, schema.user.points)
    .orderBy(desc(schema.user.points))
    .limit(10);

  const leaderboard = topStudents.map((row, index) => ({
    rank: index + 1,
    name: row.nickname ?? row.name.split(" ")[0],
    points: row.points,
    totalSubmissions: row.totalSubmissions,
  }));

  return Response.json(leaderboard);
}
