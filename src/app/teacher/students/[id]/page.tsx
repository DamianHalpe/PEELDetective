import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, CreditCard, History, Mail, Trophy, FileText, Download } from "lucide-react";
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
import { StudentActionsBar } from "./_components/StudentActionsBar";
import { SubmissionsTable } from "./_components/SubmissionsTable";

export const metadata = { title: "Student Detail" };

type PageProps = { params: Promise<{ id: string }> };

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
      responseText: schema.submission.responseText,
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

  // Fetch subscription history for this student
  const subscriptionHistory = await db
    .select({
      id: schema.subscriptionHistory.id,
      action: schema.subscriptionHistory.action,
      changedByRole: schema.subscriptionHistory.changedByRole,
      amount: schema.subscriptionHistory.amount,
      periodEnd: schema.subscriptionHistory.periodEnd,
      createdAt: schema.subscriptionHistory.createdAt,
      changedByName: schema.user.name,
    })
    .from(schema.subscriptionHistory)
    .leftJoin(schema.user, eq(schema.subscriptionHistory.changedById, schema.user.id))
    .where(eq(schema.subscriptionHistory.userId, student.id))
    .orderBy(desc(schema.subscriptionHistory.createdAt));

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {student.name}
                </h1>
                {student.banned && (
                  <Badge variant="destructive">DEACTIVATED</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3.5 w-3.5" />
                {student.email}
              </div>
              {student.nickname && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">&ldquo;{student.nickname}&rdquo;</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StudentActionsBar
              studentId={id}
              studentName={student.name}
              isBanned={student.banned ?? false}
              isSubscribed={student.subscribed ?? false}
              viewerRole={role}
            />
            <Button variant="outline" asChild>
              <a href={`/api/export?type=student&studentId=${id}`} download>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
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
            <SubmissionsTable submissions={submissions} />
          </CardContent>
        </Card>

        {/* Subscription History */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-detective-amber" />
              Subscription History
            </CardTitle>
            <CardDescription>
              A log of all subscription changes for this student
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <CreditCard className="h-8 w-8 opacity-30" />
                <p className="text-sm">No subscription events recorded.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {event.action === "activated" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                            Activated
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700">
                            Revoked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.changedByRole === "student"
                          ? "Student (self)"
                          : event.changedByName
                            ? `${event.changedByName} (${event.changedByRole})`
                            : `Unknown (${event.changedByRole})`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.amount != null && event.amount > 0
                          ? `$${(event.amount / 100).toFixed(2)}`
                          : <span className="text-muted-foreground">Manual</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.periodEnd
                          ? new Date(event.periodEnd).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : <span>&mdash;</span>}
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
