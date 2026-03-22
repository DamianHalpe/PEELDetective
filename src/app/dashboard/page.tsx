"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Trophy, Target, ChevronRight, Lock, Zap, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

const TIPS = [
  "The best PEEL paragraphs cite specific clues from the crime scene \u2014 not just general observations. Make the examiner feel the evidence.",
  "Your Point should name the culprit in the very first sentence \u2014 don\u2019t make the reader hunt for your answer.",
  "Strong Evidence quotes or paraphrases exact details from the case: times, locations, and objects mentioned in the clues.",
  "The Explain step is where most marks are lost. Don\u2019t just restate the clue \u2014 say why it proves your point.",
  "A strong Link does more than say \u2018in conclusion\u2019 \u2014 it echoes the original question and confirms your verdict.",
  "Re-reading your paragraph aloud helps you catch missing connections between your evidence and your explanation.",
];

/** Pick one tip per calendar day (deterministic rotation). */
const TIP_OF_THE_DAY = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length];

interface DashboardStats {
  points: number;
  submissionCount: number;
  bestScore: number | null;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/submissions")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<
              Array<{
                scenarioId: string;
                totalScore: number | null;
                status: string;
                createdAt: string;
              }>
            >)
          : null
      )
      .then((subs) => {
        if (!subs) return;
        const evaluated = subs.filter(
          (s) => s.status === "evaluated" && s.totalScore !== null
        );
        const bestScore =
          evaluated.length > 0
            ? Math.max(...evaluated.map((s) => s.totalScore!))
            : null;
        setStats({
          points:
            (session.user as { points?: number }).points ?? 0,
          submissionCount: evaluated.length,
          bestScore,
        });
      })
      .catch(() => null);
  }, [session]);

  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-detective-amber border-t-transparent animate-spin" />
          <p className="text-sm">Loading your case files...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Search className="w-16 h-16 mx-auto mb-6 text-detective-amber/80 dark:text-detective-amber/50" />
        <h1 className="font-display text-3xl font-bold italic mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-8">You need to sign in to view your dashboard.</p>
        <Button asChild className="bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "Detective";
  const points = stats?.points ?? (session.user as { points?: number }).points ?? 0;
  const isLoadingStats = stats === null;
  const role = (session.user as { role?: string }).role;
  const subscribed = (session.user as { subscribed?: boolean }).subscribed;
  const showSubscribeBanner = role === "student" && !subscribed;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* ── Subscription banner ─────────────────────────── */}
      {showSubscribeBanner && (
        <div
          className="mb-8 flex items-center gap-4 rounded-xl border-2 border-detective-amber/40 bg-detective-amber/10 px-5 py-4"
          style={{ animation: "fadeInUp 0.4s ease-out both" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-detective-amber/20 border border-detective-amber/30">
            <Lock className="h-4 w-4 text-detective-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Subscribe to unlock the full experience</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A subscription is required to submit case reports and receive AI feedback.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-detective-amber text-black font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
            <Link href="/subscribe">Subscribe Now</Link>
          </Button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="mb-10"
        style={{ animation: "fadeInUp 0.5s ease-out both" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
          <Search className="h-3.5 w-3.5" />
          Detective HQ
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold italic mb-2">
          Welcome back,{" "}
          <span className="text-detective-amber">{firstName}</span>
        </h1>
        <p className="text-muted-foreground">
          The case files are waiting. What will you investigate today?
        </p>
      </div>

      {/* ── Stats Row ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: Trophy,
            label: "Total Points",
            value: points,
            color: "text-detective-amber",
            bg: "bg-detective-amber/10",
            border: "border-detective-amber/20",
          },
          {
            icon: Target,
            label: "Cases Solved",
            value: stats?.submissionCount ?? "\u2014",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
          },
          {
            icon: Star,
            label: "Best Score",
            value: stats?.bestScore != null ? `${stats.bestScore}/20` : "\u2014",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`relative rounded-xl border ${stat.border} bg-card p-5 overflow-hidden`}
            style={{ animation: `fadeInUp 0.5s ease-out ${0.1 + i * 0.08}s both` }}
          >
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${stat.bg} mb-3`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
            </div>
            <div className="mb-1">
              {isLoadingStats ? (
                <Skeleton className="h-7 w-14 rounded" />
              ) : (
                <span className={`font-display text-2xl font-bold italic ${stat.color} leading-none`}>
                  {stat.value}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Actions ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Primary CTA */}
        <div
          className="relative rounded-xl border border-detective-amber/30 bg-detective-amber/5 p-7 overflow-hidden group hover:border-detective-amber/50 transition-all duration-300"
          style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
        >
          <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-detective-amber/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <Search className="w-full h-full text-detective-amber" strokeWidth={0.5} />
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-detective-amber/15 border border-detective-amber/30 mb-4">
            <Search className="h-5 w-5 text-detective-amber" />
          </div>
          <h2 className="font-display text-xl font-bold italic mb-2">Browse Case Files</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            New mysteries are waiting. Choose a case, study the evidence, and write your PEEL response.
          </p>
          <Button asChild className="gap-1.5 group-hover:gap-2.5 transition-all bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold">
            <Link href="/scenarios">
              Open Cases
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Secondary CTA */}
        <div
          className="relative rounded-xl border bg-card p-7 overflow-hidden group hover:border-detective-amber/30 transition-all duration-300"
          style={{ animation: "fadeInUp 0.5s ease-out 0.38s both" }}
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-muted border mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-detective-amber transition-colors" />
          </div>
          <h2 className="font-display text-xl font-bold italic mb-2">PEEL Writing Guide</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Not sure how to structure your answer? The guide breaks down each element with real examples.
          </p>
          <Button asChild variant="outline" className="gap-1.5 group-hover:border-detective-amber/40 transition-all font-semibold">
            <Link href="/learn">
              Read the Guide
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Motivational tip ────────────────────────────── */}
      <div
        className="rounded-xl border border-detective-amber/20 bg-detective-amber/5 px-6 py-4 flex items-center gap-4"
        style={{ animation: "fadeInUp 0.5s ease-out 0.45s both" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-detective-amber/15 shrink-0">
          <Zap className="h-4 w-4 text-detective-amber" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Tip:</span>{" "}{TIP_OF_THE_DAY}
        </p>
      </div>
    </div>
  );
}
