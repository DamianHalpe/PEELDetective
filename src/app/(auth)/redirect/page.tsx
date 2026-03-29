import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRoleBasedRedirect } from "@/lib/session"

export default async function AuthRedirectPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  redirect(getRoleBasedRedirect((session.user as { role?: string }).role))
}
