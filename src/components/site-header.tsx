"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import { MobileNav } from "@/components/mobile-nav";
import { useSession } from "@/lib/auth-client";
import { ModeToggle } from "./ui/mode-toggle";
import { Folder, BookOpen, LayoutDashboard, ClipboardList, Star, GraduationCap, ShieldCheck } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const subscribed = (session?.user as { subscribed?: boolean })?.subscribed;
  const customTheme = (session?.user as { customTheme?: string | null })?.customTheme;
  const showSubscribe = !!session && role === "student" && !subscribed;

  function linkClass(href: string) {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `px-3 py-1.5 rounded-md transition-colors duration-150 ${
      isActive
        ? "text-foreground bg-muted/80 border-b-2 border-detective-amber"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    }`;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40" role="banner">
        <nav
          className="container mx-auto px-4 py-3 flex justify-between items-center"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="PEEL Detective - Go to homepage"
          >
            {/* Amber magnifying glass icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-detective-amber/20 border border-detective-amber/40 group-hover:bg-detective-amber/25 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-detective-amber">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <span className="font-display text-xl font-bold italic text-foreground group-hover:text-detective-amber transition-colors">
              PEEL<span className="text-detective-amber not-italic font-bold"> Detective</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium" role="group" aria-label="Navigation links">
              {role === "student" && (
                <Link
                  href="/dashboard"
                  className={`${linkClass("/dashboard")} flex items-center gap-1.5`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              )}
              <Link
                href="/scenarios"
                className={`${linkClass("/scenarios")} flex items-center gap-1.5`}
              >
                <Folder className="h-3.5 w-3.5" />
                Cases
              </Link>
              <Link
                href="/learn"
                className={`${linkClass("/learn")} flex items-center gap-1.5`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                PEEL Guide
              </Link>
              {role === "student" && (
                <Link
                  href="/submissions"
                  className={`${linkClass("/submissions")} flex items-center gap-1.5`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  My Results
                </Link>
              )}
              {showSubscribe && (
                <Link
                  href="/subscribe"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-150 ${
                    pathname.startsWith("/subscribe")
                      ? "text-detective-amber font-semibold bg-detective-amber/10"
                      : "text-detective-amber font-semibold hover:text-detective-amber/80 hover:bg-detective-amber/10"
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  Subscribe
                </Link>
              )}
              {(role === "teacher" || role === "admin" || role === "super-admin") && (
                <Link
                  href="/teacher"
                  className={`${linkClass("/teacher")} flex items-center gap-1.5`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Teacher
                </Link>
              )}
              {(role === "admin" || role === "super-admin") && (
                <Link
                  href="/admin"
                  className={`${linkClass("/admin")} flex items-center gap-1.5`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3" role="group" aria-label="User actions">
              <UserProfile />
              <ModeToggle hasCustomTheme={!!customTheme} />
              <MobileNav showTeacher={role === "teacher" || role === "admin" || role === "super-admin"} showAdmin={role === "admin" || role === "super-admin"} showSubscribe={showSubscribe} showDashboard={role === "student"} showSubmissions={role === "student"} />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
