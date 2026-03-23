"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";

const STYLE_ID = "peel-custom-theme-style";

/** Convert a hex color to its WCAG relative luminance (0–1). */
function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Return a foreground hex that has sufficient contrast against `bg`.
 * `muted` returns a slightly softer variant for secondary text.
 */
function contrastFg(bg: string, muted = false): string {
  const lum = luminance(bg);
  if (muted) return lum > 0.179 ? "#555555" : "#aaaaaa";
  return lum > 0.179 ? "#1a1a1a" : "#f5f5f5";
}

function buildStyleContent(theme: { background: string; card: string; accent: string }) {
  const fgOnBg = contrastFg(theme.background);
  const fgOnCard = contrastFg(theme.card);
  const fgOnAccent = contrastFg(theme.accent);
  const mutedFg = contrastFg(theme.background, true);

  return `:root {
  --background: ${theme.background};
  --foreground: ${fgOnBg};
  --card: ${theme.card};
  --card-foreground: ${fgOnCard};
  --popover: ${theme.card};
  --popover-foreground: ${fgOnCard};
  --muted: ${theme.background};
  --muted-foreground: ${mutedFg};
  --detective-amber: ${theme.accent};
  --primary: ${theme.accent};
  --primary-foreground: ${fgOnAccent};
  --ring: ${theme.accent};
}`;
}

function applyCustomTheme(theme: { background: string; card: string; accent: string } | null) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!theme) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildStyleContent(theme);
}

export function CustomThemeApplier() {
  const { data: session, isPending } = useSession();
  const { setTheme } = useTheme();
  // undefined = not yet resolved; null = logged out; string = user id
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Fast path: apply from localStorage on mount so returning users see their
  // theme immediately before the session round-trip completes.
  useEffect(() => {
    (window as Window & { __applyCustomTheme?: typeof applyCustomTheme }).__applyCustomTheme =
      applyCustomTheme;

    function applyFromStorage() {
      const pref = localStorage.getItem("peel-theme-preference");
      const raw = localStorage.getItem("peel-custom-theme");
      if (pref === "custom" && raw) {
        try {
          applyCustomTheme(JSON.parse(raw));
        } catch {
          applyCustomTheme(null);
        }
      } else {
        applyCustomTheme(null);
      }
    }

    applyFromStorage();
    window.addEventListener("peel-theme-change", applyFromStorage);
    return () => window.removeEventListener("peel-theme-change", applyFromStorage);
  }, []);

  // Session sync: runs whenever auth state resolves or changes.
  useEffect(() => {
    if (isPending) return;

    const currentUserId = session?.user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Skip if nothing has changed (same user id, or still the same logged-out state).
    if (prevUserId !== undefined && prevUserId === currentUserId) return;
    prevUserIdRef.current = currentUserId;

    if (currentUserId === null) {
      // ── Logged out ── clear everything and revert to system theme.
      localStorage.removeItem("peel-custom-theme");
      localStorage.removeItem("peel-theme-preference");
      applyCustomTheme(null);
      setTheme("system");
      window.dispatchEvent(new Event("peel-theme-change"));
    } else {
      // ── Logged in ── overwrite localStorage with this user's DB values.
      const user = session!.user as {
        customTheme?: string | null;
        themePreference?: string | null;
      };
      const pref = user.themePreference ?? "system";
      const raw = user.customTheme ?? null;

      localStorage.setItem("peel-theme-preference", pref);
      if (raw) {
        localStorage.setItem("peel-custom-theme", raw);
      } else {
        localStorage.removeItem("peel-custom-theme");
      }

      if (pref === "custom" && raw) {
        try {
          applyCustomTheme(JSON.parse(raw));
          setTheme("light"); // light is the base for custom overrides
        } catch {
          applyCustomTheme(null);
          setTheme("system");
        }
      } else {
        applyCustomTheme(null);
        setTheme((pref === "custom" ? "system" : pref) as "light" | "dark" | "system");
      }
      window.dispatchEvent(new Event("peel-theme-change"));
    }
  }, [session, isPending, setTheme]);

  return null;
}
