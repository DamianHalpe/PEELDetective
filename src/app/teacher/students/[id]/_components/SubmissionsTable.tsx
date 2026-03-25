"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubmissionRow {
  id: string;
  scenarioTitle: string | null;
  responseText: string;
  scorePoint: number | null;
  scoreEvidence: number | null;
  scoreExplain: number | null;
  scoreLink: number | null;
  totalScore: number | null;
  teacherOverrideScore: number | null;
  status: string;
  submittedAt: Date | string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "evaluated":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
          Evaluated
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function SubmissionsTable({ submissions }: { submissions: SubmissionRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (submissions.length === 0) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        No submissions yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Scenario</TableHead>
          <TableHead className="text-center">P</TableHead>
          <TableHead className="text-center">E</TableHead>
          <TableHead className="text-center">E</TableHead>
          <TableHead className="text-center">L</TableHead>
          <TableHead className="text-center">Total</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((sub) => {
          const isExpanded = expanded.has(sub.id);
          return (
            <>
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  {sub.scenarioTitle ?? "Unknown"}
                </TableCell>
                <TableCell className="text-center">
                  {sub.scorePoint ?? "--"}
                </TableCell>
                <TableCell className="text-center">
                  {sub.scoreEvidence ?? "--"}
                </TableCell>
                <TableCell className="text-center">
                  {sub.scoreExplain ?? "--"}
                </TableCell>
                <TableCell className="text-center">
                  {sub.scoreLink ?? "--"}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {sub.teacherOverrideScore != null
                    ? `${sub.teacherOverrideScore}/20 ✎`
                    : sub.totalScore != null
                      ? `${sub.totalScore}/20`
                      : "--"}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={sub.status} />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggle(sub.id)}
                      aria-label={isExpanded ? "Hide response" : "Show response"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/teacher/submissions/${sub.id}`}>View</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow key={`${sub.id}-response`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={9} className="py-3 px-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Student Response
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {sub.responseText}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
