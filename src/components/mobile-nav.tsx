"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavProps {
  showTeacher: boolean;
  showAdmin: boolean;
}

export function MobileNav({ showTeacher, showAdmin }: MobileNavProps) {
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
            className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            Cases
          </Link>
          <Link
            href="/learn"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            PEEL Guide
          </Link>
          {showTeacher && (
            <Link
              href="/teacher"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              Teacher
            </Link>
          )}
          {showAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
