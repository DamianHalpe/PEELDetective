"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
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
  Lightbulb,
  User,
  X,
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
  imageUrl?: string;
}

interface Scenario {
  id: string;
  title: string;
  crimeDescription: string;
  suspects: Suspect[];
  clues: string[];
  difficulty: number;
  published: boolean;
  freeToView: boolean;
}

interface SubmissionResponse {
  id: string;
  status: string;
}

type PanelId = "briefing" | "suspects" | "evidence";

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

const panelDefs: { id: PanelId; label: string; Icon: typeof FileText }[] = [
  { id: "briefing", label: "Crime Scene Briefing", Icon: FileText },
  { id: "suspects", label: "Suspects", Icon: Users },
  { id: "evidence", label: "Evidence Board", Icon: Search },
];

export default function InvestigatePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Scenario loading state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string>("");

  // Writing form state
  const [showForm, setShowForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [evalStep, setEvalStep] = useState(0);
  const evalTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  // Sliding panels state — ordered array of up to 2 open panel IDs
  const [openPanels, setOpenPanels] = useState<PanelId[]>([]);

  function togglePanel(panelId: PanelId) {
    setOpenPanels((prev) => {
      if (prev.includes(panelId)) {
        return prev.filter((p) => p !== panelId);
      }
      if (prev.length >= 2) {
        // Evict the oldest (index 0), add new at end
        return [prev[1]!, panelId];
      }
      return [...prev, panelId];
    });
  }

  function getPanelTransform(panelId: PanelId): string {
    const idx = openPanels.indexOf(panelId);
    if (idx === -1) return "translate-x-full";
    // Older panel (index 0 when 2 panels open): shift left on desktop, overlap on mobile
    if (idx === 0 && openPanels.length === 2) return "sm:-translate-x-[480px]";
    return "translate-x-0";
  }

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
        const userRole = (session?.user as { role?: string })?.role;
        const userSubscribed = (session?.user as { subscribed?: boolean })?.subscribed;
        if (userRole === "student" && !userSubscribed && !data.freeToView) {
          router.push(`/subscribe?from=/scenarios/${id}`);
          return;
        }
        setScenario(data);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router, session]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    void fetchScenario();
  }, [session, isPending, router, fetchScenario]);

  // Fetch personal best score for this scenario
  useEffect(() => {
    if (!session || isPending) return;
    fetch("/api/submissions")
      .then((r) => (r.ok ? (r.json() as Promise<Array<{ scenarioId: string; totalScore: number | null; status: string }>>) : null))
      .then((subs) => {
        if (!subs) return;
        const evaluated = subs.filter((s) => s.scenarioId === id && s.status === "evaluated" && s.totalScore !== null);
        if (evaluated.length > 0) {
          setBestScore(Math.max(...evaluated.map((s) => s.totalScore!)));
        }
      })
      .catch(() => null);
  }, [session, isPending, id]);

  function renderDifficultyStars(difficulty: number) {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < difficulty
            ? "fill-detective-amber text-detective-amber"
            : "text-muted-foreground/60"
        }`}
      />
    ));
  }

  function handleBeginWriting() {
    const userRole = (session?.user as { role?: string })?.role;
    const userSubscribed = (session?.user as { subscribed?: boolean })?.subscribed;
    if (userRole === "student" && !userSubscribed) {
      router.push(`/subscribe?from=/scenarios/${id}`);
      return;
    }
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

      if (res.status === 403 && data.error === "subscription_required") {
        router.push(`/subscribe?from=/scenarios/${id}`);
        return;
      }
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderDifficultyStars(scenario.difficulty)}
            </div>
            {bestScore !== null && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                <Star className="h-3 w-3 fill-current" /> Your best: {bestScore}/20
              </span>
            )}
          </div>
        </div>

        {/* Two-column layout: scenario details — hidden once writing starts */}
        {!showForm && (
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
                  <div className="ml-2 h-px flex-1 bg-detective-amber/35" />
                </div>
                <Card className="border-detective-amber/25 bg-card shadow-sm dark:bg-card">
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
                  <div className="ml-2 h-px flex-1 bg-detective-amber/35" />
                </div>
                <div className="space-y-4">
                  {scenario.suspects.map((suspect, index) => (
                    <Card key={index} className="hover:border-detective-amber/50 transition-colors duration-200">
                      <CardContent className="p-4 flex gap-4 items-start">
                        {/* Suspect thumbnail */}
                        {suspect.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxUrl(suspect.imageUrl!);
                              setLightboxName(suspect.name);
                            }}
                            className="shrink-0 w-20 h-20 rounded overflow-hidden border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-detective-amber"
                            aria-label={`View full photo of ${suspect.name}`}
                          >
                            <Image
                              src={suspect.imageUrl}
                              alt={suspect.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="shrink-0 w-20 h-20 rounded border border-border bg-muted flex items-center justify-center">
                            <User className="h-7 w-7 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-base leading-snug mb-1">
                            {suspect.name}
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {suspect.background}
                          </p>
                        </div>
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
                  <div className="ml-2 h-px flex-1 bg-detective-amber/35" />
                </div>
                <div className="space-y-3">
                  {scenario.clues.map((clue, index) => (
                    <Card
                      key={index}
                      className="border border-detective-amber/30 rounded-lg bg-amber-50/60 dark:bg-amber-950/20"
                    >
                      <CardContent className="flex items-start gap-3 p-3">
                        <Lightbulb className="h-4 w-4 shrink-0 text-detective-amber" />
                        <p className="text-sm leading-relaxed">{clue}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Writing Form Section (full-width, shown on demand) ── */}
        {showForm && (
          <div ref={formRef} className="scroll-mt-6">
            {/* Section divider */}
            <div className="relative mb-6 flex items-center gap-2">
              <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
              <Send className="h-4 w-4 text-detective-amber" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                Your Case Report
              </h2>
              <div className="ml-2 h-px flex-1 bg-detective-amber/35" />
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Write your PEEL paragraph to identify the culprit and make your
              case. Open any panel below to review the briefing, suspects, or
              evidence.
            </p>

            {/* Info panel toolbar */}
            <div className="mb-5 flex flex-wrap gap-2">
              {panelDefs.map(({ id: panelId, label, Icon }) => {
                const isOpen = openPanels.includes(panelId);
                return (
                  <button
                    key={panelId}
                    type="button"
                    onClick={() => togglePanel(panelId)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-detective-amber ${
                      isOpen
                        ? "border-detective-amber bg-detective-amber/10 text-detective-amber"
                        : "border-border bg-card text-muted-foreground hover:border-detective-amber/50 hover:text-foreground"
                    }`}
                    aria-pressed={isOpen}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Full-width writing area */}
            <div className="space-y-4">
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your PEEL paragraph here. Start with your Point — who is the culprit? Then provide Evidence from the clues, Explain how the evidence proves your case, and Link back to the scenario..."
                className="min-h-[360px] w-full resize-y text-base leading-relaxed focus-visible:ring-detective-amber/40 focus-visible:border-detective-amber"
                disabled={submitting}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {(() => {
                  const wc = responseText.trim() === "" ? 0 : responseText.trim().split(/\s+/).length;
                  return (
                    <>
                      {wc} words &middot; {responseText.length} chars
                      {wc > 0 && wc < 50 && (
                        <span className="ml-2 text-detective-amber/80">
                          &mdash; aim for 80&ndash;150 words for a complete response
                        </span>
                      )}
                    </>
                  );
                })()}
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
                                : "text-muted-foreground/70"
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

            {/* PEEL Guide — below the writing area */}
            <div className="mt-8">
              {/* Toggle header */}
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  PEEL Writing Guide
                </h2>
                <button
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
                  onClick={() => setGuideOpen((v) => !v)}
                >
                  {guideOpen ? (
                    <>Hide <ChevronLeft className="h-3 w-3" /></>
                  ) : (
                    <>Show <ChevronRight className="h-3 w-3" /></>
                  )}
                </button>
              </div>

              {guideOpen && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                        <p className="rounded border border-border bg-muted px-2 py-1 text-xs italic text-muted-foreground">
                          {el.example}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA at bottom — only visible before the form is shown */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 dark:bg-background/95 py-4 px-4 backdrop-blur">
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

      {/* Sliding info panels — rendered for all 3, animated in/out */}
      {showForm && panelDefs.map(({ id: panelId, label, Icon }) => {
        const isOpen = openPanels.includes(panelId);
        const transformClass = getPanelTransform(panelId);

        return (
          <div
            key={panelId}
            className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-2xl border-l transition-transform duration-300 ease-in-out sm:w-[480px] ${transformClass}`}
            aria-hidden={!isOpen}
          >
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-detective-amber" />
                <span className="text-sm font-semibold uppercase tracking-widest text-detective-amber">
                  {label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => togglePanel(panelId)}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-detective-amber"
                aria-label={`Close ${label} panel`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-5">
              {panelId === "briefing" && (
                <div
                  className="leading-relaxed text-card-foreground"
                  dangerouslySetInnerHTML={{ __html: scenario.crimeDescription }}
                />
              )}

              {panelId === "suspects" && (
                <div className="space-y-4">
                  {scenario.suspects.map((suspect, index) => (
                    <Card key={index} className="hover:border-detective-amber/50 transition-colors duration-200">
                      <CardContent className="p-4 flex gap-4 items-start">
                        {suspect.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxUrl(suspect.imageUrl!);
                              setLightboxName(suspect.name);
                            }}
                            className="shrink-0 w-20 h-20 rounded overflow-hidden border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-detective-amber"
                            aria-label={`View full photo of ${suspect.name}`}
                          >
                            <Image
                              src={suspect.imageUrl}
                              alt={suspect.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="shrink-0 w-20 h-20 rounded border border-border bg-muted flex items-center justify-center">
                            <User className="h-7 w-7 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-base leading-snug mb-1">
                            {suspect.name}
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {suspect.background}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {panelId === "evidence" && (
                <div className="space-y-3">
                  {scenario.clues.map((clue, index) => (
                    <Card
                      key={index}
                      className="border border-detective-amber/30 rounded-lg bg-amber-50/60 dark:bg-amber-950/20"
                    >
                      <CardContent className="flex items-start gap-3 p-3">
                        <Lightbulb className="h-4 w-4 shrink-0 text-detective-amber" />
                        <p className="text-sm leading-relaxed">{clue}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Suspect image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${lightboxName}`}
          tabIndex={-1}
        >
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              className="absolute -top-10 right-0 text-white border-white/30 bg-white/10 hover:bg-white/20"
              onClick={() => setLightboxUrl(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
            <div className="overflow-hidden rounded-lg border border-white/20 shadow-2xl aspect-square">
              <Image
                src={lightboxUrl}
                alt={lightboxName}
                width={512}
                height={512}
                className="w-full h-full object-cover"
              />
            </div>
            {lightboxName && (
              <p className="mt-3 text-center text-sm font-medium text-white/80">
                {lightboxName}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
