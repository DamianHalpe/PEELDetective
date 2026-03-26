import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 via-background to-amber-50/30 dark:from-detective-slate dark:via-background dark:to-detective-slate/40 px-4 py-12">
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-detective-amber/8 blur-3xl dark:bg-detective-amber/5" />
      </div>

      {/* Logo above card */}
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2.5 group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-detective-amber/20 border border-detective-amber/40 group-hover:bg-detective-amber/30 transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-detective-amber"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <span className="font-display text-xl font-bold italic text-foreground group-hover:text-detective-amber transition-colors">
          PEEL<span className="not-italic text-detective-amber">Detective</span>
        </span>
      </Link>

      {/* Card wrapper with animation */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{ animation: "scaleIn 0.3s ease-out both" }}
      >
        <div className="rounded-2xl border border-detective-amber/20 bg-background shadow-2xl shadow-detective-amber/10 dark:bg-card">
          {children}
        </div>
      </div>
    </div>
  );
}
