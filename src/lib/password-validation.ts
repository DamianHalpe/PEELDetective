export interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least one number", test: (p) => /[0-9]/.test(p) },
  { label: "At least one special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function validatePassword(password: string): string | null {
  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.test(password)) {
      return `Password must contain: ${req.label.toLowerCase()}`
    }
  }
  return null
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  if (passed <= 1) return { score: passed, label: "Very weak", color: "bg-red-500" }
  if (passed === 2) return { score: passed, label: "Weak", color: "bg-orange-500" }
  if (passed === 3) return { score: passed, label: "Fair", color: "bg-yellow-500" }
  if (passed === 4) return { score: passed, label: "Good", color: "bg-blue-500" }
  return { score: passed, label: "Strong", color: "bg-emerald-500" }
}
