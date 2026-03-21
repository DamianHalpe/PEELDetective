"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";

interface StudentRowActionsProps {
  studentId: string;
  studentName: string;
  isBanned: boolean;
  viewerRole: string;
}

export function StudentRowActions({
  studentId,
  studentName,
  isBanned,
  viewerRole,
}: StudentRowActionsProps) {
  const router = useRouter();
  const [banLoading, setBanLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleBan() {
    setBanLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: !isBanned }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update student status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBanLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete student");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {error && (
        <p className="text-xs text-destructive max-w-[120px] truncate" title={error}>
          {error}
        </p>
      )}

      {/* Deactivate / Reactivate button with confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={isBanned ? "outline" : "destructive"}
            size="icon"
            className="h-8 w-8"
            disabled={banLoading}
            title={isBanned ? "Reactivate account" : "Deactivate account"}
          >
            {banLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBanned ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <ShieldBan className="h-4 w-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBanned ? "Reactivate" : "Deactivate"} {studentName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned
                ? `This will restore ${studentName}'s access to the platform. They will be able to log in and submit responses again.`
                : `This will prevent ${studentName} from accessing the platform. They will be redirected to a suspension notice when they try to use the app.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleBan}
              className={
                isBanned
                  ? ""
                  : "bg-destructive text-white hover:bg-destructive/90"
              }
            >
              {isBanned ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete button - admin only */}
      {viewerRole === "admin" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              disabled={deleteLoading}
              title="Delete account permanently"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Permanently delete {studentName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. All of {studentName}&apos;s
                submissions, badges, and account data will be permanently
                removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
