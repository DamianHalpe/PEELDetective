"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Folder, BookOpen, LayoutDashboard, ClipboardList, Star, GraduationCap, ShieldCheck } from "lucide-react";

interface MobileNavProps {
  showTeacher: boolean;
  showAdmin: boolean;
  showSubscribe?: boolean;
  showDashboard?: boolean;
  showSubmissions?: boolean;
}

export function MobileNav({ showTeacher, showAdmin, showSubscribe, showDashboard, showSubmissions }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 border-b bg-background/95 backdrop-blur p-4 space-y-1 md:hidden z-50">
          <Link
            href="/scenarios"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <Folder className="h-4 w-4" />
            Cases
          </Link>
          <Link
            href="/learn"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <BookOpen className="h-4 w-4" />
            PEEL Guide
          </Link>
          {showDashboard && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          {showSubmissions && (
            <Link
              href="/submissions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              My Results
            </Link>
          )}
          {showSubscribe && (
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-detective-amber hover:text-detective-amber/80 hover:bg-detective-amber/10 transition-all"
            >
              <Star className="h-4 w-4" />
              Subscribe
            </Link>
          )}
          {showTeacher && (
            <Link
              href="/teacher"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <GraduationCap className="h-4 w-4" />
              Teacher
            </Link>
          )}
          {showAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
