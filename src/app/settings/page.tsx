"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, KeyRound, Settings, User } from "lucide-react"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { useSession } from "@/lib/auth-client"

export default function SettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [hasCredentialAccount, setHasCredentialAccount] = useState<boolean | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session) return
    fetch("/api/auth/list-accounts", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((accounts: Array<{ providerId: string }> | null) => {
        if (!accounts) {
          setHasCredentialAccount(false)
          return
        }
        setHasCredentialAccount(accounts.some((a) => a.providerId === "credential"))
      })
      .catch(() => setHasCredentialAccount(false))
  }, [session])

  if (isPending || !session) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-detective-amber border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-10" style={{ animation: "fadeInUp 0.5s ease-out both" }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-detective-amber mb-2">
          <Settings className="h-3.5 w-3.5" />
          Account Settings
        </div>
        <h1 className="font-display text-4xl font-bold italic mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      {/* Profile info */}
      <div
        className="rounded-xl border bg-card p-6 mb-6"
        style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Name</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Email</span>
            <span className="font-medium">{session.user.email}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div
        className="rounded-xl border bg-card overflow-hidden"
        style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
      >
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-muted/40 transition-colors"
          onClick={() => setShowChangePassword((v) => !v)}
          disabled={hasCredentialAccount === null}
          aria-expanded={showChangePassword}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-detective-amber/10 border border-detective-amber/20">
              <KeyRound className="h-4 w-4 text-detective-amber" />
            </div>
            <div>
              <p className="font-semibold text-sm">Change Password</p>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>
          {hasCredentialAccount === null ? (
            <div className="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
          ) : hasCredentialAccount ? (
            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${showChangePassword ? "rotate-180" : ""}`} />
          ) : null}
        </button>

        {hasCredentialAccount === false && (
          <div className="px-6 pb-6 pt-0">
            <p className="text-sm text-muted-foreground">
              Your account uses Google sign-in. Password management is handled by Google.
            </p>
          </div>
        )}

        {hasCredentialAccount && showChangePassword && (
          <div className="px-6 pb-6 pt-0 border-t">
            <div className="pt-5">
              <ChangePasswordForm />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
