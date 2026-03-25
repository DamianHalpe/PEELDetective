"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Star,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

interface FeedbackJson {
  point: string;
  evidence: string;
  explain: string;
  link: string;
}

interface Submission {
  id: string;
  status: "pending" | "evaluated" | "failed";
  responseText: string;
  scorePoint: number | null;
  scoreEvidence: number | null;
  scoreExplain: number | null;
  scoreLink: number | null;
  totalScore: number | null;
  teacherOverrideScore: number | null;
  feedbackJson: FeedbackJson | null;
  grammarFlagsJson: string[] | null;
  modelAnswer: string | null;
  submittedAt: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 30000;

const peelElements = [
  { key: "point" as const, label: "Point", letter: "P", scoreKey: "scorePoint" as const },
  { key: "evidence" as const, label: "Evidence", letter: "E", scoreKey: "scoreEvidence" as const },
  { key: "explain" as const, label: "Explain", letter: "E", scoreKey: "scoreExplain" as const },
  { key: "link" as const, label: "Link", letter: "L", scoreKey: "scoreLink" as const },
];

function getScoreColor(score: number): string {
  if (score <= 2) return "bg-red-500";
  if (score <= 4) return "bg-detective-amber";
  return "bg-emerald-500";
}

function getScoreTextColor(score: number): string {
  if (score <= 2) return "text-red-500";
  if (score <= 4) return "text-detective-amber";
  return "text-emerald-500";
}

function getScoreLabel(score: number): string {
  if (score <= 2) return "Needs Work";
  if (score <= 4) return "Developing";
  return "Excellent";
}

/**
 * Animates a number counting up from 0 to the target value over a given duration.
 */
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function ScoreCard({
  letter,
  label,
  score,
  feedback,
  delayIndex = 0,
}: {
  letter: string;
  label: string;
  score: number;
  feedback: string;
  delayIndex?: number;
}) {
  const pct = (score / 5) * 100;
  const barColor = getScoreColor(score);
  const textColor = getScoreTextColor(score);
  const scoreLabel = getScoreLabel(score);

  // Staggered fade-in animation via inline style
  const animationStyle = useMemo(
    () => ({
      opacity: 0,
      animation: `fadeInUp 0.5s ease-out ${delayIndex * 150}ms forwards`,
    }),
    [delayIndex],
  );

  return (
    <Card style={animationStyle}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {letter}
            </span>
            <span>{label}</span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${textColor}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/5</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${textColor} border-current`}
        >
          {scoreLabel}
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {feedback}
        </p>
      </CardContent>
    </Card>
  );
}

function TotalScoreDisplay({ score, max = 20 }: { score: number; max?: number }) {
  const animatedScore = useCountUp(score, 1200);
  const stars = Math.round((score / max) * 5);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold">{animatedScore}</span>
        <span className="text-xl text-muted-foreground">/{max}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-6 w-6 ${
              i < stars
                ? "fill-detective-amber text-detective-amber"
                : "text-muted-foreground/60"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Total Score</p>
    </div>
  );
}

export default function FeedbackPage() {
  const { id, submissionId } = useParams<{ id: string; submissionId: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);

  const pollStart = useRef<number>(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubmission = useCallback(async () => {
    const res = await fetch(`/api/submissions/${submissionId}`);
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    if (res.status === 403) {
      router.push("/subscribe");
      return null;
    }
    if (!res.ok) return null;
    return (await res.json()) as Submission;
  }, [submissionId, router]);

  const startPolling = useCallback(async () => {
    pollStart.current = Date.now();

    async function poll() {
      const data = await fetchSubmission();
      if (!data) {
        setLoading(false);
        return;
      }

      if (data.status !== "pending") {
        setSubmission(data);
        setLoading(false);
        return;
      }

      const elapsed = Date.now() - pollStart.current;
      if (elapsed >= POLL_MAX_MS) {
        setTimedOut(true);
        setLoading(false);
        return;
      }

      pollTimer.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
    }

    await poll();
  }, [fetchSubmission]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    void startPolling();
  }, [session, isPending, router, startPolling]);

  // Loading / polling state
  if (isPending || loading) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Skeleton className="mb-6 h-5 w-32" />
        <Skeleton className="mb-2 h-9 w-56" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="mb-8 flex justify-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-detective-amber" />
            <p className="text-sm text-muted-foreground">
              Evaluating your case report… this takes about 5 seconds.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  // Timed out
  if (timedOut) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Link
          href={`/scenarios/${id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <p className="mb-2 text-lg font-medium">Evaluation is taking longer than expected</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Your response has been saved. Please try refreshing in a moment.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => { setLoading(true); setTimedOut(false); void startPolling(); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" asChild>
                <Link href="/scenarios">Browse Cases</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submission not found
  if (!submission) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Link
          href={`/scenarios/${id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <p className="mb-2 text-lg font-medium">Submission not found</p>
            <p className="mb-6 text-sm text-muted-foreground">
              We couldn&apos;t find this submission. It may have been removed.
            </p>
            <Button variant="outline" asChild>
              <Link href="/scenarios">Browse Cases</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed evaluation — show response but no scores
  if (submission.status === "failed") {
    return (
      <div className="container mx-auto max-w-3xl p-6 pb-24">
        <Link
          href={`/scenarios/${id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Link>

        <div className="mb-2">
          <h1 className="text-3xl font-bold">Case Report Results</h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Here is how your PEEL paragraph was evaluated by the AI detective.
        </p>

        {/* Submitted response */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-detective-amber">
            Your Response
          </h2>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {submission.responseText}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Elegant failure notice */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
              <TriangleAlert className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Feedback unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                The AI evaluator encountered an error and could not generate feedback for this submission. Your response has been saved and your teacher can review it manually.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild size="sm">
                  <Link href={`/scenarios/${id}`}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Try Again
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/scenarios">New Case</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayScore = submission.teacherOverrideScore ?? submission.totalScore ?? 0;
  const grammarFlags = submission.grammarFlagsJson ?? [];

  return (
    <div className="container mx-auto max-w-3xl p-6 pb-24">
      {/* Back link */}
      <Link
        href={`/scenarios/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Case
      </Link>

      {/* Heading */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold">Case Report Results</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Here is how your PEEL paragraph was evaluated by the AI detective.
      </p>

      {/* Submitted response */}
      <section className="mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-detective-amber">
          Your Response
        </h2>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {submission.responseText}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Total score */}
      <Card className="mb-8">
        <CardContent>
          <TotalScoreDisplay score={displayScore} />
          {submission.teacherOverrideScore !== null && (
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Score adjusted by your teacher
            </p>
          )}
        </CardContent>
      </Card>

      {/* PEEL score cards */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-detective-amber">
        PEEL Breakdown
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {peelElements.map((el, index) => {
          const score = submission[el.scoreKey] ?? 0;
          const feedback = submission.feedbackJson?.[el.key] ?? "";
          return (
            <ScoreCard
              key={el.key}
              letter={el.letter}
              label={el.label}
              score={score}
              feedback={feedback}
              delayIndex={index}
            />
          );
        })}
      </div>

      {/* Grammar flags */}
      {grammarFlags.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-detective-amber">
            Writing Notes
          </h2>
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-4">
              {grammarFlags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {flag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Collapsible model answer */}
      {submission.modelAnswer && (
        <section className="mb-8">
          <button
            className="flex w-full items-center justify-between rounded-md border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/80"
            onClick={() => setModelAnswerOpen((v) => !v)}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
              Model Answer
            </span>
            {modelAnswerOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {modelAnswerOpen && (
            <Card className="mt-1 rounded-t-none border-t-0">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {submission.modelAnswer}
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* CTA buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 p-4 backdrop-blur">
        <div className="container mx-auto flex max-w-3xl gap-3">
          <Button className="flex-1" asChild>
            <Link href={`/scenarios/${id}`}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/scenarios">New Case</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/submissions">My Results</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
