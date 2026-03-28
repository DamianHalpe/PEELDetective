import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  Users,
  FileText,
  TrendingUp,
  Download,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { LeaderboardToggle } from "@/components/leaderboard-toggle";

export const metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch teacher's leaderboard setting from their own user record
  const [teacherUser] = await db
    .select({ leaderboardEnabled: schema.user.leaderboardEnabled })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id));

  const leaderboardEnabled = teacherUser?.leaderboardEnabled ?? true;

  // Fetch all submissions joined with student info
  const allSubmissions = await db
    .select({
      studentId: schema.submission.studentId,
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
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
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id));

  // Aggregate stats per student
  const studentMap = new Map<
    string,
    {
      name: string;
      nickname: string | null;
      email: string;
      totalSubmissions: number;
      evaluatedCount: number;
      totalScoreSum: number;
      latestSubmission: Date;
    }
  >();

  let totalEvaluated = 0;
  let totalScoreSum = 0;

  for (const row of allSubmissions) {
    const effectiveScore = row.teacherOverrideScore ?? row.totalScore;
    const isEvaluated = row.status === "evaluated";
    const submittedAt = new Date(row.submittedAt);

    if (isEvaluated && effectiveScore != null) {
      totalEvaluated += 1;
      totalScoreSum += effectiveScore;
    }

    const existing = studentMap.get(row.studentId);
    if (!existing) {
      studentMap.set(row.studentId, {
        name: row.studentName ?? "Unknown",
        nickname: row.studentNickname ?? null,
        email: row.studentEmail ?? "",
        totalSubmissions: 1,
        evaluatedCount: isEvaluated ? 1 : 0,
        totalScoreSum:
          isEvaluated && effectiveScore != null ? effectiveScore : 0,
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

  const studentList = Array.from(studentMap.entries()).map(([id, stats]) => ({
    id,
    ...stats,
    averageScore:
      stats.evaluatedCount > 0
        ? stats.totalScoreSum / stats.evaluatedCount
        : null,
  }));

  // Sort by name
  studentList.sort((a, b) => a.name.localeCompare(b.name));

  const classAverage =
    totalEvaluated > 0 ? (totalScoreSum / totalEvaluated).toFixed(1) : "--";

  // Compute overall PEEL element averages across all evaluated submissions
  const evaluatedAll = allSubmissions.filter((s) => s.status === "evaluated");
  const peelAvg =
    evaluatedAll.length > 0
      ? {
          avgPoint:
            evaluatedAll.reduce((sum, s) => sum + (s.scorePoint ?? 0), 0) /
            evaluatedAll.length,
          avgEvidence:
            evaluatedAll.reduce((sum, s) => sum + (s.scoreEvidence ?? 0), 0) /
            evaluatedAll.length,
          avgExplain:
            evaluatedAll.reduce((sum, s) => sum + (s.scoreExplain ?? 0), 0) /
            evaluatedAll.length,
          avgLink:
            evaluatedAll.reduce((sum, s) => sum + (s.scoreLink ?? 0), 0) /
            evaluatedAll.length,
        }
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of student performance across all scenarios
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LeaderboardToggle initialEnabled={leaderboardEnabled} />
            <Button variant="outline" asChild>
              <Link href="/teacher/scenarios">
                <BookOpen className="mr-2 h-4 w-4" />
                Scenarios
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/teacher/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export?type=class" download>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export?type=class&format=pdf" download>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/15 p-2">
                  <Users className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold">{studentMap.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/15 p-2">
                  <FileText className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Submissions
                  </p>
                  <p className="text-2xl font-bold">{allSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/15 p-2">
                  <TrendingUp className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Class Average
                  </p>
                  <p className="text-2xl font-bold">
                    {classAverage !== "--" ? `${classAverage}/20` : classAverage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PEEL Aggregate Panel */}
        {peelAvg && (
          <Card className="border-detective-amber/35">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Class PEEL Averages — All Scenarios
              </CardTitle>
              <CardDescription>
                Average score per element across {evaluatedAll.length} evaluated
                submission{evaluatedAll.length !== 1 ? "s" : ""}. Each element
                out of 5.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(
                  [
                    { label: "P", full: "Point", avg: peelAvg.avgPoint },
                    { label: "E", full: "Evidence", avg: peelAvg.avgEvidence },
                    { label: "E", full: "Explain", avg: peelAvg.avgExplain },
                    { label: "L", full: "Link", avg: peelAvg.avgLink },
                  ] as const
                ).map(({ label, full, avg }) => {
                  const minAvg = Math.min(
                    peelAvg.avgPoint,
                    peelAvg.avgEvidence,
                    peelAvg.avgExplain,
                    peelAvg.avgLink
                  );
                  const isWeakest = avg === minAvg;
                  return (
                    <div key={full} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {label}{" "}
                          <span className="text-muted-foreground font-normal text-xs">
                            {full}
                          </span>
                        </span>
                        <span
                          className={
                            isWeakest
                              ? "font-semibold text-amber-600 dark:text-amber-400"
                              : "font-semibold"
                          }
                        >
                          {avg.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={
                            isWeakest
                              ? "h-full rounded-full bg-amber-500"
                              : "h-full rounded-full bg-detective-amber"
                          }
                          style={{ width: `${(avg / 5) * 100}%` }}
                        />
                      </div>
                      {isWeakest && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Class weakness
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student table */}
        <Card className="border-detective-amber/35">
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              All students who have submitted at least one case
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No submissions yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Submissions</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                    <TableHead className="text-right">
                      Latest Submission
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="font-medium text-detective-amber hover:underline"
                        >
                          {student.name}{student.nickname ? <span className="text-muted-foreground font-normal"> ({student.nickname})</span> : null}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {student.totalSubmissions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.averageScore !== null
                          ? `${student.averageScore.toFixed(1)}/20`
                          : "--"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {student.latestSubmission.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

