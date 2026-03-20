import { headers } from "next/headers";
import Link from "next/link";
import { Search, Brain, Award, ChevronRight, Shield, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b min-h-[80vh] flex items-center">
        {/* Layered atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-br from-detective-slate/30 via-background to-detective-amber/5 dark:from-detective-slate/60 dark:via-background dark:to-detective-amber/10 pointer-events-none" />

        {/* Radial glow behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-detective-amber/8 dark:bg-detective-amber/12 rounded-full blur-3xl pointer-events-none" />

        {/* Scan-line texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
            backgroundSize: "100% 3px",
          }}
        />

        {/* Decorative corner brackets */}
        <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-detective-amber/30 rounded-tl-sm hidden md:block" />
        <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-detective-amber/30 rounded-tr-sm hidden md:block" />
        <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-detective-amber/30 rounded-bl-sm hidden md:block" />
        <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-detective-amber/30 rounded-br-sm hidden md:block" />

        <div className="container mx-auto px-4 py-20 md:py-32 text-center relative">
          {/* Animated badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border border-detective-amber/40 bg-detective-amber/8 px-5 py-2 text-xs font-semibold text-detective-amber mb-10 tracking-widest uppercase"
            style={{ animation: "fadeIn 0.6s ease-out both" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-detective-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-detective-amber"></span>
            </span>
            AI-Powered Detective Writing
          </div>

          {/* Main headline with display font */}
          <h1
            className="font-display text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[0.9]"
            style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
          >
            <span className="block text-foreground">PEEL</span>
            <span className="block italic text-detective-amber" style={{
              textShadow: "0 0 60px oklch(0.75 0.18 75 / 0.3)"
            }}>
              Detective
            </span>
          </h1>

          <p
            className="text-xl md:text-2xl font-light text-muted-foreground mb-4 tracking-wide"
            style={{ animation: "fadeInUp 0.7s ease-out 0.2s both" }}
          >
            Crack the case.{" "}
            <span className="text-foreground font-medium">Ace the writing.</span>
          </p>

          <p
            className="max-w-xl mx-auto text-muted-foreground mb-12 leading-relaxed"
            style={{ animation: "fadeInUp 0.7s ease-out 0.3s both" }}
          >
            Step into a real crime scene, analyse the evidence, and write a structured
            PEEL paragraph to identify the culprit. Get instant AI feedback on every submission.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: "fadeInUp 0.7s ease-out 0.4s both" }}
          >
            {isLoggedIn ? (
              <>
                <Button
                  size="lg"
                  asChild
                  className="gap-2 bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 animate-pulse-glow font-semibold text-base px-8"
                >
                  <Link href="/scenarios">
                    Open Case Files
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-semibold text-base px-8 border-detective-amber/30 hover:border-detective-amber/60 hover:bg-detective-amber/5">
                  <Link href="/learn">PEEL Guide</Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  asChild
                  className="gap-2 bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 animate-pulse-glow font-semibold text-base px-8"
                >
                  <Link href="/register">
                    Start Investigating — Free
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-semibold text-base px-8 border-detective-amber/30 hover:border-detective-amber/60 hover:bg-detective-amber/5">
                  <Link href="/scenarios">See the Cases</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats strip */}
          <div
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
            style={{ animation: "fadeIn 0.7s ease-out 0.6s both" }}
          >
            {[
              { value: "20 pts", label: "Max score per case" },
              { value: "4", label: "PEEL elements scored" },
              { value: "AI", label: "Instant feedback" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="font-display text-2xl font-bold text-detective-amber italic">{stat.value}</span>
                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-3">
            <Zap className="h-3.5 w-3.5" />
            The Process
          </div>
          <h2 className="font-display text-4xl font-bold italic mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three steps from crime scene to case closed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Search,
              step: "01",
              title: "Investigate",
              description: "Dive into a rich crime scenario. Study suspects, examine clues, and form your theory before you write a single word.",
            },
            {
              icon: Brain,
              step: "02",
              title: "Write & Submit",
              description: "Craft your PEEL paragraph naming the culprit with evidence, explanation, and a strong linking conclusion.",
            },
            {
              icon: Award,
              step: "03",
              title: "Level Up",
              description: "Receive element-by-element AI scoring in seconds. Earn points, unlock badges, and climb the leaderboard.",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="relative rounded-xl border bg-card p-8 group hover:border-detective-amber/50 transition-all duration-300 hover:shadow-lg hover:shadow-detective-amber/5 overflow-hidden"
              style={{ animation: `fadeInUp 0.6s ease-out ${0.1 + i * 0.12}s both` }}
            >
              {/* Top amber line */}
              <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-detective-amber/60 to-transparent" />

              {/* Step number watermark */}
              <div className="absolute top-4 right-5 font-display text-6xl font-bold italic text-detective-amber/20 dark:text-detective-amber/8 leading-none select-none pointer-events-none">
                {item.step}
              </div>

              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-detective-amber/10 border border-detective-amber/20 mb-5 group-hover:bg-detective-amber/15 transition-colors">
                <item.icon className="h-6 w-6 text-detective-amber" />
              </div>

              <div className="text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
                Step {item.step}
              </div>
              <h3 className="font-display text-xl font-bold italic mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PEEL Breakdown ────────────────────────────────── */}
      <section className="border-y bg-detective-slate/5 dark:bg-detective-slate/20">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-3">
              <Target className="h-3.5 w-3.5" />
              The Framework
            </div>
            <h2 className="font-display text-4xl font-bold italic mb-3">The PEEL Method</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each response is scored across four elements — 5 points each, 20 total.
              Master all four to close every case.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              {
                letter: "P",
                name: "Point",
                description: "Clearly state who the culprit is and your main argument.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/30",
                glow: "hover:shadow-blue-500/10",
              },
              {
                letter: "E",
                name: "Evidence",
                description: "Cite specific clues from the scenario that support your claim.",
                color: "text-detective-amber",
                bg: "bg-detective-amber/10",
                border: "border-detective-amber/30",
                glow: "hover:shadow-detective-amber/10",
              },
              {
                letter: "E",
                name: "Explain",
                description: "Logically connect the evidence to your conclusion.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/30",
                glow: "hover:shadow-emerald-500/10",
              },
              {
                letter: "L",
                name: "Link",
                description: "Tie your argument back to the original question or scenario.",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                border: "border-purple-500/30",
                glow: "hover:shadow-purple-500/10",
              },
            ].map((element) => (
              <div
                key={element.letter + element.name}
                className={`rounded-xl border ${element.border} bg-card p-6 text-center hover:shadow-lg ${element.glow} transition-all duration-300 group`}
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full ${element.bg} mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className={`font-display text-3xl font-bold italic ${element.color}`}>
                    {element.letter}
                  </span>
                </div>
                <h3 className={`font-semibold mb-2 ${element.color}`}>{element.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{element.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="ghost" asChild className="text-muted-foreground gap-1 hover:text-detective-amber">
              <Link href="/learn">
                Read the full PEEL guide
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="relative max-w-2xl mx-auto">
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-2xl bg-detective-amber/5 blur-xl" />

          <div className="relative rounded-2xl border border-detective-amber/25 bg-card overflow-hidden">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-detective-amber to-transparent" />

            <div className="px-8 py-16">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-detective-amber/15 border border-detective-amber/30 mx-auto mb-6 animate-float">
                <Shield className="h-8 w-8 text-detective-amber" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold italic mb-4">
                Ready to Take<br />the Case?
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
                Every great detective starts with their first case.
                The evidence is waiting. The culprit won&apos;t identify themselves.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoggedIn ? (
                  <Button size="lg" asChild className="gap-2 bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold text-base px-8">
                    <Link href="/scenarios">
                      Open Case Files
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="gap-2 bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold text-base px-8">
                      <Link href="/register">
                        Start Investigating
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="font-semibold text-base px-8 border-detective-amber/30 hover:border-detective-amber/60">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
