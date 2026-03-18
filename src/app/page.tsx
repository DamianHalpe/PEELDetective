import { headers } from "next/headers";
import Link from "next/link";
import { Search, Brain, Award, ChevronRight, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-detective-slate/20 to-transparent dark:from-detective-slate/40 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
            backgroundSize: "100% 3px",
          }}
        />

        <div className="container mx-auto px-4 py-20 md:py-32 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-detective-amber/30 bg-detective-amber/5 px-4 py-1.5 text-xs font-medium text-detective-amber mb-8 tracking-wider uppercase">
            <Search className="h-3 w-3" />
            AI-Powered Detective Writing
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
            <span className="text-foreground">PEEL</span>
            <span className="text-detective-amber"> Detective</span>
          </h1>

          <p className="text-2xl md:text-3xl font-light text-muted-foreground mb-4 tracking-wide">
            Solve the Mystery.{" "}
            <span className="text-foreground font-medium">Master Your Writing.</span>
          </p>

          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-12 leading-relaxed">
            Step into a crime scene, analyse the evidence, and write a structured
            PEEL paragraph to crack the case. Get instant AI feedback on every
            submission.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <Button size="lg" asChild className="gap-2">
                  <Link href="/scenarios">
                    Browse Cases
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/learn">Learn About PEEL</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild className="gap-2">
                  <Link href="/register">
                    Get Started Free
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/scenarios">See How It Works</Link>
                </Button>
              </>
            )}
          </div>

          {/* Decorative magnifying glass */}
          <div className="mt-16 flex justify-center opacity-10">
            <Search className="h-40 w-40 text-detective-amber" strokeWidth={0.5} />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three steps to becoming a master detective writer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="relative rounded-lg border bg-card p-8 group hover:border-detective-amber/40 transition-colors">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-detective-amber/40 to-transparent" />
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-detective-amber/10 mb-5">
              <Search className="h-6 w-6 text-detective-amber" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
              Step 1
            </div>
            <h3 className="text-xl font-semibold mb-3">Solve Mysteries</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dive into rich crime scenarios. Examine suspects, study clues, and
              build your theory before picking up the pen.
            </p>
          </div>

          <div className="relative rounded-lg border bg-card p-8 group hover:border-detective-amber/40 transition-colors">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-detective-amber/40 to-transparent" />
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-detective-amber/10 mb-5">
              <Brain className="h-6 w-6 text-detective-amber" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
              Step 2
            </div>
            <h3 className="text-xl font-semibold mb-3">Get AI Feedback</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Submit your PEEL paragraph and receive instant, element-by-element
              scoring and detailed feedback within seconds.
            </p>
          </div>

          <div className="relative rounded-lg border bg-card p-8 group hover:border-detective-amber/40 transition-colors">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-detective-amber/40 to-transparent" />
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-detective-amber/10 mb-5">
              <Award className="h-6 w-6 text-detective-amber" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
              Step 3
            </div>
            <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Earn badges, accumulate points, and watch your writing improve
              across every case you close.
            </p>
          </div>
        </div>
      </section>

      {/* PEEL Breakdown */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-3">
              <BookOpen className="h-3.5 w-3.5" />
              The Framework
            </div>
            <h2 className="text-3xl font-bold mb-3">The PEEL Method</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each response is scored across four elements — 5 points each,
              20 total. Master all four to crack every case.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              {
                letter: "P",
                name: "Point",
                description:
                  "Clearly state who the culprit is and your main argument.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
              },
              {
                letter: "E",
                name: "Evidence",
                description:
                  "Cite specific clues from the scenario that support your claim.",
                color: "text-detective-amber",
                bg: "bg-detective-amber/10",
                border: "border-detective-amber/20",
              },
              {
                letter: "E",
                name: "Explain",
                description:
                  "Logically connect the evidence to your conclusion.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
              },
              {
                letter: "L",
                name: "Link",
                description:
                  "Tie your argument back to the original question or scenario.",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
              },
            ].map((element) => (
              <div
                key={element.letter + element.name}
                className={`rounded-lg border ${element.border} bg-card p-6`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${element.bg} mb-4 mx-auto`}
                >
                  <span className={`text-2xl font-bold ${element.color}`}>
                    {element.letter}
                  </span>
                </div>
                <h3 className={`text-center font-semibold mb-2 ${element.color}`}>
                  {element.name}
                </h3>
                <p className="text-center text-sm text-muted-foreground leading-relaxed">
                  {element.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="ghost" asChild className="text-muted-foreground gap-1">
              <Link href="/learn">
                Read the full PEEL guide
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-detective-amber/5 border border-detective-amber/20" />
          <div className="relative px-8 py-16">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-detective-amber/10 border border-detective-amber/20 mx-auto mb-6">
              <Shield className="h-7 w-7 text-detective-amber" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Take the Case?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Every great detective starts with their first case. The evidence
              is waiting. The culprit won&apos;t identify themselves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Button size="lg" asChild className="gap-2">
                  <Link href="/scenarios">
                    Open Case Files
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="gap-2">
                    <Link href="/register">
                      Start Investigating
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
