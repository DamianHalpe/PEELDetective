import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export const metadata = { title: "Scenario Submissions" };

type PeelAggregate = {
  avgPoint: number;
  avgEvidence: number;
  avgExplain: number;
  avgLink: number;
};

function PeelAggregatePanel({
  aggregate,
  evaluatedCount,
}: {
  aggregate: PeelAggregate;
  evaluatedCount: number;
}) {
  const elements: { label: string; key: keyof PeelAggregate; full: string }[] =
    [
      { label: "P", key: "avgPoint", full: "Point" },
      { label: "E", key: "avgEvidence", full: "Evidence" },
      { label: "E", key: "avgExplain", full: "Explain" },
      { label: "L", key: "avgLink", full: "Link" },
    ];

  const MIN_VAL = Math.min(
    aggregate.avgPoint,
    aggregate.avgEvidence,
    aggregate.avgExplain,
    aggregate.avgLink
  );

  return (
    <Card className="border-detective-amber/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Class PEEL Averages</CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on {evaluatedCount} evaluated submission
          {evaluatedCount !== 1 ? "s" : ""}. Each element scored out of 5.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {elements.map(({ label, key, full }) => {
            const avg = aggregate[key];
            const pct = (avg / 5) * 100;
            const isWeakest = avg === MIN_VAL;
            return (
              <div key={key} className="space-y-1.5">
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
                    style={{ width: `${pct}%` }}
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
  );
}

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

export default async function ScenarioSubmissionsPage({
  params,
}: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Fetch the scenario
  const [scenarioRecord] = await db
    .select()
    .from(schema.scenario)
    .where(eq(schema.scenario.id, id));

  if (!scenarioRecord) {
    redirect("/teacher/scenarios");
  }

  // Fetch submissions with student info
  const submissions = await db
    .select({
      id: schema.submission.id,
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
    .where(eq(schema.submission.scenarioId, id))
    .orderBy(desc(schema.submission.submittedAt));

  // Compute per-element class averages from evaluated submissions
  const evaluated = submissions.filter((s) => s.status === "evaluated");
  const evalCount = evaluated.length;
  const aggregate =
    evalCount > 0
      ? {
          avgPoint:
            evaluated.reduce((sum, s) => sum + (s.scorePoint ?? 0), 0) /
            evalCount,
          avgEvidence:
            evaluated.reduce((sum, s) => sum + (s.scoreEvidence ?? 0), 0) /
            evalCount,
          avgExplain:
            evaluated.reduce((sum, s) => sum + (s.scoreExplain ?? 0), 0) /
            evalCount,
          avgLink:
            evaluated.reduce((sum, s) => sum + (s.scoreLink ?? 0), 0) /
            evalCount,
        }
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Back nav + title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher/scenarios">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {scenarioRecord.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {submissions.length} submission
                {submissions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href={`/api/export?type=scenario&scenarioId=${id}`} download>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>

        {/* PEEL Aggregate Stats */}
        {aggregate && (
          <PeelAggregatePanel aggregate={aggregate} evaluatedCount={evalCount} />
        )}

        {/* Submissions table */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No submissions yet for this scenario.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Override</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.studentName ?? "Unknown"}{sub.studentNickname ? <span className="text-muted-foreground"> ({sub.studentNickname})</span> : null}
                        <span className="block text-xs text-muted-foreground">
                          {sub.studentEmail}
                        </span>
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
                        {sub.teacherOverrideScore != null ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="cursor-help border-detective-amber/50 text-detective-amber"
                              >
                                {sub.teacherOverrideScore}/20
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {sub.teacherOverrideNote || "No note provided"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
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
