"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";

interface Scenario {
  id: string;
  title: string;
  difficulty: number;
}

interface SubmissionResponse {
  id: string;
  status: string;
}

const peelElements = [
  {
    letter: "P",
    name: "Point",
    description: "Clearly state who the culprit is and your main argument.",
    example: "The culprit is [name] because...",
    color: "text-blue-500",
    borderColor: "border-l-blue-500",
  },
  {
    letter: "E",
    name: "Evidence",
    description: "Cite specific clues from the scenario that support your claim.",
    example: "The evidence shows that... / According to the clues...",
    color: "text-detective-amber",
    borderColor: "border-l-detective-amber",
  },
  {
    letter: "E",
    name: "Explain",
    description: "Logically connect the evidence to your conclusion.",
    example: "This proves that... / This shows that...",
    color: "text-emerald-500",
    borderColor: "border-l-emerald-500",
  },
  {
    letter: "L",
    name: "Link",
    description: "Tie your argument back to the original question or scenario.",
    example: "Therefore, the culprit is... / In conclusion...",
    color: "text-purple-500",
    borderColor: "border-l-purple-500",
  },
];

export default function WritePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [evalStep, setEvalStep] = useState(0);
  const evalTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchScenario = useCallback(async () => {
    try {
      const res = await fetch(`/api/scenarios/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as Scenario;
        setScenario(data);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    const userRole = (session.user as { role?: string }).role;
    const userSubscribed = (session.user as { subscribed?: boolean }).subscribed;
    if (userRole === "student" && !userSubscribed) {
      router.push(`/subscribe?from=/scenarios/${id}/write`);
      return;
    }
    void fetchScenario();
  }, [session, isPending, router, fetchScenario, id]);

  const evalSteps = [
    { label: "Reading your case report…", done: false },
    { label: "Analysing Point — who is the culprit?", done: false },
    { label: "Checking Evidence — clues cited?", done: false },
    { label: "Reviewing Explanation — logical connection?", done: false },
    { label: "Evaluating Link — tied back to the question?", done: false },
  ];

  async function handleSubmit() {
    if (!responseText.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setEvalStep(0);
    evalTimer.current = setInterval(() => {
      setEvalStep((s) => Math.min(s + 1, evalSteps.length - 1));
    }, 1100);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id, responseText }),
      });

      const data = (await res.json()) as SubmissionResponse & {
        error?: string;
        submissionId?: string;
      };

      if (res.status === 403 && data.error === "subscription_required") {
        router.push(`/subscribe?from=/scenarios/${id}/write`);
        return;
      }
      if (res.ok) {
        router.push(`/scenarios/${id}/feedback/${data.id}`);
      } else if (data.submissionId) {
        // Evaluation failed but submission was saved — go to feedback to show error
        router.push(`/scenarios/${id}/feedback/${data.submissionId}`);
      } else {
        setSubmitError(data.error ?? "Submission failed. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      if (evalTimer.current) clearInterval(evalTimer.current);
      setSubmitting(false);
      setEvalStep(0);
    }
  }

  if (isPending || loading) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <Skeleton className="mb-6 h-5 w-32" />
        <Skeleton className="mb-8 h-9 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 pb-24">
      {/* Back link */}
      <Link
        href={`/scenarios/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investigation
      </Link>

      {/* Title with detective motif */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber">
          <Send className="h-3.5 w-3.5" />
          Filing a Report
        </div>
        <h1 className="mb-1 text-3xl font-bold">
          {scenario?.title ?? "Write Your Case Report"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Write your PEEL paragraph to identify the culprit and make your case.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Writing area (2/3) */}
        <div className="space-y-4 md:col-span-2">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Send className="h-4 w-4 text-detective-amber" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                Your Case Report
              </h2>
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your PEEL paragraph here. Start with your Point — who is the culprit? Then provide Evidence from the clues, Explain how the evidence proves your case, and Link back to the scenario..."
              className="min-h-[320px] resize-y font-mono text-sm leading-relaxed"
              disabled={submitting}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {responseText.length} characters
            </p>
          </section>

          {submitError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {submitting && (
            <Card className="border-detective-amber/30 bg-card">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-detective-amber" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                    AI Evaluation in Progress
                  </span>
                </div>
                <div className="space-y-2">
                  {evalSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {i < evalStep ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : i === evalStep ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-detective-amber" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                      )}
                      <span
                        className={
                          i <= evalStep
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full shadow-md transition-shadow hover:shadow-lg"
            onClick={handleSubmit}
            disabled={submitting || !responseText.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Case Report
              </>
            )}
          </Button>
        </div>

        {/* PEEL Guide sidebar (1/3) */}
        <div className="md:sticky md:top-6 md:self-start">
          {/* Mobile toggle */}
          <button
            className="mb-3 flex w-full items-center justify-between rounded-md border bg-card px-4 py-2 text-sm font-medium md:hidden"
            onClick={() => setGuideOpen((v) => !v)}
          >
            <span>PEEL Writing Guide</span>
            {guideOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Desktop header */}
          <div className="mb-3 hidden items-center justify-between md:flex">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
              PEEL Guide
            </h2>
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setGuideOpen((v) => !v)}
            >
              {guideOpen ? "Hide" : "Show"}
            </button>
          </div>

          {(guideOpen || typeof window === "undefined") && (
            <div className="space-y-3">
              {peelElements.map((el) => (
                <Card key={el.letter + el.name} className={`overflow-hidden border-l-4 ${el.borderColor}`}>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold ${el.color}`}
                      >
                        {el.letter}
                      </span>
                      {el.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground">
                      {el.description}
                    </p>
                    <p className="rounded bg-muted px-2 py-1 text-xs italic text-muted-foreground">
                      {el.example}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
