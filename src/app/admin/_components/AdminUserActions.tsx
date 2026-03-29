"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
import { EditUserDialog } from "./EditUserDialog";

interface AdminUserActionsProps {
  userId: string;
  userName: string;
  userRole: string;
  isBanned: boolean;
  viewerRole?: string | undefined;
}

export function AdminUserActions({ userId, userName, userRole, isBanned, viewerRole }: AdminUserActionsProps) {
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Failed to delete user");
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

      <EditUserDialog
        userId={userId}
        userName={userName}
        userRole={userRole}
        isBanned={isBanned}
        viewerRole={viewerRole}
      />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            disabled={deleteLoading}
            title="Delete user permanently"
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
            <AlertDialogTitle>Permanently delete {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All of {userName}&apos;s submissions, badges,
              and account data will be permanently removed.
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
    </div>
  );
}
