"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

function DeleteSubmissionButton({ submissionId, onDeleted }: { submissionId: string; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Delete submission"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete submission?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this submission and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SubmissionsTable({ submissions }: { submissions: SubmissionRow[] }) {
  const router = useRouter();
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
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => toggle(sub.id)}
                      aria-label={isExpanded ? "Hide response" : "Show response"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label="View submission"
                      asChild
                    >
                      <Link href={`/teacher/submissions/${sub.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <DeleteSubmissionButton
                      submissionId={sub.id}
                      onDeleted={() => router.refresh()}
                    />
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
