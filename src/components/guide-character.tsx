"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

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
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex items-end gap-3 max-w-xs"
      style={{ animation: "scaleIn 0.4s ease-out both" }}
    >
      {/* Speech bubble */}
      <div
        className={`relative rounded-lg border bg-card p-3 text-sm text-card-foreground shadow-md transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="leading-relaxed">{hints[hintIndex]}</p>
        {/* Bubble tail pointing right toward the detective */}
        <div className="absolute -right-2 bottom-3 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-border" />
      </div>

      {/* Guide icon with ping ring */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-detective-amber/20 animate-ping" aria-hidden="true" />
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-detective-amber/20 text-detective-amber">
          <Bot className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
