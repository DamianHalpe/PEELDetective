"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, ArrowLeft, FileText, Users, Search } from "lucide-react";
import { GuideCharacter } from "@/components/guide-character";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function InvestigatePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

        {/* Two-column layout */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left panel: narrative content (2/3 width) */}
          <div className="space-y-8 md:col-span-2">
            {/* Crime Scene Briefing */}
            <section>
              <div className="mb-3 flex items-center gap-2 relative">
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
                <FileText className="h-4 w-4 text-detective-amber" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  Crime Scene Briefing
                </h2>
                <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
              </div>
              <Card className="border-detective-amber/10 bg-card dark:bg-card shadow-sm">
                <CardContent className="p-5">
                  <p className="leading-relaxed text-card-foreground">
                    {scenario.crimeDescription}
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Suspects */}
            <section>
              <div className="mb-3 flex items-center gap-2 relative">
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
              <div className="mb-3 flex items-center gap-2 relative">
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-detective-amber/40" />
                <Search className="h-4 w-4 text-detective-amber" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-detective-amber">
                  Evidence Board
                </h2>
                <div className="ml-2 h-px flex-1 bg-detective-amber/20" />
              </div>
              <div className="space-y-3">
                {scenario.clues.map((clue, index) => (
                  <Card key={index} className="border-border border-l-2 border-l-detective-amber/50">
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
      </div>

      {/* Sticky CTA at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 p-4 backdrop-blur">
        <div className="container mx-auto max-w-5xl">
          <Button className="w-full" size="lg" asChild>
            <Link href={`/scenarios/${id}/write`}>
              Begin Writing Your Case Report →
            </Link>
          </Button>
        </div>
      </div>

      <GuideCharacter />
    </>
  );
}
