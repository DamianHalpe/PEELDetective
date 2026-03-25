"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  GraduationCap,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

interface SubmissionRow {
  id: string;
  scenarioId: string;
  scorePoint: number | null;
  scoreEvidence: number | null;
  scoreExplain: number | null;
  scoreLink: number | null;
  totalScore: number | null;
  teacherOverrideScore: number | null;
  status: string;
  submittedAt: string;
  scenarioTitle: string | null;
}

/** Color class for a total score out of 20. */
function totalScoreColor(score: number): string {
  if (score <= 8) return "text-red-500 border-red-500/40 bg-red-500/10";
  if (score <= 14)
    return "text-detective-amber border-detective-amber/40 bg-detective-amber/10";
  return "text-emerald-500 border-emerald-500/40 bg-emerald-500/10";
}

/** Color class for an individual PEEL score out of 5. */
function peelScoreColor(score: number): string {
  if (score <= 2) return "text-red-500 bg-red-500/10";
  if (score <= 4) return "text-detective-amber bg-detective-amber/10";
  return "text-emerald-500 bg-emerald-500/10";
}

/** Human-readable status label and styling. */
function statusBadge(status: string) {
  switch (status) {
    case "evaluated":
      return { label: "Evaluated", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" };
    case "pending":
      return { label: "Pending", cls: "bg-detective-amber/10 text-detective-amber border-detective-amber/30" };
    case "failed":
      return { label: "Failed", cls: "bg-red-500/10 text-red-500 border-red-500/30" };
    default:
      return { label: status, cls: "bg-muted text-muted-foreground" };
  }
}

/** Format a date string as "25 Mar 2026". */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubmissionsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);

  // Redirect unauthenticated users once session loading finishes
  if (!isPending && !session) {
    router.push("/login");
  }

  // Fetch submissions once session is available
  useEffect(() => {
    if (!session) return;
    fetch("/api/submissions")
      .then((r) => (r.ok ? (r.json() as Promise<SubmissionRow[]>) : null))
      .then((data) => {
        if (!data) {
          setSubmissions([]);
          return;
        }
        // Sort by submittedAt descending (newest first)
        const sorted = data.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        );
        setSubmissions(sorted);
      })
      .catch(() => setSubmissions([]));
  }, [session]);

  // Loading state
  if (isPending || !session || submissions === null) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="mb-1 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-80" />
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        style={{ animation: "fadeInUp 0.4s ease-out both" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div
        className="mb-10"
        style={{ animation: "fadeInUp 0.5s ease-out both" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
          <ClipboardList className="h-3.5 w-3.5" />
          Case Report History
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold italic mb-2">
          Case Report <span className="text-detective-amber">History</span>
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">
            Review your previous submissions and track your progress.
          </p>
          <Badge
            variant="outline"
            className="shrink-0 border-detective-amber/40 text-detective-amber text-xs"
          >
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 && (
        <div
          className="text-center py-20"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
        >
          <Search className="w-16 h-16 mx-auto mb-6 text-detective-amber/80 dark:text-detective-amber/50" />
          <h2 className="font-display text-2xl font-bold italic mb-3">
            No Case Reports Yet
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You haven&apos;t submitted any case reports yet. Browse the available
            cases and write your first PEEL response.
          </p>
          <Button
            asChild
            className="bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold"
          >
            <Link href="/scenarios">Browse Cases</Link>
          </Button>
        </div>
      )}

      {/* Submission cards */}
      <div className="space-y-4">
        {submissions.map((sub, i) => {
          const status = statusBadge(sub.status);
          const total =
            sub.teacherOverrideScore ?? sub.totalScore ?? 0;
          const isEvaluated = sub.status === "evaluated";
          const hasTeacherOverride = sub.teacherOverrideScore !== null;

          return (
            <div
              key={sub.id}
              className="relative rounded-xl border bg-card p-5 overflow-hidden hover:border-detective-amber/30 transition-all duration-300"
              style={{
                animation: `fadeInUp 0.5s ease-out ${0.1 + i * 0.06}s both`,
              }}
            >
              {/* Top accent line for evaluated submissions */}
              {isEvaluated && (
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-detective-amber/40 to-transparent" />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: scenario info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-display text-lg font-bold italic truncate">
                      {sub.scenarioTitle ?? "Unknown Case"}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] leading-tight shrink-0 ${status.cls}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Submitted {formatDate(sub.submittedAt)}
                  </p>

                  {/* PEEL breakdown pills — only for evaluated submissions */}
                  {isEvaluated && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: "P", score: sub.scorePoint },
                        { label: "E", score: sub.scoreEvidence },
                        { label: "E", score: sub.scoreExplain },
                        { label: "L", score: sub.scoreLink },
                      ].map((peel, j) => {
                        const score = peel.score ?? 0;
                        return (
                          <span
                            key={j}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${peelScoreColor(score)}`}
                          >
                            {peel.label}: {score}/5
                          </span>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Right: score + action */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2 shrink-0">
                  {isEvaluated && (
                    <>
                      <div
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-bold ${totalScoreColor(total)}`}
                      >
                        {total}/20
                        {hasTeacherOverride && (
                          <GraduationCap className="h-3.5 w-3.5 ml-0.5" />
                        )}
                      </div>
                    </>
                  )}
                  <Button
                    asChild
                    variant={isEvaluated ? "default" : "outline"}
                    size="sm"
                    className={
                      isEvaluated
                        ? "bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold gap-1.5"
                        : "gap-1.5"
                    }
                  >
                    <Link
                      href={`/scenarios/${sub.scenarioId}/feedback/${sub.id}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Feedback
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
