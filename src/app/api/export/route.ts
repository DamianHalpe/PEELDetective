import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * Escape a value for CSV output. Wraps in double quotes if the value
 * contains commas, double quotes, or newlines.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvString(headerRow: string[], dataRows: string[][]): string {
  const lines = [headerRow.map(csvEscape).join(",")];
  for (const row of dataRows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "class") {
    return handleClassExport();
  }

  if (type === "student") {
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return Response.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }
    return handleStudentExport(studentId);
  }

  if (type === "scenario") {
    const scenarioId = url.searchParams.get("scenarioId");
    if (!scenarioId) {
      return Response.json(
        { error: "scenarioId query parameter is required" },
        { status: 400 }
      );
    }
    return handleScenarioExport(scenarioId);
  }

  return Response.json(
    { error: "Invalid type. Use: class, student, or scenario" },
    { status: 400 }
  );
}

async function handleClassExport(): Promise<Response> {
  // Get all students who have at least one submission, with their stats
  const submissions = await db
    .select({
      studentId: schema.submission.studentId,
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .orderBy(schema.user.name);

  // Aggregate stats per student
  const studentMap = new Map<
    string,
    {
      name: string;
      nickname: string;
      email: string;
      totalSubmissions: number;
      evaluatedCount: number;
      totalScoreSum: number;
      latestSubmission: Date;
    }
  >();

  for (const row of submissions) {
    const existing = studentMap.get(row.studentId);
    const effectiveScore = row.teacherOverrideScore ?? row.totalScore;
    const isEvaluated = row.status === "evaluated";
    const submittedAt = new Date(row.submittedAt);

    if (!existing) {
      studentMap.set(row.studentId, {
        name: row.studentName ?? "Unknown",
        nickname: row.studentNickname ?? "",
        email: row.studentEmail ?? "",
        totalSubmissions: 1,
        evaluatedCount: isEvaluated ? 1 : 0,
        totalScoreSum: isEvaluated && effectiveScore != null ? effectiveScore : 0,
        latestSubmission: submittedAt,
      });
    } else {
      existing.totalSubmissions += 1;
      if (isEvaluated) {
        existing.evaluatedCount += 1;
        existing.totalScoreSum += effectiveScore ?? 0;
      }
      if (submittedAt > existing.latestSubmission) {
        existing.latestSubmission = submittedAt;
      }
    }
  }

  const headerRow = [
    "Student Name",
    "Nickname",
    "Email",
    "Total Submissions",
    "Average Score",
    "Latest Submission",
  ];
  const dataRows: string[][] = [];

  for (const [, stats] of studentMap) {
    const avgScore =
      stats.evaluatedCount > 0
        ? (stats.totalScoreSum / stats.evaluatedCount).toFixed(1)
        : "N/A";
    dataRows.push([
      stats.name,
      stats.nickname,
      stats.email,
      String(stats.totalSubmissions),
      avgScore,
      stats.latestSubmission.toISOString(),
    ]);
  }

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, "class-report.csv");
}

async function handleStudentExport(studentId: string): Promise<Response> {
  const submissions = await db
    .select({
      scenarioTitle: schema.scenario.title,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, studentId))
    .orderBy(desc(schema.submission.submittedAt));

  const headerRow = [
    "Scenario",
    "Point",
    "Evidence",
    "Explain",
    "Link",
    "Total Score",
    "Teacher Override",
    "Teacher Note",
    "Status",
    "Submitted At",
  ];
  const dataRows = submissions.map((s) => [
    s.scenarioTitle ?? "Unknown",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toISOString(),
  ]);

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, `student-${studentId}-report.csv`);
}

async function handleScenarioExport(scenarioId: string): Promise<Response> {
  const submissions = await db
    .select({
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .where(eq(schema.submission.scenarioId, scenarioId))
    .orderBy(desc(schema.submission.submittedAt));

  const headerRow = [
    "Student Name",
    "Nickname",
    "Email",
    "Point",
    "Evidence",
    "Explain",
    "Link",
    "Total Score",
    "Teacher Override",
    "Teacher Note",
    "Status",
    "Submitted At",
  ];
  const dataRows = submissions.map((s) => [
    s.studentName ?? "Unknown",
    s.studentNickname ?? "",
    s.studentEmail ?? "",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toISOString(),
  ]);

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, `scenario-${scenarioId}-report.csv`);
}
