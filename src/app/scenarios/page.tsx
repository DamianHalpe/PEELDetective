"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Search, ChevronRight, BookOpen, Trophy, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

interface Scenario {
  id: string;
  title: string;
  crimeDescription: string;
  difficulty: number;
  published: boolean;
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

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
            : "text-muted-foreground/30"
        }`}
      />
    ));
  }

  if (isPending || loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="mb-2 h-9 w-48" />
        <Skeleton className="mb-10 h-5 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
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
      </div>

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
          {scenarios.map((scenario) => {
            const best = bestScores[scenario.id];
            const hasBest = best !== undefined;

            return (
              <Card
                key={scenario.id}
                className="group flex flex-col overflow-hidden hover:border-detective-amber/40 transition-colors"
              >
                {/* Amber accent line */}
                <div className="h-0.5 bg-gradient-to-r from-transparent via-detective-amber/60 to-transparent" />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {renderDifficultyStars(scenario.difficulty)}
                    </div>
                    {hasBest && (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs border-detective-amber/40 text-detective-amber bg-detective-amber/5"
                      >
                        Best: {best}/20
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base leading-snug line-clamp-2">
                    {scenario.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5 flex-1">
                    {scenario.crimeDescription}
                  </p>

                  <Button
                    asChild
                    size="sm"
                    className="w-full gap-1 group-hover:gap-2 transition-all"
                  >
                    <Link href={`/scenarios/${scenario.id}`}>
                      Investigate
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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
