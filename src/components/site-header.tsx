import { headers } from "next/headers";
import Link from "next/link";
import { Search } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { auth } from "@/lib/auth";
import { ModeToggle } from "./ui/mode-toggle";

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string })?.role;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="border-b" role="banner">
        <nav
          className="container mx-auto px-4 py-4 flex justify-between items-center"
          aria-label="Main navigation"
        >
          <h1 className="text-2xl font-bold">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              aria-label="PEEL Detective - Go to homepage"
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10"
                aria-hidden="true"
              >
                <Search className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PEEL Detective
              </span>
            </Link>
          </h1>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium" role="group" aria-label="Navigation links">
              <Link href="/scenarios" className="text-muted-foreground hover:text-foreground transition-colors">
                Scenarios
              </Link>
              <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                Learn
              </Link>
              {(role === "teacher" || role === "admin") && (
                <Link href="/teacher" className="text-muted-foreground hover:text-foreground transition-colors">
                  Teacher Dashboard
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4" role="group" aria-label="User actions">
              <UserProfile />
              <ModeToggle />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
