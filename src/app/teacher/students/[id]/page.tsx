import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, Mail, Trophy, FileText, Download } from "lucide-react";
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

export const metadata = { title: "Student Detail" };

type PageProps = { params: Promise<{ id: string }> };

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "evaluated":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
          Evaluated
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

/**
 * Renders a simple SVG sparkline showing score trend for the last N submissions.
 * Each bar represents one submission's effective score out of 20.
 */
function ScoreSparkline({
  scores,
}: {
  scores: (number | null)[];
}) {
  // Filter to only numeric scores and take the last 10
  const numericScores = scores
    .filter((s): s is number => s !== null)
    .slice(-10);

  if (numericScores.length < 2) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Not enough data for trend
      </p>
    );
  }

  const maxScore = 20;
  const width = 200;
  const height = 60;
  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  // Build SVG polyline points
  const points = numericScores
    .map((score, i) => {
      const x =
        padding + (i / (numericScores.length - 1)) * usableWidth;
      const y =
        padding + usableHeight - (score / maxScore) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
      aria-label="Score trend sparkline"
    >
      {/* Grid line at 50% (score 10) */}
      <line
        x1={padding}
        y1={padding + usableHeight / 2}
        x2={width - padding}
        y2={padding + usableHeight / 2}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeDasharray="4 2"
      />
      {/* The trend line */}
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.75 0.18 75)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots at each data point */}
      {numericScores.map((score, i) => {
        const x =
          padding + (i / (numericScores.length - 1)) * usableWidth;
        const y =
          padding + usableHeight - (score / maxScore) * usableHeight;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill="oklch(0.75 0.18 75)"
          />
        );
      })}
    </svg>
  );
}

export default async function StudentDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Fetch student info
  const [student] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id));

  if (!student) {
    redirect("/teacher");
  }

  // Fetch submissions with scenario titles
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
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, id))
    .orderBy(desc(schema.submission.submittedAt));

  const evaluatedSubmissions = submissions.filter(
    (s) => s.status === "evaluated"
  );

  const scores = evaluatedSubmissions.map(
    (s) => s.teacherOverrideScore ?? s.totalScore
  );

  const numericScores = scores.filter((s): s is number => s !== null);
  const averageScore =
    numericScores.length > 0
      ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(
          1
        )
      : "--";

  // For sparkline, we want chronological order (oldest first)
  const chronologicalScores = [...scores].reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {student.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3.5 w-3.5" />
                {student.email}
              </div>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href={`/api/export?type=student&studentId=${id}`} download>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-detective-amber/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/10 p-2">
                  <Trophy className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{student.points}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/10 p-2">
                  <FileText className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Submissions
                  </p>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/10 p-2">
                  <Trophy className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {averageScore !== "--" ? `${averageScore}/20` : averageScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score trend sparkline */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>
              Performance across the last 10 evaluated submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreSparkline scores={chronologicalScores} />
          </CardContent>
        </Card>

        {/* Submission history table */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.scenarioTitle ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub.scorePoint ?? "--"}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub.scoreEvidence ?? "--"}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub.scoreExplain ?? "--"}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub.scoreLink ?? "--"}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {sub.totalScore != null ? `${sub.totalScore}/20` : "--"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/teacher/submissions/${sub.id}`}>
                            View
                          </Link>
                        </Button>
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
