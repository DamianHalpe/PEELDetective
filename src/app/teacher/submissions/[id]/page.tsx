import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { ScoreOverrideForm } from "@/components/score-override-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export const metadata = { title: "Submission Detail" };

type PageProps = { params: Promise<{ id: string }> };

interface FeedbackData {
  point?: string;
  evidence?: string;
  explain?: string;
  link?: string;
}

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

function ScoreCard({
  label,
  score,
  feedback,
}: {
  label: string;
  score: number | null;
  feedback: string | undefined;
}) {
  return (
    <div className="rounded-lg border border-detective-amber/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-lg font-bold">
          {score != null ? `${score}/5` : "--"}
        </span>
      </div>
      {feedback && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feedback}
        </p>
      )}
    </div>
  );
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin" && role !== "super-admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Fetch submission with student and scenario info
  const [result] = await db
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
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      scenarioTitle: schema.scenario.title,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.id, id));

  if (!result) {
    redirect("/teacher");
  }

  const feedback = (result.feedbackJson ?? {}) as FeedbackData;
  const grammarFlags = (result.grammarFlagsJson ?? []) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/teacher/scenarios/${result.scenarioId}/submissions`}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Submission Detail
            </h1>
            <p className="text-sm text-muted-foreground">
              {result.scenarioTitle ?? "Unknown Scenario"} &mdash;{" "}
              {result.studentName ?? "Unknown Student"}{result.studentNickname ? <span className="text-muted-foreground font-normal"> ({result.studentNickname})</span> : null}
            </p>
          </div>
        </div>

        {/* Status and date */}
        <div className="flex items-center gap-4">
          <StatusBadge status={result.status} />
          <span className="text-sm text-muted-foreground">
            Submitted{" "}
            {new Date(result.submittedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {result.teacherOverrideScore != null && (
            <Badge
              variant="outline"
              className="border-detective-amber/50 text-detective-amber"
            >
              Override: {result.teacherOverrideScore}/20
            </Badge>
          )}
        </div>

        {/* Student response */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle>Student Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4">
              {result.responseText}
            </div>
          </CardContent>
        </Card>

        {/* PEEL Score breakdown */}
        {result.status === "evaluated" && (
          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle>
                PEEL Score Breakdown
                <span className="ml-2 text-detective-amber">
                  {result.totalScore != null ? `${result.totalScore}/20` : ""}
                </span>
              </CardTitle>
              <CardDescription>
                Individual scores and AI feedback for each PEEL component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScoreCard
                  label="Point"
                  score={result.scorePoint}
                  feedback={feedback.point}
                />
                <ScoreCard
                  label="Evidence"
                  score={result.scoreEvidence}
                  feedback={feedback.evidence}
                />
                <ScoreCard
                  label="Explain"
                  score={result.scoreExplain}
                  feedback={feedback.explain}
                />
                <ScoreCard
                  label="Link"
                  score={result.scoreLink}
                  feedback={feedback.link}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grammar flags */}
        {grammarFlags.length > 0 && (
          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle>Grammar Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {grammarFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Model answer */}
        {result.modelAnswer && (
          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle>Model Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4">
                {result.modelAnswer}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Score override form */}
        <ScoreOverrideForm
          submissionId={result.id}
          currentOverrideScore={result.teacherOverrideScore}
          currentOverrideNote={result.teacherOverrideNote}
        />
      </div>
    </div>
  );
}
