"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditUserDialogProps {
  userId: string;
  userName: string;
  userRole: string;
  isBanned: boolean;
  viewerRole?: string;
}

export function EditUserDialog({ userId, userName, userRole, isBanned, viewerRole }: EditUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userName);
  const [role, setRole] = useState(userRole);
  const [banned, setBanned] = useState(isBanned);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role, banned }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Failed to update user");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setResetLoading(true);
    setResetMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Failed to send reset link");
      }
      setResetMessage("Reset link generated — check server logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResetLoading(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      setName(userName);
      setRole(userRole);
      setBanned(isBanned);
      setError(null);
      setResetMessage(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="Edit user">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update account details for {userName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="edit-user-name">Full Name</Label>
            <Input
              id="edit-user-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-user-role">Role</Label>
            <select
              id="edit-user-role"
              value={role}
              onChange={(e) => { setRole(e.target.value); setError(null); }}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              {viewerRole === "super-admin" && <option value="admin">Admin</option>}
              {viewerRole === "super-admin" && <option value="super-admin">Super Admin</option>}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="edit-user-banned"
              type="checkbox"
              checked={banned}
              onChange={(e) => { setBanned(e.target.checked); setError(null); }}
              disabled={loading}
              className="h-4 w-4 rounded border-input accent-detective-crimson"
            />
            <Label htmlFor="edit-user-banned" className="cursor-pointer font-normal">
              Suspend account (prevents login)
            </Label>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password Reset</p>
                <p className="text-xs text-muted-foreground">Generates a reset link (logged to console)</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={resetLoading || loading}
              >
                {resetLoading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-3 w-3" />
                )}
                Send Reset Link
              </Button>
            </div>
            {resetMessage && (
              <p className="text-xs text-green-600 dark:text-green-400">{resetMessage}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-detective-crimson bg-detective-crimson/10 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-detective-amber text-white hover:bg-detective-amber/90"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
