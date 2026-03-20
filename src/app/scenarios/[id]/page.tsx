"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  ArrowLeft,
  FileText,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { GuideCharacter } from "@/components/guide-character";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";

interface Suspect {
  name: string;
  background: string;
}

interface Scenario {
  id: string;
  title: string;
  crimeDescription: string;
  suspects: Suspect[];
  clues: string[];
  difficulty: number;
  published: boolean;
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
    description:
      "Cite specific clues from the scenario that support your claim.",
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
    description:
      "Tie your argument back to the original question or scenario.",
    example: "Therefore, the culprit is... / In conclusion...",
    color: "text-purple-500",
    borderColor: "border-l-purple-500",
  },
];

const evalSteps = [
  { label: "Reading your case report\u2026" },
  { label: "Analysing Point \u2014 who is the culprit?" },
  { label: "Checking Evidence \u2014 clues cited?" },
  { label: "Reviewing Explanation \u2014 logical connection?" },
  { label: "Evaluating Link \u2014 tied back to the question?" },
];

export default function InvestigatePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Scenario loading state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Writing form state
  const [showForm, setShowForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [evalStep, setEvalStep] = useState(0);
  const evalTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchScenario = useCallback(async () => {
    try {
      const res = await fetch(`/api/scenarios/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
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
    void fetchScenario();
  }, [session, isPending, router, fetchScenario]);

  function renderDifficultyStars(difficulty: number) {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < difficulty
            ? "fill-detective-amber text-detective-amber"
            : "text-muted-foreground"
        }`}
      />
    ));
  }

  function handleBeginWriting() {
    setShowForm(true);
    // Allow React to render the form section before scrolling to it
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

      if (res.ok) {
        router.push(`/scenarios/${id}/feedback/${data.id}`);
      } else if (data.submissionId) {
        // Evaluation failed but submission was saved -- go to feedback to show error
        router.push(`/scenarios/${id}/feedback/${data.submissionId}`);
      } else {
        setSubmitError(data.error ?? "Submission failed. Please try again.");
      }
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      if (evalTimer.current) clearInterval(evalTimer.current);
      setSubmitting(false);
      setEvalStep(0);
    }
  }

  // Loading skeleton
  if (isPending || loading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 pb-24">
        <Skeleton className="mb-6 h-5 w-32" />
        <Skeleton className="mb-2 h-9 w-72" />
        <Skeleton className="mb-8 h-4 w-24" />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !scenario) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-lg font-medium">Scenario not found</p>
            <p className="mb-6 text-muted-foreground">
              This case file could not be located. It may have been removed or
              you may not have access.
            </p>
            <Button asChild variant="outline">
              <Link href="/scenarios">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cases
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-5xl p-6 pb-24">
        {/* Back link */}
        <Link
          href="/scenarios"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>

        {/* Title and difficulty */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{scenario.title}</h1>
          <div className="flex items-center gap-1">
            {renderDifficultyStars(scenario.difficulty)}
          </div>
        </div>

        {/* Two-column layout: scenario details */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left panel: narrative content (2/3 width) */}
          <div className="space-y-8 md:col-span-2">
            {/* Crime Scene Briefing */}
            <section>
              <div className="relative mb-3 flex items-center gap-2">
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
                <FileText className="h-4 w-4 text-detective-amber" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  Crime Scene Briefing
                </h2>
                <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
              </div>
              <Card className="border-detective-amber/10 bg-card shadow-sm dark:bg-card">
                <CardContent className="p-5">
                  <div
                    className="leading-relaxed text-card-foreground"
                    dangerouslySetInnerHTML={{ __html: scenario.crimeDescription }}
                  />
                </CardContent>
              </Card>
            </section>

            {/* Suspects */}
            <section>
              <div className="relative mb-3 flex items-center gap-2">
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
                <Users className="h-4 w-4 text-detective-amber" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  Suspects
                </h2>
                <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
              </div>
              <div className="space-y-4">
                {scenario.suspects.map((suspect, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {suspect.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {suspect.background}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Right panel: evidence board (1/3 width) */}
          <div>
            <div className="md:sticky md:top-6">
              <div className="relative mb-3 flex items-center gap-2">
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
                <Search className="h-4 w-4 text-detective-amber" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  Evidence Board
                </h2>
                <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
              </div>
              <div className="space-y-3">
                {scenario.clues.map((clue, index) => (
                  <Card
                    key={index}
                    className="border-border border-l-2 border-l-detective-amber/50"
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-detective-amber/15 text-xs font-bold text-detective-amber">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{clue}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Writing Form Section (inline, shown on demand) ── */}
        {showForm && (
          <div ref={formRef} className="mt-12 scroll-mt-6">
            {/* Section divider */}
            <div className="relative mb-8 flex items-center gap-2">
              <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
              <Send className="h-4 w-4 text-detective-amber" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                Your Case Report
              </h2>
              <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Write your PEEL paragraph to identify the culprit and make your
              case.
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Writing area (2/3) */}
              <div className="space-y-4 md:col-span-2">
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
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
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
                      Evaluating...
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

                {guideOpen && (
                  <div className="space-y-3">
                    {peelElements.map((el) => (
                      <Card
                        key={el.letter + el.name}
                        className={`overflow-hidden border-l-4 ${el.borderColor}`}
                      >
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
        )}
      </div>

      {/* Sticky CTA at bottom — only visible before the form is shown */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 p-4 backdrop-blur">
          <div className="container mx-auto max-w-5xl">
            <Button
              className="w-full"
              size="lg"
              onClick={handleBeginWriting}
            >
              Begin Writing Your Case Report &rarr;
            </Button>
          </div>
        </div>
      )}

      <GuideCharacter />
    </>
  );
}
