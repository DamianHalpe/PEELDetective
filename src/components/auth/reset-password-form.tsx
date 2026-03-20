"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/auth-client"
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

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const error = searchParams.get("error")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [isPending, setIsPending] = useState(false)

  if (error === "invalid_token" || !token) {
    return (
      <div className="space-y-4 w-full max-w-sm text-center">
        <p className="text-sm text-destructive">
          {error === "invalid_token"
            ? "This password reset link is invalid or has expired."
            : "No reset token provided."}
        </p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full">
            Request a new link
          </Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    const pwError = validatePassword(password)
    if (pwError) {
      setFormError(pwError)
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    setIsPending(true)

    try {
      const result = await resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setFormError(result.error.message || "Failed to reset password")
      } else {
        router.push("/login?reset=success")
      }
    } catch {
      setFormError("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
        />
        <PasswordRequirements password={password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      {formError && (
        <p className="text-sm text-destructive">{formError}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  )
}
