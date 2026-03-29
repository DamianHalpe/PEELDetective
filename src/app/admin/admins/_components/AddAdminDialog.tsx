"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
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

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const empty: FormState = { name: "", email: "", password: "" };

export function AddAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Valid email is required";
    }
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    return e;
  }

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setServerError(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      if (res.ok) {
        setForm(empty);
        setErrors({});
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setServerError((data as { error?: string }).error ?? "Something went wrong");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setForm(empty);
          setErrors({});
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-detective-amber text-white hover:bg-detective-amber/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>
            Create an admin account with full administrative access. They can log in immediately with the provided credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="admin-name">Full Name <span className="text-detective-crimson">*</span></Label>
            <Input
              id="admin-name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange("name")}
              disabled={loading}
            />
            {errors.name && <p className="text-xs text-detective-crimson">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-email">Email <span className="text-detective-crimson">*</span></Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="jane@school.edu"
              value={form.email}
              onChange={handleChange("email")}
              disabled={loading}
            />
            {errors.email && <p className="text-xs text-detective-crimson">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-password">Password <span className="text-detective-crimson">*</span></Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange("password")}
              disabled={loading}
            />
            {errors.password && <p className="text-xs text-detective-crimson">{errors.password}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-detective-crimson bg-detective-crimson/10 rounded px-3 py-2">
              {serverError}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-detective-amber text-white hover:bg-detective-amber/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
