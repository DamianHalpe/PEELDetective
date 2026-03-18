"use client";

import { useEffect, useState } from "react";

const hints = [
  "Study the crime scene carefully, detective...",
  "Every clue tells a story — what do they have in common?",
  "Look at the suspects — who had motive and opportunity?",
  "Connect the evidence to build your case.",
  "A good detective considers ALL the clues.",
  "Remember: your PEEL paragraph is your case report.",
];

export function GuideCharacter() {
  const [hintIndex, setHintIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap hint, fade back in
      setVisible(false);
      setTimeout(() => {
        setHintIndex((prev) => (prev + 1) % hints.length);
        setVisible(true);
      }, 400);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-end gap-3 max-w-xs">
      {/* Speech bubble */}
      <div
        className={`relative rounded-lg border bg-card p-3 text-sm text-card-foreground shadow-md transition-opacity duration-400 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="leading-relaxed">{hints[hintIndex]}</p>
        {/* Bubble tail pointing right toward the detective */}
        <div className="absolute -right-2 bottom-3 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-border" />
      </div>

      {/* Detective silhouette */}
      <div className="shrink-0 text-detective-amber">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20"
          aria-hidden="true"
        >
          {/* Hat brim */}
          <ellipse cx="40" cy="28" rx="22" ry="4" fill="currentColor" />
          {/* Hat crown */}
          <rect
            x="24"
            y="10"
            width="32"
            height="20"
            rx="4"
            fill="currentColor"
          />
          {/* Face */}
          <circle cx="40" cy="42" r="12" fill="currentColor" />
          {/* Body */}
          <path
            d="M20 80 C20 60 28 54 40 54 C52 54 60 60 60 80"
            fill="currentColor"
          />
          {/* Magnifying glass */}
          <circle
            cx="62"
            cy="58"
            r="8"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
          <line
            x1="68"
            y1="64"
            x2="76"
            y2="72"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
