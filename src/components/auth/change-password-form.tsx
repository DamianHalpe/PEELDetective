"use client"

import { useState } from "react"
import { Check, X, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/auth-client"
import { PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/password-validation"

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password)
        return (
          <li key={req.label} className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-500" : "text-muted-foreground"}`}>
            {met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
            {req.label}
          </li>
        )
      })}
    </ul>
  )
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    const pwError = validatePassword(newPassword)
    if (pwError) {
      setError(pwError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password")
      return
    }

    setIsPending(true)

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (result.error) {
        setError(result.error.message || "Failed to change password")
      } else {
        setSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 shrink-0 mt-0.5">
          <Check className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Password changed successfully</p>
          <p className="text-xs text-muted-foreground mt-0.5">Other active sessions have been signed out for your security.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isPending}
        />
        <PasswordRequirements password={newPassword} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        type="submit"
        className="bg-detective-amber text-white dark:text-detective-slate hover:bg-detective-amber/90 font-semibold"
        disabled={isPending}
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {isPending ? "Changing password..." : "Change password"}
      </Button>
    </form>
  )
}
