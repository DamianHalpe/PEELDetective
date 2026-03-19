"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ScoreOverrideFormProps {
  submissionId: string;
  currentOverrideScore: number | null;
  currentOverrideNote: string | null;
}

export function ScoreOverrideForm({
  submissionId,
  currentOverrideScore,
  currentOverrideNote,
}: ScoreOverrideFormProps) {
  const [score, setScore] = useState<string>(
    currentOverrideScore != null ? String(currentOverrideScore) : ""
  );
  const [note, setNote] = useState<string>(currentOverrideNote ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    const scoreNum = parseInt(score, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 20) {
      setStatus("error");
      setErrorMessage("Score must be a number between 0 and 20.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherOverrideScore: scoreNum,
          teacherOverrideNote: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to update");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-detective-amber/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Score Override
          {currentOverrideScore != null && (
            <Badge
              variant="outline"
              className="border-detective-amber/50 text-detective-amber"
            >
              Current: {currentOverrideScore}/20
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="override-score">Override Score (0-20)</Label>
            <Input
              id="override-score"
              type="number"
              min={0}
              max={20}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
              required
              className="max-w-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="override-note">Note (optional)</Label>
            <Textarea
              id="override-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for the score override..."
              rows={3}
            />
          </div>

          {status === "success" && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Score override saved successfully.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Override"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
