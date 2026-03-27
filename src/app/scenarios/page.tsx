"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Search, ChevronRight, BookOpen, Trophy, Crown, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

interface Scenario {
  id: string;
  title: string;
  crimeDescription: string;
  difficulty: number;
  published: boolean;
  freeToView: boolean;
}

interface Submission {
  scenarioId: string;
  totalScore: number | null;
  status: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  totalSubmissions: number;
}

export default function ScenariosPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const userRole = (session?.user as { role?: string })?.role;
  const userSubscribed = (session?.user as { subscribed?: boolean })?.subscribed ?? false;
  const isStudentUnsubscribed = userRole === "student" && !userSubscribed;

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [scenariosRes, submissionsRes, leaderboardRes] = await Promise.all([
        fetch("/api/scenarios"),
        fetch("/api/submissions"),
        fetch("/api/leaderboard"),
      ]);

      if (scenariosRes.status === 401) {
        router.push("/login");
        return;
      }

      if (scenariosRes.ok) {
        const data = (await scenariosRes.json()) as Scenario[];
        setScenarios(data);
      }

      if (submissionsRes.ok) {
        const subs = (await submissionsRes.json()) as Submission[];
        // Compute personal best per scenario
        const bests: Record<string, number> = {};
        for (const sub of subs) {
          if (sub.status === "evaluated" && sub.totalScore !== null) {
            const current = bests[sub.scenarioId] ?? -1;
            if (sub.totalScore > current) {
              bests[sub.scenarioId] = sub.totalScore;
            }
          }
        }
        setBestScores(bests);
      }

      if (leaderboardRes.ok) {
        const lb = (await leaderboardRes.json()) as LeaderboardEntry[];
        setLeaderboard(lb);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    void fetchData();
  }, [session, isPending, router, fetchData]);

  function renderDifficultyStars(difficulty: number) {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < difficulty
            ? "fill-detective-amber text-detective-amber"
            : "text-muted-foreground/50"
        }`}
      />
    ));
  }

  if (isPending || loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="mb-2 h-9 w-48 animate-shimmer" />
        <Skeleton className="mb-10 h-5 w-72 animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
          <Search className="h-3.5 w-3.5" />
          Case Files
        </div>
        <h1 className="text-4xl font-bold mb-2">Active Cases</h1>
        <p className="text-muted-foreground">
          Choose a mystery to investigate. Write your PEEL response and get
          instant AI feedback.
        </p>
        {!loading && scenarios.length > 0 && (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {Object.keys(bestScores).length} of {scenarios.length} cases solved
            </p>
            <div className="mt-2 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
                style={{ width: `${Object.keys(bestScores).length && scenarios.length ? Math.round((Object.keys(bestScores).length / scenarios.length) * 100) : 0}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Difficulty filter */}
      {scenarios.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          {([null, 1, 2, 3] as const).map((level) => (
            <Button
              key={level ?? "all"}
              size="sm"
              variant={filterDifficulty === level ? "default" : "outline"}
              className={`transition-colors duration-150 ${
                filterDifficulty === level
                  ? "bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90"
                  : ""
              }`}
              onClick={() => setFilterDifficulty(level)}
            >
              {level === null ? "All" : "★".repeat(level)}
            </Button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {scenarios.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No cases available yet</p>
          <p className="text-muted-foreground text-sm">
            Check back soon — your teacher is preparing new mysteries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios
            .filter((s) => filterDifficulty === null || s.difficulty === filterDifficulty)
            .map((scenario, index) => {
            const best = bestScores[scenario.id];
            const hasBest = best !== undefined;
            const isLocked = isStudentUnsubscribed && !scenario.freeToView;

            return (
              <div
                key={scenario.id}
                className={`group relative rounded-xl border bg-card overflow-hidden hover:border-detective-amber/50 hover:shadow-lg hover:shadow-detective-amber/5 transition-all duration-200 hover:rotate-0 hover:-translate-y-1 flex flex-col ${index % 2 !== 0 ? "rotate-[-0.5deg]" : ""} ${hasBest ? "border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-500/30" : ""} ${isLocked ? "opacity-80" : ""}`}
              >
                {/* Amber top bar */}
                <div className="h-1 bg-gradient-to-r from-detective-amber/60 via-detective-amber to-detective-amber/60" />

                {/* Case number watermark */}
                <div className="absolute top-3 right-4 font-display text-7xl font-bold italic text-detective-amber/25 dark:text-detective-amber/10 leading-none select-none pointer-events-none">
                  {(index + 1).toString().padStart(2, "0")}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {renderDifficultyStars(scenario.difficulty)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isStudentUnsubscribed && scenario.freeToView && (
                        <span className="shrink-0 inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          Free
                        </span>
                      )}
                      {hasBest ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold border border-detective-amber/60 text-detective-amber bg-detective-amber/12 rounded-full px-2.5 py-0.5 animate-tick-in">
                          ✓ {best}/20
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center text-xs text-foreground/60 border border-border rounded-full px-2.5 py-0.5">
                          Unsolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold italic leading-snug line-clamp-2 mb-2">
                    {scenario.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5 flex-1">
                    {scenario.crimeDescription.replace(/<[^>]+>/g, "")}
                  </p>

                  {/* CTA */}
                  {isLocked ? (
                    <Button
                      asChild
                      size="sm"
                      className="w-full gap-1.5 transition-all bg-muted text-muted-foreground font-semibold hover:bg-muted/80"
                    >
                      <Link href={`/subscribe?from=/scenarios/${scenario.id}`}>
                        <Lock className="h-3.5 w-3.5" />
                        Subscribe to Investigate
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="w-full gap-1.5 group-hover:gap-2.5 transition-all bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold"
                    >
                      <Link href={`/scenarios/${scenario.id}`}>
                        {hasBest && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                        {hasBest ? "Re-investigate" : "Investigate"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard section */}
      {leaderboard.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber">
            <Trophy className="h-3.5 w-3.5" />
            Top Detectives
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        entry.rank === 1
                          ? "bg-detective-amber/20 text-detective-amber"
                          : entry.rank === 2
                            ? "bg-muted text-foreground"
                            : entry.rank === 3
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.rank === 1 ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : (
                        entry.rank
                      )}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {entry.name}
                    </span>
                    <span className="text-sm font-bold text-detective-amber">
                      {entry.points} pts
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.totalSubmissions}{" "}
                      {entry.totalSubmissions === 1 ? "case" : "cases"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
