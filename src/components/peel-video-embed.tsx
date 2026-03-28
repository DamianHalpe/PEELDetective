"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PeelVideoEmbedProps {
  videoId: string;
}

export function PeelVideoEmbed({ videoId }: PeelVideoEmbedProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-12 rounded-lg border border-detective-amber/20 bg-detective-amber/5 overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-detective-amber/10"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <PlayCircle className="h-5 w-5 text-detective-amber shrink-0" />
          <div>
            <p className="font-semibold text-sm">Watch: How to Write a PEEL Paragraph</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A short video walkthrough of the PEEL method
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6">
          <div className="relative w-full overflow-hidden rounded-md" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="How to Write a PEEL Paragraph"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            <ChevronUp className="mr-1 h-3 w-3" />
            Hide video
          </Button>
        </div>
      )}
    </div>
  );
}
