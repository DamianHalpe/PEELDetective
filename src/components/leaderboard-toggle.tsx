"use client";

import { useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LeaderboardToggleProps {
  initialEnabled: boolean;
}

export function LeaderboardToggle({ initialEnabled }: LeaderboardToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    setEnabled(checked);
    startTransition(async () => {
      try {
        const res = await fetch("/api/teacher/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaderboardEnabled: checked }),
        });
        if (!res.ok) {
          setEnabled(!checked);
        }
      } catch {
        setEnabled(!checked);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-detective-amber/20 bg-detective-amber/5 px-4 py-2.5">
      <Trophy className="h-4 w-4 text-detective-amber shrink-0" />
      <Label htmlFor="leaderboard-toggle" className="text-sm font-medium cursor-pointer select-none">
        Student Leaderboard
      </Label>
      <Switch
        id="leaderboard-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="ml-auto data-[state=checked]:bg-detective-amber"
      />
    </div>
  );
}
