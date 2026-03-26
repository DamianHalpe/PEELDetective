import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SignInButton } from "@/components/auth/sign-in-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/dashboard")
  }

  const { reset } = await searchParams

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="px-8 pb-2 pt-8 text-center">
          <CardTitle>Welcome back, Detective</CardTitle>
          <CardDescription>The case files are waiting for you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-8 pt-0">
          {reset === "success" && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400">
              Password reset successfully. Please sign in with your new password.
            </p>
          )}
          <SignInButton />
        </CardContent>
      </Card>
    </div>
  )
}
