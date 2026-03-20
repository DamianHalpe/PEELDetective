"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AtSign, Check, ChevronDown, KeyRound, Loader2, Settings, User, X } from "lucide-react"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { useSession } from "@/lib/auth-client"

function NicknameForm({ currentNickname }: { currentNickname?: string | null | undefined }) {
  const { refetch } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(currentNickname ?? "")
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "saving" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const debounceRef = { current: undefined as ReturnType<typeof setTimeout> | undefined }

  const validate = (v: string) => /^[a-zA-Z0-9_-]{3,30}$/.test(v)

  useEffect(() => {
    if (!isEditing) return
    if (value === "" || value === (currentNickname ?? "")) {
      setStatus("idle")
      return
    }
    if (!validate(value)) {
      setStatus("idle")
      return
    }
    setStatus("checking")
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/nickname-check?nickname=${encodeURIComponent(value)}`)
        const data = await res.json()
        setStatus(data.available ? "available" : "taken")
      } catch {
        setStatus("idle")
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEditing])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (status === "taken" || status === "saving") return
    setStatus("saving")
    setErrorMsg("")
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong")
        setStatus("error")
        return
      }
      await refetch()
      setStatus("saved")
      setIsEditing(false)
      setTimeout(() => setStatus("idle"), 2000)
    } catch {
      setErrorMsg("Something went wrong")
      setStatus("error")
    }
  }

  function handleCancel() {
    setValue(currentNickname ?? "")
    setStatus("idle")
    setErrorMsg("")
    setIsEditing(false)
  }

  const isDirty = value !== (currentNickname ?? "")
  const isInvalid = value !== "" && !validate(value)

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="nickname" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Username
          </label>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-detective-amber hover:text-detective-amber/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            id="nickname"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="choose a username"
            maxLength={30}
            readOnly={!isEditing}
            className={`w-full pl-8 pr-10 py-2 text-sm rounded-lg border bg-background transition-colors ${isEditing ? "focus:outline-none focus:ring-2 focus:ring-detective-amber/40 focus:border-detective-amber" : "cursor-default select-none text-muted-foreground"}`}
          />
          {isEditing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {status === "checking" && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
              {status === "available" && <Check className="h-3.5 w-3.5 text-green-500" />}
              {status === "taken" && <X className="h-3.5 w-3.5 text-destructive" />}
            </div>
          )}
          {!isEditing && status === "saved" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-3.5 w-3.5 text-green-500" />
            </div>
          )}
        </div>
        {isEditing && isInvalid && (
          <p className="text-xs text-destructive">3–30 characters: letters, numbers, _ or -</p>
        )}
        {isEditing && status === "taken" && (
          <p className="text-xs text-destructive">That username is already taken</p>
        )}
        {isEditing && status === "error" && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}
        {isEditing && status === "available" && (
          <p className="text-xs text-green-600 dark:text-green-400">Username is available</p>
        )}
        {status === "saved" && (
          <p className="text-xs text-green-600 dark:text-green-400">Username saved!</p>
        )}
      </div>
      {isEditing && (
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!isDirty || isInvalid || status === "taken" || status === "saving" || status === "checking"}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-detective-amber text-black hover:bg-detective-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-1.5 text-sm font-medium rounded-lg border hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}

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
        <div className="mt-5 pt-5 border-t">
          <NicknameForm currentNickname={(session.user as { nickname?: string | null }).nickname} />
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
